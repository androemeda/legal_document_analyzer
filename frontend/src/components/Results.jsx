import { useState } from 'react';
import './Results.css';

function ExpandBlock({ title, icon, badge, badgeClass, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`expand-block ${open ? 'open' : ''}`}>
      <button className="expand-header" onClick={() => setOpen(!open)}>
        <div className="expand-left">
          {icon}
          <span className="expand-title">{title}</span>
          {badge && <span className={`expand-badge ${badgeClass || ''}`}>{badge}</span>}
        </div>
        <svg
          className={`chevron ${open ? 'rotated' : ''}`}
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className="expand-body">{children}</div>}
    </div>
  );
}

function ClauseItem({ clause, index }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={`clause-row ${clause.risk_level}`}>
      <div className="clause-left">
        <span className={`risk-dot ${clause.risk_level}`} />
        <span className="clause-text">{clause.clause}</span>
      </div>
      <button className="info-btn" onClick={() => setShowInfo(!showInfo)} title="Details">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
      {showInfo && (
        <div className="clause-info-popup">
          <div className="info-row"><span className="info-label">Risk Score</span><span className="info-value">{clause.risk_score}</span></div>
          <div className="info-row"><span className="info-label">Risk Level</span><span className={`info-value level-${clause.risk_level}`}>{clause.risk_level}</span></div>
          <div className="info-row"><span className="info-label">Document</span><span className="info-value">{clause.doc_name}</span></div>
          <div className="info-row"><span className="info-label">Source</span><span className="info-value">{clause.doc_type}</span></div>
          {clause.matched_rules && clause.matched_rules.length > 0 && (
            <div className="info-row rules">
              <span className="info-label">Matched Rules</span>
              <ul>{clause.matched_rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Results({ analysisData, loading, error }) {
  if (loading) {
    return (
      <div className="results-wrap">
        <div className="loading-box">
          <div className="loader" />
          <p>Analyzing documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-wrap">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!analysisData) return null;

  const highClauses = (analysisData.clauses || []).filter(c => c.risk_level === 'high');
  const moderateClauses = (analysisData.clauses || []).filter(c => c.risk_level === 'moderate');

  return (
    <div className="results-wrap">
      {/* Summary bar */}
      <div className="summary-bar">
        <h2>Analysis Summary</h2>
        <p>{analysisData.summary}</p>
      </div>

      {/* Clauses */}
      <ExpandBlock
        title="Clauses"
        badge={`${(analysisData.clauses || []).length} flagged`}
        badgeClass="red"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        }
      >
        {highClauses.length > 0 && (
          <ExpandBlock
            title="High Risk"
            badge={highClauses.length}
            badgeClass="red"
            defaultOpen={false}
            icon={<span className="risk-dot high" />}
          >
            {highClauses.map((c, i) => <ClauseItem key={`h-${i}`} clause={c} index={i} />)}
          </ExpandBlock>
        )}
        {moderateClauses.length > 0 && (
          <ExpandBlock
            title="Moderate Risk"
            badge={moderateClauses.length}
            badgeClass="orange"
            defaultOpen={false}
            icon={<span className="risk-dot moderate" />}
          >
            {moderateClauses.map((c, i) => <ClauseItem key={`m-${i}`} clause={c} index={i} />)}
          </ExpandBlock>
        )}
        {highClauses.length === 0 && moderateClauses.length === 0 && (
          <p className="empty-msg">No risky clauses detected.</p>
        )}
      </ExpandBlock>

      {/* Key Legal Information */}
      <ExpandBlock
        title="Key Legal Information"
        badge={`${(analysisData.key_legal_information || []).length} items`}
        badgeClass="green"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        }
      >
        {(analysisData.key_legal_information || []).length > 0 ? (
          <ul className="info-list">
            {analysisData.key_legal_information.map((item, i) => (
              <li key={i} className="info-list-item">
                <span className="info-text">{item.info}</span>
                <span className="info-doc">{item.doc_name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">No key legal information extracted.</p>
        )}
      </ExpandBlock>

      {/* Numeric Data */}
      <ExpandBlock
        title="Key Numbers & Dates"
        badge={`${(analysisData.numeric_data || []).length} values`}
        badgeClass="orange"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        }
      >
        {(analysisData.numeric_data || []).length > 0 ? (
          <div className="numeric-grid">
            {analysisData.numeric_data.map((item, i) => (
              <div key={i} className="numeric-card">
                <div className="numeric-val">{item.numeric_value}</div>
                <div className="numeric-ctx">{item.context}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-msg">No numeric data found.</p>
        )}
      </ExpandBlock>
    </div>
  );
}

export default Results;
