import { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onUploadSuccess, uploadedFiles }) {
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
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(
        'Failed to connect to server. Make sure the backend is running on port 3001.',
      );
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload Documents</h2>
      <p className="upload-description">
        Upload PDF documents or images (JPG/PNG) to analyze. You can upload
        multiple files.
      </p>

      <div className="upload-buttons">
        <div className="upload-button-wrapper">
          <label
            htmlFor="pdf-upload"
            className={`upload-btn pdf-btn ${uploading ? 'disabled' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Upload PDF</span>
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileUpload(e, 'pdf')}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>

        <div className="upload-button-wrapper">
          <label
            htmlFor="image-upload"
            className={`upload-btn image-btn ${uploading ? 'disabled' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Upload Image</span>
          </label>
          <input
            id="image-upload"
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(e, 'image')}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {uploading && (
        <div className="upload-status uploading">
          <div className="spinner"></div>
          <span>Uploading and extracting text...</span>
        </div>
      )}

      {error && (
        <div className="upload-status error">
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>Uploaded Files ({uploadedFiles.length})</h3>
          <ul className="file-list">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="file-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="file-name">{file.filename}</span>
                <span className="file-size">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
