# Legal Document Analyzer - Frontend

React frontend built with Vite for legal document analysis.

## Features

- Upload multiple documents (PDF, DOC/DOCX, Images)
- Text input for direct pasting
- Real-time analysis results
- Downloadable PDF reports
- Responsive design

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Technologies

- React 19
- Vite 7
- Axios
- CSS3 with custom styling

## Usage

1. Click on upload buttons to select files (PDF, DOC/DOCX, or Images)
2. Or paste text directly into the text area
3. Click "Analyze Documents" to process
4. View results including:
   - Executive summary
   - High-risk clauses
   - Key legal information (parties, obligations, dates)
5. Download report as PDF

## API Configuration

The frontend connects to the backend API at `http://localhost:5000`. Update the `API_BASE_URL` in component files if needed.
