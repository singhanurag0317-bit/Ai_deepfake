import React from 'react';
import UploadZone from '../components/UploadZone';

export default function CheckerPage() {
  return (
    <>
      <div className="app__hero">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--red)', background: 'var(--red-dim)',
          border: '1px solid var(--border)', padding: '4px 14px',
          borderRadius: 'var(--r-pill)', marginBottom: 18,
        }}>
          🔍 Deepfake Detector
        </div>

        <h1 className="page__title--glow">AI Image Authenticity Check</h1>

        <p style={{ 
          marginTop: 12, 
          color: 'var(--muted)', 
          fontSize: '1rem', 
          maxWidth: 520, 
          marginLeft: 'auto', 
          marginRight: 'auto', 
          lineHeight: 1.65 
        }}>
          Upload an image or video and get a deepfake probability score based on model, artifact, and metadata analysis.
        </p>

      </div>

      <UploadZone id="analyzer" />
    </>
  );
}