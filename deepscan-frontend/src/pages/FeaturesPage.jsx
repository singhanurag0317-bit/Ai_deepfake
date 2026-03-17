import React from 'react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  return (
    <div className="page-wide">
      <header className="page-wide__hero">
        <div className="page-wide__hero-copy">
          <p className="page-wide__kicker">Product</p>
          <h1 className="page-wide__title">Features that make results readable</h1>
          <p className="page-wide__subtitle">
            DeepScan (AI Deepfake Detection Platform) is designed for clarity: upload an image, get an AI probability score,
            understand the “why” with a breakdown, and review metadata signals.
          </p>
          <div className="page-wide__hero-actions">
            <Link to="/" className="page-wide__btn page-wide__btn--primary">
              Start analyzing
            </Link>
            <Link to="/how-it-works" className="page-wide__btn page-wide__btn--secondary">
              See how it works
            </Link>
          </div>
        </div>

        <div className="page-wide__hero-art" aria-hidden="true">
          <div className="page-wide__art-card">
            <div className="page-wide__art-line" />
            <div className="page-wide__art-line page-wide__art-line--short" />
            <div className="page-wide__art-meter">
              <span />
            </div>
          </div>
          <div className="page-wide__art-card page-wide__art-card--offset">
            <div className="page-wide__art-chip">EXIF</div>
            <div className="page-wide__art-line" />
            <div className="page-wide__art-line page-wide__art-line--short" />
          </div>
        </div>
      </header>

      <section className="feature-grid" aria-label="Feature highlights">
        <article className="feature-card">
          <h2>Upload & preview</h2>
          <p>Drag-and-drop or browse. Preview the image before analysis. JPEG/PNG/WEBP up to 5MB.</p>
        </article>
        <article className="feature-card">
          <h2>AI probability score</h2>
          <p>Clear 0–100% score with a color meter: green (likely real), yellow (uncertain), red (likely AI).</p>
        </article>
        <article className="feature-card">
          <h2>Verdict + breakdown</h2>
          <p>See the overall verdict plus contributing signals (model, artifacts, metadata).</p>
        </article>
        <article className="feature-card feature-card--wide">
          <h2>Metadata signals</h2>
          <p>EXIF details (camera, software, timestamp). Missing values are flagged to highlight anomalies.</p>
        </article>
        <article className="feature-card">
          <h2>Fast feedback</h2>
          <p>Designed for a quick decision loop: upload → analyze → understand.</p>
        </article>
        <article className="feature-card">
          <h2>Responsive UI</h2>
          <p>Works cleanly on desktop and mobile with a professional, minimal interface.</p>
        </article>
      </section>
    </div>
  );
}
