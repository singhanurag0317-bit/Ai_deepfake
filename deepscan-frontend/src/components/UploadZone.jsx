import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { analyzeMedia } from '../services/api';
import ResultCard from './ResultCard';
import MetadataPanel from './MetadataPanel';

export default function UploadZone({ id }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const [selectedFile] = acceptedFiles;
    setFile(selectedFile || null);
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm']
    },
  });

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    // TODO: Update backend call or parameters to process video/description if needed.
    // We pass `description` if the API requires it, for now we just keep the form state as requested.
    try {
      const data = await analyzeMedia(file);
      setResult(data);
    } catch (err) {
      const serverMessage = err?.response?.data?.error || err?.response?.data?.message;
      setError(serverMessage || 'Failed to analyze the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setDescription('');
  };

  const isVideo = file && file.type.startsWith('video/');

  return (
    <section className="upload-zone" id={id}>
      <div className="upload-zone__card">
        {!file && (
          <div
            className={`upload-zone__drop ${isDragActive ? 'is-active' : ''}`}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <div className="upload-zone__prompt">
              {isDragActive ? 'Drop the image or video here' : 'Drag & drop an image or video here'}
            </div>
            <div className="upload-zone__hint">or click to browse files</div>
          </div>
        )}

        {previewUrl && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="upload-zone__preview" style={{ position: 'relative', display: 'inline-block' }}>
              {isVideo ? (
                <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '340px', borderRadius: '8px' }} />
              ) : (
                <img src={previewUrl} alt="Uploaded preview" />
              )}
              <button
                type="button"
                className="upload-zone__remove-btn"
                onClick={handleRemoveFile}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="upload-zone__description-wrapper" style={{ marginTop: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px', fontWeight: '600' }}>
            Add a description (optional)
          </label>
          <textarea
            className="upload-zone__description-input"
            placeholder="Describe what you want to analyze..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px 14px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          className={`upload-zone__button ${loading ? 'is-loading' : ''}`}
          onClick={handleSubmit}
          disabled={!file || loading}
          type="button"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {error && <div className="upload-zone__error">{error}</div>}
      </div>

      {result && (
        <div className="upload-zone__results">
          <ResultCard
            score={result.final_score}
            verdict={result.verdict}
            model_score={result.breakdown?.model_score}
            metadata_score={result.breakdown?.metadata_score}
          />
          <MetadataPanel metadata={result.raw_metadata} />
        </div>
      )}
    </section>
  );
}
