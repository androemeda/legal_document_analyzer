import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 15l2 2 4-4"/>
          </svg>
          <span>LegalLens</span>
        </div>
        <button className="nav-cta" onClick={() => navigate('/analyze')}>
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Legal Analysis</div>
          <h1>Understand Your<br />Legal Documents<br /><span className="hero-accent">In Seconds</span></h1>
          <p className="hero-desc">
            Upload contracts, agreements, or any legal document. Our AI identifies
            risky clauses, extracts key information, and surfaces critical data — so you
            don't have to read every line.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/analyze')}>
              Analyze a Document
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>Why LegalLens?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3>Risk Detection</h3>
            <p>Automatically flags high-risk and moderate-risk clauses using pattern-based analysis and AI scoring.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <h3>Key Information</h3>
            <p>Extracts parties, obligations, governing law, and other critical legal facts at a glance.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h3>Numeric Insights</h3>
            <p>Surfaces all dates, monetary values, percentages, and durations in a structured view.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon black">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3>Unlimited Uploads</h3>
            <p>Upload as many PDFs and images as you need. No file limits, no restrictions.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload</h3>
            <p>Upload your PDF or image of a legal document.</p>
          </div>
          <div className="step-connector"/>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Extract</h3>
            <p>AI extracts clauses, key info, and numeric data.</p>
          </div>
          <div className="step-connector"/>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Analyze</h3>
            <p>Risk scoring and comprehensive analysis in seconds.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to analyze your documents?</h2>
        <p>Start for free. No sign-up required.</p>
        <button className="btn-primary large" onClick={() => navigate('/analyze')}>
          Start Analyzing
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 LegalLens. AI-Powered Legal Document Analysis.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
