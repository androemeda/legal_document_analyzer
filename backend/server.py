from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import io
import os
import json
import re
import base64
from dotenv import load_dotenv
from pypdf import PdfReader
from openai import OpenAI

load_dotenv()

app = Flask(__name__)

# CORS: allow specific frontend origin in production, all origins in dev
frontend_url = os.environ.get("FRONTEND_URL", "*")
if frontend_url == "*":
    CORS(app)
else:
    CORS(app, origins=[frontend_url])

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Load clause classification rules
with open(os.path.join(os.path.dirname(__file__), 'clause_classification.json'), 'r') as f:
    clause_rules = json.load(f)

# Store structured extracted data in memory
clauses = []              # { risk_score, clause, doc_name, doc_type }
key_legal_information = [] # { info, doc_name, doc_type }
numeric_data = []         # { numeric_value, context }


def extract_text_from_pdf(pdf_content):
    """Extract text from PDF content stored in memory"""
    try:
        pdf_file = io.BytesIO(pdf_content)
        reader = PdfReader(pdf_file)
        
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")


def extract_structured_data(text, doc_name, doc_type):
    """
    Send extracted text to OpenAI and get back structured JSON
    with clauses, key_legal_information, and numeric_data.
    Appends results to the global arrays.
    """
    extraction_prompt = """You are a legal document data extraction expert. Given a legal document's text, extract and return a JSON object with exactly three arrays:

1. "clauses": An array of clause objects found in the document. Each clause is a distinct legal provision, term, condition, or obligation.
   Each object has:
   - "clause": the text of the clause (string)

2. "key_legal_information": An array of ONLY the most important legal facts. Keep each item to a single concise line. Skip trivial or obvious information. Focus on: parties involved, governing law, jurisdiction, key obligations, termination conditions, and critical terms.
   Each object has:
   - "info": a short, single-line key legal fact (string)

3. "numeric_data": An array of numeric values found in the document (dates, monetary amounts, percentages, durations, etc).
   Each object has:
   - "numeric_value": the numeric value as a string (e.g. "3000rs", "28 April 2026", "30 days", "15%")
   - "context": a short sentence describing what this value relates to (string)

Example output:
{
  "clauses": [
    { "clause": "The Employee shall not engage in any competing business for a period of 12 months after termination." },
    { "clause": "Either party may terminate this agreement by providing 30 days written notice." }
  ],
  "key_legal_information": [
    { "info": "Parties: ABC Corp (Employer) and John Doe (Employee)" },
    { "info": "Governing Law: Laws of India, Mumbai courts" },
    { "info": "Role: Senior Software Engineer, reporting to CTO" }
  ],
  "numeric_data": [
    { "numeric_value": "₹3,000", "context": "Security deposit required" },
    { "numeric_value": "28 April 2026", "context": "Agreement validity end date" },
    { "numeric_value": "30 days", "context": "Termination notice period" },
    { "numeric_value": "₹50,000/month", "context": "Monthly salary" }
  ]
}

Be thorough with clauses and numeric data. For key_legal_information, include ONLY important facts (max 8-10 items), each as a short single line. Return ONLY the JSON object."""

    try:
        response = client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": f"Extract structured data from the following legal document:\n\n{text}"}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        extracted_clauses = result.get("clauses", [])
        extracted_info = result.get("key_legal_information", [])
        extracted_numeric = result.get("numeric_data", [])

        # Append clauses with doc metadata and null risk_score
        for c in extracted_clauses:
            clauses.append({
                "risk_score": None,
                "clause": c.get("clause", ""),
                "doc_name": doc_name,
                "doc_type": doc_type
            })

        # Append key legal information with doc metadata
        for info in extracted_info:
            key_legal_information.append({
                "info": info.get("info", ""),
                "doc_name": doc_name,
                "doc_type": doc_type
            })

        # Append numeric data
        for nd in extracted_numeric:
            numeric_data.append({
                "numeric_value": nd.get("numeric_value", ""),
                "context": nd.get("context", "")
            })

        return {
            "clauses_count": len(extracted_clauses),
            "key_legal_info_count": len(extracted_info),
            "numeric_data_count": len(extracted_numeric)
        }

    except Exception as e:
        raise Exception(f"Error extracting structured data via OpenAI: {str(e)}")


def score_clauses():
    """
    Score each clause in the clauses array using regex rules from clause_classification.json.
    Each clause gets a risk_score based on matching patterns:
      - high_risk rules have weight 3
      - moderate_risk rules have weight 2
      - low_risk rules have weight -1 (reduce score)
    Final risk_score determines the risk level:
      - score >= 3 → 'high'
      - score >= 1 → 'moderate'
      - score < 1  → 'low'
    """
    for clause_obj in clauses:
        text = clause_obj['clause'].lower()
        score = 0
        matched_rules = []

        # Check against high_risk rules
        for rule in clause_rules.get('high_risk', []):
            if re.search(rule['regex'], text, re.IGNORECASE):
                score += rule['weight']
                matched_rules.append(rule['description'])

        # Check against moderate_risk rules
        for rule in clause_rules.get('moderate_risk', []):
            if re.search(rule['regex'], text, re.IGNORECASE):
                score += rule['weight']
                matched_rules.append(rule['description'])

        # Check against low_risk rules (these reduce the score)
        for rule in clause_rules.get('low_risk', []):
            if re.search(rule['regex'], text, re.IGNORECASE):
                score += rule['weight']
                matched_rules.append(rule['description'])

        # Assign risk level based on final score
        if score >= 3:
            risk_level = 'high'
        elif score >= 1:
            risk_level = 'moderate'
        else:
            risk_level = 'low'

        clause_obj['risk_score'] = score
        clause_obj['risk_level'] = risk_level
        clause_obj['matched_rules'] = matched_rules


