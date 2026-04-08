import React from 'react';
import ConfidenceMeter from './ConfidenceMeter';

export default function ResultCard({
  score,
  verdict,
  model_score: modelScore,
  metadata_score: metadataScore,
}) {
  return (
    <section className="result-card">
      <div className="result-card__header">
        <div className="result-card__title">Verdict</div>
        <div className="result-card__verdict">{verdict || 'Pending'}</div>
      </div>

      <ConfidenceMeter score={score} />

      <div className="result-card__breakdown">
        <div className="result-card__breakdown-title">Score Breakdown</div>
        <div className="result-card__breakdown-grid">
          <div className="result-card__breakdown-item">
            <span>Model Score</span>
            <strong>{modelScore ?? '--'}</strong>
          </div>
          <div className="result-card__breakdown-item">
            <span>Metadata Score</span>
            <strong>{metadataScore ?? '--'}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

