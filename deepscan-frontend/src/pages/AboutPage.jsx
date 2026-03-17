import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="about">
      <header className="about__hero">
        <div className="about__hero-left">
          <p className="about__kicker">DeepScan</p>
          <h1 className="about__title">Built for clarity in an AI-heavy world</h1>
          <p className="about__subtitle">
            AI Deepfake Detection Platform. DeepScan helps you make faster, more informed decisions by
            turning complex signals into a readable score and breakdown.
          </p>
          <div className="about__hero-actions">
            <Link to="/" className="about__btn about__btn--primary">Try DeepScan</Link>
            <Link to="/contact" className="about__btn about__btn--secondary">Get in touch</Link>
          </div>
        </div>

        <div className="about__hero-right" aria-hidden="true">
          <div className="about__stat">
            <div className="about__stat-label">Signal set</div>
            <div className="about__stat-value">3-part</div>
            <div className="about__stat-sub">model • artifacts • metadata</div>
          </div>
          <div className="about__stat about__stat--muted">
            <div className="about__stat-label">Output</div>
            <div className="about__stat-value">0–100%</div>
            <div className="about__stat-sub">probability-style score</div>
          </div>
        </div>
      </header>

      <section className="about__timeline" aria-label="What we prioritize">
        <div className="about__timeline-item">
          <div className="about__dot" />
          <div className="about__timeline-body">
            <h2>Readable results</h2>
            <p>Verdict + confidence meter + breakdown so the score is explainable.</p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__dot" />
          <div className="about__timeline-body">
            <h2>Practical signals</h2>
            <p>We surface what’s most useful: artifacts and metadata anomalies alongside model signals.</p>
          </div>
        </div>
        <div className="about__timeline-item">
          <div className="about__dot" />
          <div className="about__timeline-body">
            <h2>Privacy minded</h2>
            <p>Your uploads are used for analysis. We don’t sell or share your data.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
