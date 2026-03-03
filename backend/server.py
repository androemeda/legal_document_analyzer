from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import io
import os
import json
import base64
from pypdf import PdfReader
from openai import OpenAI

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

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

2. "key_legal_information": An array of key legal facts/information extracted from the document.
   Each object has:
   - "info": the key legal information text (string)

3. "numeric_data": An array of numeric values found in the document (dates, monetary amounts, percentages, durations, etc).
   Each object has:
   - "numeric_value": the numeric value as a string (e.g. "3000rs", "28 April 2026", "30 days", "15%")
   - "context": the context or sentence associated with that numeric value (string)

Example output:
{
  "clauses": [
    { "clause": "The Employee shall not engage in any competing business for a period of 12 months after termination." },
    { "clause": "Either party may terminate this agreement by providing 30 days written notice." }
  ],
  "key_legal_information": [
    { "info": "Parties: ABC Corp (Employer) and John Doe (Employee)" },
    { "info": "Governing Law: Laws of India, jurisdiction of Mumbai courts" },
    { "info": "Employee role: Senior Software Engineer, reporting to CTO" }
  ],
  "numeric_data": [
    { "numeric_value": "3000rs", "context": "3000rs of fixed deposit is needed as security" },
    { "numeric_value": "28 April 2026", "context": "Agreement is valid till 28 April 2026" },
    { "numeric_value": "30 days", "context": "Either party must provide 30 days written notice for termination" },
    { "numeric_value": "50000rs per month", "context": "Monthly salary payable is 50000rs per month" }
  ]
}

Extract ALL clauses, legal information, and numeric data you can find. Be thorough and accurate. Return ONLY the JSON object, nothing else."""

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
        # Build document context from the structured arrays
        clauses_text = "\n".join([f"- [{c['doc_name']}] {c['clause']}" for c in clauses])
        info_text = "\n".join([f"- [{k['doc_name']}] {k['info']}" for k in key_legal_information])
        numeric_text = "\n".join([f"- {n['numeric_value']}: {n['context']}" for n in numeric_data])

        document_context = f"""CLAUSES EXTRACTED:
{clauses_text}

KEY LEGAL INFORMATION:
{info_text}

NUMERIC DATA:
{numeric_text}"""

        # Create system prompt for legal document analysis
        system_prompt = """You are an expert legal document analyzer specializing in contract review and risk assessment. 
You are given pre-extracted structured data from legal documents including clauses, key legal information, and numeric data.

Your task is to analyze this data and provide:

1. A concise summary of the document's purpose and main provisions
2. Identification of HIGH-RISK CLAUSES: flag which of the provided clauses are risky and why
3. Overall risk assessment

You must respond ONLY with a valid JSON object in the following format:
{
  "summary": "A clear, concise summary of the document (2-4 sentences)",
  "risk_assessment": "Overall risk level: LOW / MODERATE / HIGH with brief justification",
  "high_risk_clause_indices": [0, 2, 5],
  "risk_explanations": {
    "0": "Explanation of why clause at index 0 is risky",
    "2": "Explanation of why clause at index 2 is risky"
  }
}

The high_risk_clause_indices should be the indices (0-based) of clauses from the clauses array that you consider high risk.
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
        
        return jsonify({
            'success': True,
            'documents_analyzed': len(all_doc_names),
            'filenames': all_doc_names,
            'summary': analysis_result.get('summary', ''),
            'risk_assessment': analysis_result.get('risk_assessment', ''),
            'clauses': clauses,
            'key_legal_information': key_legal_information,
            'numeric_data': numeric_data,
            'high_risk_clause_indices': analysis_result.get('high_risk_clause_indices', []),
            'risk_explanations': analysis_result.get('risk_explanations', {})
        }), 200
        
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Failed to parse AI response: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Error analyzing document: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
