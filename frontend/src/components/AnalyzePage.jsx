import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Results from './Results';
import './AnalyzePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AnalyzePage() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'pdf' ? '/upload-pdf' : '/upload-image';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadedFiles((prev) => [...prev, data]);
        setAnalysisData(null);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    setAnalysisData(null);

    try {
      const response = await fetch(`${API_URL}/get-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setAnalysisData(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="analyze-page">
      {/* Top Bar */}
      <nav className="analyze-nav">
        <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 15l2 2 4-4"/>
          </svg>
          <span>LegalLens</span>
        </div>
      </nav>

      <main className="analyze-main">
        {/* Upload Section */}
        <div className="upload-section">
          <h1>Upload Documents</h1>
          <p className="upload-hint">Upload PDFs or images of legal documents for analysis.</p>

          <div className="upload-row">
            <label htmlFor="pdf-upload" className={`upload-btn ${uploading ? 'disabled' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Upload PDF
            </label>
            <input id="pdf-upload" type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={uploading} hidden />

            <label htmlFor="image-upload" className={`upload-btn ${uploading ? 'disabled' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Upload Image
            </label>
            <input id="image-upload" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, 'image')} disabled={uploading} hidden />
          </div>

          {uploading && (
            <div className="status-msg uploading-msg">
              <div className="spinner" />
              <span>Uploading & extracting...</span>
            </div>
          )}

          {error && (
            <div className="status-msg error-msg">
              <span>{error}</span>
            </div>
          )}

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div className="files-list">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {file.filename}
                </div>
              ))}
            </div>
          )}

          {uploadedFiles.length > 0 && !analysisData && (
            <button
              className={`analyze-btn ${analyzing ? 'loading' : ''}`}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <div className="spinner white" />
                  Analyzing...
                </>
              ) : (
                'Analyze Documents'
              )}
            </button>
          )}
        </div>

        {/* Results */}
        {(analysisData || analyzing) && (
          <Results analysisData={analysisData} loading={analyzing} error={null} />
        )}
      </main>
    </div>
  );
}

export default AnalyzePage;
