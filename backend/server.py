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

# Store all extracted texts in memory
extracted_texts = []

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
        
        # Add extracted text to array
        extracted_texts.append({
            'type': 'pdf',
            'filename': filename,
            'text': extracted_text
        })
        
        return jsonify({
            'message': 'PDF uploaded successfully',
            'filename': filename,
            'size': len(pdf_content),
            'text': extracted_text
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
            # Extract text using GPT-4o-mini vision API
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
            
            # Add extracted text to array
            extracted_texts.append({
                'type': 'image',
                'filename': filename,
                'text': extracted_text
            })
            
            return jsonify({
                'message': 'Image uploaded successfully',
                'filename': filename,
                'size': len(image_content),
                'text': extracted_text
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Error extracting text from image: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Only JPG and PNG files are allowed'}), 400

@app.route('/get-response', methods=['POST'])
def get_response():
    # Check if we have any extracted texts
    if not extracted_texts:
        return jsonify({'error': 'No documents uploaded. Please upload a PDF or image first'}), 400
    
    # Combine all extracted texts
    document_text = "\n\n--- Document Separator ---\n\n".join([item['text'] for item in extracted_texts])
    
    if not document_text.strip():
        return jsonify({'error': 'No text found in the uploaded PDF'}), 400
    
    try:
        # Create system prompt for legal document analysis
        system_prompt = """You are an expert legal document analyzer specializing in contract review and risk assessment. 
Your task is to analyze legal documents and provide comprehensive insights focusing on:

1. A concise summary of the document's purpose and main provisions
2. Identification of HIGH-RISK CLAUSES including:
   - Unfair or one-sided termination conditions
   - Hidden financial liabilities, penalties, or fees
   - One-sided obligations that disproportionately favor one party
   - Ambiguous language that could lead to disputes
   - Unusual or restrictive confidentiality/non-compete clauses
   - Automatic renewal or extension clauses
   - Limitation of liability clauses that may be unfavorable
   
3. Extraction of KEY LEGAL INFORMATION:
   - All parties involved (names, roles)
   - Key obligations and responsibilities of each party
   - Important dates, deadlines, and time periods
   - Payment terms and financial obligations
   - Termination conditions and notice periods
   - Governing law and jurisdiction

You must respond ONLY with a valid JSON object in the following format:
{
  "summary": "A clear, concise summary of the document (2-4 sentences)",
  "high_risk_clauses": [
    "Description of risk 1 with specific clause reference",
    "Description of risk 2 with specific clause reference"
  ],
  "key_legal_info": [
    "Parties: [list of parties and their roles]",
    "Key obligations: [main obligations]",
    "Important dates: [dates and deadlines]",
    "Payment terms: [if applicable]",
    "Termination: [termination conditions]",
    "Other critical information"
  ]
}

Be specific, cite relevant sections when possible, and focus on actionable insights. If no high-risk clauses are found, return an empty array."""

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Please analyze the following legal document:\n\n{document_text}"}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        # Extract and parse the response
        analysis_result = json.loads(response.choices[0].message.content)
        
        return jsonify({
            'success': True,
            'documents_analyzed': len(extracted_texts),
            'filenames': [item['filename'] for item in extracted_texts],
            'summary': analysis_result.get('summary', ''),
            'high_risk_clauses': analysis_result.get('high_risk_clauses', []),
            'key_legal_info': analysis_result.get('key_legal_info', [])
        }), 200
        
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Failed to parse AI response: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Error analyzing document: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
