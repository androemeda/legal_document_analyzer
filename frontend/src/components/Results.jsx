import './Results.css';

function Results({ analysisData, loading, error }) {
  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-state">
          <div className="large-spinner"></div>
          <h3>Analyzing Documents...</h3>
          <p>This may take a few moments. Please wait.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container">
        <div className="error-state">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
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
          <h3>Analysis Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const highRiskIndices = analysisData.high_risk_clause_indices || [];
  const riskExplanations = analysisData.risk_explanations || {};

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Analysis Results</h2>
        <p className="analyzed-files">
          Analyzed {analysisData.documents_analyzed} document
          {analysisData.documents_analyzed > 1 ? 's' : ''}
        </p>
      </div>

      <div className="results-content">
        {/* Summary Section */}
        <div className="result-section summary-section">
          <div className="section-header">
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
            </svg>
            <h3>Executive Summary</h3>
          </div>
          <p className="summary-text">{analysisData.summary}</p>
          {analysisData.risk_assessment && (
            <p className="risk-assessment-text">
              <strong>Risk Assessment:</strong> {analysisData.risk_assessment}
            </p>
          )}
        </div>

        {/* Clauses Section */}
        <div className="result-section risk-section">
          <div className="section-header risk-header">
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
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h3>Clauses</h3>
            <span className="badge risk-badge">
              {analysisData.clauses?.length || 0} found
              {highRiskIndices.length > 0 && ` · ${highRiskIndices.length} high risk`}
            </span>
          </div>

          {analysisData.clauses && analysisData.clauses.length > 0 ? (
            <ul className="risk-list">
              {analysisData.clauses.map((clause, index) => {
                const isHighRisk = highRiskIndices.includes(index);
                return (
                  <li
                    key={index}
                    className={`risk-item ${isHighRisk ? 'high-risk' : ''}`}
                  >
                    <div className={`risk-marker ${isHighRisk ? 'danger' : 'safe'}`}>
                      {index + 1}
                    </div>
                    <div className="clause-content">
                      <p>{clause.clause}</p>
                      <div className="clause-meta">
                        <span className="doc-badge">{clause.doc_name}</span>
                        <span className="type-badge">{clause.doc_type}</span>
                        {isHighRisk && (
                          <span className="risk-label">⚠ High Risk</span>
                        )}
                      </div>
                      {isHighRisk && riskExplanations[String(index)] && (
                        <p className="risk-explanation">
                          {riskExplanations[String(index)]}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="no-risks">
              <p>No clauses extracted from the documents.</p>
            </div>
          )}
        </div>

        {/* Key Legal Information Section */}
        <div className="result-section legal-info-section">
          <div className="section-header info-header">
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h3>Key Legal Information</h3>
            <span className="badge info-badge">
              {analysisData.key_legal_information?.length || 0} items
            </span>
          </div>

          {analysisData.key_legal_information &&
          analysisData.key_legal_information.length > 0 ? (
            <ul className="legal-info-list">
              {analysisData.key_legal_information.map((item, index) => (
                <li key={index} className="legal-info-item">
                  <div className="info-bullet"></div>
                  <div className="info-content">
                    <p>{item.info}</p>
                    <div className="clause-meta">
                      <span className="doc-badge">{item.doc_name}</span>
                      <span className="type-badge">{item.doc_type}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-risks">
              <p>No key legal information extracted.</p>
            </div>
          )}
        </div>

        {/* Numeric Data Section */}
        <div className="result-section numeric-section">
          <div className="section-header numeric-header">
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
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h3>Numeric Data</h3>
            <span className="badge numeric-badge">
              {analysisData.numeric_data?.length || 0} values
            </span>
          </div>

          {analysisData.numeric_data && analysisData.numeric_data.length > 0 ? (
            <ul className="numeric-list">
              {analysisData.numeric_data.map((item, index) => (
                <li key={index} className="numeric-item">
                  <div className="numeric-value-badge">{item.numeric_value}</div>
                  <p className="numeric-context">{item.context}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-risks">
              <p>No numeric data found in the documents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Results;
