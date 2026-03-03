import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Results from './components/Results';
import './App.css';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const handleUploadSuccess = (data) => {
    setUploadedFiles((prev) => [...prev, data]);
    // Clear any previous analysis when new files are uploaded
    setAnalysisData(null);
    setAnalysisError('');
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisData(null);

    try {
      const response = await fetch('http://localhost:3001/get-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisData(data);
      } else {
        setAnalysisError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setAnalysisError(
        'Failed to connect to server. Make sure the backend is running.',
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Legal Document Analyzer</h1>
        <p className="subtitle">AI-Powered Contract Review & Risk Assessment</p>
      </header>

      <main className="app-main">
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          uploadedFiles={uploadedFiles}
        />

        <div className="analyze-section">
          <button
            className={`analyze-btn ${uploadedFiles.length === 0 ? 'disabled' : ''}`}
            onClick={handleAnalyze}
            disabled={uploadedFiles.length === 0 || analyzing}
          >
            {analyzing ? (
              <>
                <div className="btn-spinner"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>Analyze Documents</span>
              </>
            )}
          </button>
          {uploadedFiles.length === 0 && (
            <p className="analyze-hint">
              Upload at least one document to enable analysis
            </p>
          )}
        </div>

        {(analysisData || analyzing || analysisError) && (
          <Results
            analysisData={analysisData}
            loading={analyzing}
            error={analysisError}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Legal Document Analyzer.</p>
      </footer>
    </div>
  );
}

export default App;
