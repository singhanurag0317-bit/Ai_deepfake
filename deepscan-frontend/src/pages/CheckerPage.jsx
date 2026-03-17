import React from 'react';
import UploadZone from '../components/UploadZone';

export default function CheckerPage() {
  return (
    <>
      <div className="app__hero">
        <h1>AI Image Authenticity Check</h1>
        <p>
          Upload a single image and get a probability score based on model, artifact, and metadata
          analysis.
        </p>
      </div>
      <UploadZone id="analyzer" />
    </>
  );
}

