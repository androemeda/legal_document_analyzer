# ⚖️ Legal Document Analyzer

An AI-powered legal document analysis platform that extracts structured data from legal documents, scores clauses for risk, and presents actionable insights through a clean, professional interface.

## 📸 Overview

Upload PDFs or images of legal documents, and the platform will:
- **Extract clauses**, key legal information, and numeric data using OpenAI GPT
- **Score each clause** for risk using regex-based pattern matching
- **Visualize risk distribution** with an interactive pie chart
- **Provide an AI-generated summary** and risk assessment

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, React Router DOM |
| **Backend** | Flask (Python), Gunicorn |
| **AI/LLM** | OpenAI GPT-5.2 API |
| **OCR** | GPT Vision API (for image uploads) |
| **PDF Parsing** | PyPDF |
| **Deployment** | DigitalOcean App Platform |

---

## 📁 Project Structure

```
legal-doc-analyzer/
├── backend/
│   ├── server.py                    # Flask server with all API endpoints
│   ├── clause_classification.json   # Regex rules for clause risk scoring
│   ├── requirements.txt             # Python dependencies
│   ├── Procfile                     # Gunicorn run command for deployment
│   └── .env                         # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # App entry point with BrowserRouter
│   │   ├── App.jsx                  # Route definitions (/ and /analyze)
│   │   ├── App.css                  # Global CSS reset
│   │   ├── index.css                # Design system & CSS custom properties
│   │   └── components/
│   │       ├── LandingPage.jsx      # Product landing page
│   │       ├── LandingPage.css
│   │       ├── AnalyzePage.jsx      # Upload & analysis interface
│   │       ├── AnalyzePage.css
│   │       ├── Results.jsx          # Analysis results with expandable blocks
│   │       ├── Results.css
│   │       ├── FileUpload.jsx       # (Legacy) original file upload component
│   │       └── FileUpload.css
│   ├── .env                         # Frontend env (VITE_API_URL)
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** (v3.9+)
- **OpenAI API Key** — [Get one here](https://platform.openai.com/api-keys)

### 1. Clone the Repository

```bash
git clone https://github.com/androemeda/legal_document_analyzer.git
cd legal_document_analyzer
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # or create .env manually
```

Add the following to `backend/.env`:

```env
OPENAI_API_KEY=your-openai-api-key-here
FRONTEND_URL=*
PORT=3001
DEBUG=true
```

Start the server:

```bash
python server.py
```

The backend runs at `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
```

Add the following to `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

Start the dev server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.

---

## 🔌 API Endpoints

### `GET /`
Health check endpoint.

**Response:** `"hi"`

---

### `POST /upload-pdf`
Upload a PDF document for text extraction and structured data extraction.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | PDF file to analyze |

**Response:**
```json
{
  "message": "PDF uploaded and analyzed successfully",
  "filename": "contract.pdf",
  "size": 71964,
  "extraction_stats": {
    "clauses_count": 12,
    "key_legal_info_count": 6,
    "numeric_data_count": 8
  },
  "clauses": [...],
  "key_legal_information": [...],
  "numeric_data": [...]
}
```

---

### `POST /upload-image`
Upload a JPG/PNG image of a legal document. Uses GPT Vision to extract text, then performs structured data extraction.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | JPG or PNG image |

**Response:** Same structure as `/upload-pdf`.

---

### `POST /get-response`
Triggers the full analysis pipeline: score all clauses, then generate an AI summary and risk assessment.

**Response:**
```json
{
  "success": true,
  "documents_analyzed": 2,
  "filenames": ["contract.pdf", "addendum.png"],
  "summary": "This employment agreement between...",
  "risk_assessment": "Overall risk level: MODERATE...",
  "clauses": [
    {
      "clause": "The Employee shall not engage in...",
      "risk_score": 3,
      "risk_level": "high",
      "doc_name": "contract.pdf",
      "doc_type": "pdf",
      "matched_rules": ["Non-compete restriction"]
    }
  ],
  "key_legal_information": [
    {
      "info": "Parties: ABC Corp and John Doe",
      "doc_name": "contract.pdf"
    }
  ],
  "numeric_data": [
    {
      "numeric_value": "₹50,000/month",
      "context": "Monthly salary"
    }
  ],
  "risk_distribution": {
    "high": 3,
    "moderate": 5,
    "low": 4,
    "total": 12
  }
}
```