@app.route('/')
def hello():
    return 'hi'

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    print("Request files:", request.files)
    print("Request form:", request.form)
    print("Content-Type:", request.content_type)
    
    if 'file' not in request.files:
        return jsonify({
            'error': 'No file part',
            'received_keys': list(request.files.keys()),
            'hint': 'Make sure to use "file" as the form-data key in Postman'
        }), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        # Read file content into memory
        pdf_content = file.read()
        
        # Extract text from PDF
        try:
            extracted_text = extract_text_from_pdf(pdf_content)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
        # Extract structured data via OpenAI
        try:
            extraction_stats = extract_structured_data(extracted_text, filename, "pdf")
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
        return jsonify({
            'message': 'PDF uploaded and analyzed successfully',
            'filename': filename,
            'size': len(pdf_content),
            'extraction_stats': extraction_stats,
            'clauses': [c for c in clauses if c['doc_name'] == filename],
            'key_legal_information': [k for k in key_legal_information if k['doc_name'] == filename],
            'numeric_data': numeric_data  # numeric_data doesn't have doc_name, return all recent
        }), 200
    else:
        return jsonify({'error': 'Only PDF files are allowed'}), 400

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Check if file is JPG or PNG
    if file and (file.filename.lower().endswith('.jpg') or 
                 file.filename.lower().endswith('.jpeg') or 
                 file.filename.lower().endswith('.png')):
        filename = secure_filename(file.filename)
        
        # Read image content
        image_content = file.read()
        
        # Encode image to base64
        base64_image = base64.b64encode(image_content).decode('utf-8')
        
        # Determine image type
        image_type = "image/png" if filename.lower().endswith('.png') else "image/jpeg"
        
        try:
            # Extract text using GPT vision API
            response = client.chat.completions.create(
                model="gpt-5.2",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all text from this image accurately, preserving layout and formatting. If this appears to be a legal document, maintain the structure and capture all text including headers, footers, and any fine print."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{image_type};base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
            )
            
            extracted_text = response.choices[0].message.content
            
            # Extract structured data via OpenAI
            try:
                extraction_stats = extract_structured_data(extracted_text, filename, "image")
            except Exception as e:
                return jsonify({'error': str(e)}), 500
            
            return jsonify({
                'message': 'Image uploaded and analyzed successfully',
                'filename': filename,
                'size': len(image_content),
                'extraction_stats': extraction_stats,
                'clauses': [c for c in clauses if c['doc_name'] == filename],
                'key_legal_information': [k for k in key_legal_information if k['doc_name'] == filename],
                'numeric_data': numeric_data
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error extracting text from image: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Only JPG and PNG files are allowed'}), 400

@app.route('/get-response', methods=['POST'])
def get_response():
    # Check if we have any structured data
    if not clauses and not key_legal_information and not numeric_data:
        return jsonify({'error': 'No documents uploaded. Please upload a PDF or image first'}), 400
    
    try:
        # Score all clauses using clause_classification.json rules
        score_clauses()

        # Filter only high and moderate risk clauses
        risky_clauses = [c for c in clauses if c.get('risk_level') in ('high', 'moderate')]

        # Build document context from the structured arrays
        clauses_text = "\n".join([f"- [{c['doc_name']}] (risk: {c['risk_level']}, score: {c['risk_score']}) {c['clause']}" for c in risky_clauses])
        info_text = "\n".join([f"- [{k['doc_name']}] {k['info']}" for k in key_legal_information])
        numeric_text = "\n".join([f"- {n['numeric_value']}: {n['context']}" for n in numeric_data])

        document_context = f"""HIGH & MODERATE RISK CLAUSES:
{clauses_text}

KEY LEGAL INFORMATION:
{info_text}

NUMERIC DATA:
{numeric_text}"""

        # Create system prompt for legal document analysis
        system_prompt = """You are an expert legal document analyzer specializing in contract review and risk assessment. 
You are given pre-extracted structured data from legal documents including risky clauses (already scored), key legal information, and numeric data.

Your task is to analyze this data and provide:

1. A concise summary of the document's purpose and main provisions
2. Overall risk assessment based on the flagged clauses

You must respond ONLY with a valid JSON object in the following format:
{
  "summary": "A clear, concise summary of the document (2-4 sentences)",
  "risk_assessment": "Overall risk level: LOW / MODERATE / HIGH with brief justification"
}

Be specific, cite relevant content when possible, and focus on actionable insights."""

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Please analyze the following extracted legal document data:\n\n{document_context}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        analysis_result = json.loads(response.choices[0].message.content)
        
        # Get unique doc names
        all_doc_names = list(set(
            [c['doc_name'] for c in clauses] + 
            [k['doc_name'] for k in key_legal_information]
        ))
        
        # Compute risk distribution
        high_count = sum(1 for c in clauses if c.get('risk_level') == 'high')
        moderate_count = sum(1 for c in clauses if c.get('risk_level') == 'moderate')
        low_count = sum(1 for c in clauses if c.get('risk_level') == 'low')

        return jsonify({
            'success': True,
            'documents_analyzed': len(all_doc_names),
            'filenames': all_doc_names,
            'summary': analysis_result.get('summary', ''),
            'risk_assessment': analysis_result.get('risk_assessment', ''),
            'clauses': risky_clauses,
            'key_legal_information': key_legal_information,
            'numeric_data': numeric_data,
            'risk_distribution': {
                'high': high_count,
                'moderate': moderate_count,
                'low': low_count,
                'total': len(clauses)
            }
        }), 200
        
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Failed to parse AI response: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Error analyzing document: {str(e)}'}), 500

if __name__ == '__main__':
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=debug)
