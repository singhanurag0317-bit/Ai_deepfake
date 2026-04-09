import React from 'react';
import UploadZone from '../components/UploadZone';

export default function CheckerPage() {
  return (
    <div className="checker-page">
      {/* Hero Header */}
      <div className="checker-page__hero">
        <div className="checker-page__badge">
          <span className="checker-page__badge-dot" />
          SYSTEM_STATUS: NEURAL_ENGINE_ACTIVE
        </div>
        <h1 className="checker-page__title">
          Media <span>Authenticity</span> Audit
        </h1>
        <p className="checker-page__subtitle">
          Running DenseNet-121 core — upload media to execute deepfake 
          probability inference with sub-pixel artifact analysis.
        </p>
      </div>

      {/* Two column layout */}
      <div className="checker-page__body">
        {/* Left: Upload zone */}
        <div className="checker-page__main">
          <UploadZone id="analyzer" />
        </div>

        {/* Right: Info sidebar */}
        <aside className="checker-page__sidebar">
          <div className="checker-sidebar__card">
            <div className="checker-sidebar__label">Engine Specifications</div>
            <ul className="checker-sidebar__list">
              <li>
                <span className="checker-sidebar__chip">🧠</span>
                <div>
                  <strong>Neural Scan</strong>
                  <p>DenseNet-121 core architecture for pixel-level check</p>
                </div>
              </li>
              <li>
                <span className="checker-sidebar__chip">📊</span>
                <div>
                  <strong>EXIF Vault</strong>
                  <p>Metadata stream analysis and integrity check</p>
                </div>
              </li>
              <li>
                <span className="checker-sidebar__chip">⚡</span>
                <div>
                  <strong>Verdict CLI</strong>
                  <p>High-confidence classification with score breakdown</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="checker-sidebar__card checker-sidebar__card--tips">
            <div className="checker-sidebar__label">Inference Tips</div>
            <div className="checker-sidebar__tip">
              <span>✓</span> High-res samples yield higher confidence
            </div>
            <div className="checker-sidebar__tip">
              <span>✓</span> Supported: JPG, PNG, WEBP, MP4, MOV
            </div>
            <div className="checker-sidebar__tip">
              <span>✓</span> Results include per-layer neural breakdown
            </div>
            <div className="checker-sidebar__tip">
              <span>✓</span> 91k real and 91k AI generated images are used to verify the dataset of ML model
            </div>
          </div>

          <div className="checker-sidebar__stat-row">
            <div className="checker-sidebar__stat">
              <span className="checker-sidebar__stat-val">182K</span>
              <span className="checker-sidebar__stat-lbl">Dataset</span>
            </div>
            <div className="checker-sidebar__stat">
              <span className="checker-sidebar__stat-val">Core</span>
              <span className="checker-sidebar__stat-lbl">DenseNet-121</span>
            </div>
            <div className="checker-sidebar__stat">
              <span className="checker-sidebar__stat-val">&lt;2s</span>
              <span className="checker-sidebar__stat-lbl">Latency</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}