---

## 🧠 Clause Risk Scoring

Clauses are scored using regex pattern matching against predefined rules in `clause_classification.json`.

### Rule Categories & Weights

| Category | Weight | Examples |
|---|---|---|
| **High Risk** | +3 | Termination without notice, sole discretion, indemnification, non-refundable penalties, training bonds, salary withholding, IP assignment, non-compete, unlimited liability |
| **Moderate Risk** | +2 | Confidentiality, probation period, relocation, background verification, overtime exclusion, amendment rights, automatic renewal, arbitration |
| **Low Risk** | -1 | Notice period, standard leave, gratuity, mutual termination, exit process, provident fund, insurance/benefits |

### Risk Level Thresholds

| Score | Risk Level |
|---|---|
| ≥ 3 | 🔴 **High** |
| ≥ 1 | 🟠 **Moderate** |
| < 1 | 🟢 **Low** |

### Scoring Formula

```
clause_risk_score = Σ (weight of each matched regex rule)

risk_level = HIGH   if score ≥ 3
           = MODERATE if score ≥ 1
           = LOW      if score < 1
```

---

## 🖥️ Frontend Architecture

### Routes

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Product showcase with hero, features, how-it-works |
| `/analyze` | `AnalyzePage` | Upload documents and view analysis results |

### Key Components

| Component | Purpose |
|---|---|
| `LandingPage` | Marketing page with CTA that navigates to `/analyze` |
| `AnalyzePage` | File upload (PDF + Image), triggers analysis, displays results |
| `Results` | Expandable blocks for clauses, key info, numeric data, pie chart |
| `ExpandBlock` | Reusable collapsible section component (inside Results.jsx) |
| `PieChart` | CSS conic-gradient pie chart for risk distribution |
| `ClauseItem` | Individual clause display with info popup |

### Design System

The app uses CSS custom properties defined in `index.css`:

| Variable | Color | Usage |
|---|---|---|
| `--black` | `#1a1a1a` | Primary text |
| `--white` | `#ffffff` | Backgrounds |
| `--red` | `#d32f2f` | High risk indicators |
| `--green` | `#388e3c` | Low risk / success |
| `--orange` | `#f57c00` | Moderate risk / warnings |
| `--charcoal` | `#333` | Secondary text |
| `--dark-gray` | `#555` | Muted text |
| `--mid-gray` | `#ddd` | Borders |
| `--light-gray` | `#f5f5f5` | Backgrounds |

---

## 🌐 Deployment

### DigitalOcean App Platform (Backend)

1. Push your code to GitHub
2. Create a new App on DigitalOcean → connect your repository
3. Set **Source Directory** to `backend`
4. Set **Run Command** to:
   ```
   gunicorn --worker-tmp-dir /dev/shm server:app
   ```
5. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `OPENAI_API_KEY` | Your OpenAI API key |
   | `FRONTEND_URL` | Your frontend domain (e.g. `https://your-app.com`) |

6. Deploy

### Frontend Deployment

Build the production bundle:

```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to any static hosting (Vercel, Netlify, DigitalOcean, etc.).

Update `frontend/.env` before building:

```env
VITE_API_URL=https://your-backend-url.ondigitalocean.app
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `FRONTEND_URL` | ❌ | `*` | Allowed CORS origin (`*` = all, or specific domain) |
| `PORT` | ❌ | `3001` | Server port |
| `DEBUG` | ❌ | `false` | Enable Flask debug mode |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | ❌ | `http://localhost:3001` | Backend API URL |

---

## 📋 Supported File Types

| Format | Method |
|---|---|
| **PDF** (.pdf) | Text extraction via PyPDF |
| **Image** (.jpg, .jpeg, .png) | OCR via GPT Vision API |

Multiple files can be uploaded before triggering analysis. The system processes all uploaded documents together.

---
