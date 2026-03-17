import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  return (
    <div className="how">
      <header className="how__hero">
        <div className="how__hero-copy">
          <p className="how__kicker">Guide</p>
          <h1 className="how__title">How DeepScan Works</h1>
          <p className="how__subtitle">
            Upload an image, run analysis, then read an AI probability score plus the signals behind it.
            DeepScan is an AI Deepfake Detection Platform built to be understandable—not just accurate.
          </p>
          <div className="how__cta-row">
            <Link to="/" className="how__btn how__btn--primary">Try it now</Link>
            <Link to="/features" className="how__btn how__btn--secondary">Explore features</Link>
          </div>
        </div>

        <aside className="how__hero-side" aria-label="Quick summary">
          <div className="how__side-card">
            <div className="how__side-label">You’ll get</div>
            <ul className="how__side-list">
              <li>Verdict label</li>
              <li>AI probability (0–100%)</li>
              <li>Score breakdown</li>
              <li>EXIF / metadata panel</li>
            </ul>
          </div>
        </aside>
      </header>

      <section className="how__steps" aria-label="Steps">
        <article className="how-step">
          <div className="how-step__num">01</div>
          <div className="how-step__body">
            <h2>Upload</h2>
            <p>Drag & drop or browse. Supported formats: JPEG, PNG, WEBP (max 5MB).</p>
          </div>
        </article>
        <article className="how-step">
          <div className="how-step__num">02</div>
          <div className="how-step__body">
            <h2>Analyze</h2>
            <p>DeepScan sends your image to the backend for inspection of patterns, artifacts, and metadata.</p>
          </div>
        </article>
        <article className="how-step how-step--wide">
          <div className="how-step__num">03</div>
          <div className="how-step__body">
            <h2>Understand the result</h2>
            <div className="how-step__cols">
              <div>
                <h3>What the score means</h3>
                <p>Higher = more likely AI-generated. Use the score as a signal, not absolute proof.</p>
              </div>
              <div>
                <h3>What we check</h3>
                <ul>
                  <li><strong>Model analysis</strong> — AI-like patterns</li>
                  <li><strong>Artifacts</strong> — texture/edge inconsistencies</li>
                  <li><strong>Metadata</strong> — missing or unusual EXIF</li>
                </ul>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
