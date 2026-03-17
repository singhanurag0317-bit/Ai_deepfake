import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AnimatedTitle from '../components/AnimatedTitle';

export default function HomePage({ isAuthed }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.scrollToAnalyzer) {
      const timer = setTimeout(() => {
        document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleStart = () => {
    if (!isAuthed) {
      navigate('/auth', { state: { authMode: 'signin', redirectTo: '/checker' } });
      return;
    }
    navigate('/checker');
  };

  return (
    <>
      <section className="landing">
        <div className="landing__hero">
          <div className="landing__left">
            <AnimatedTitle
              eyebrow="DeepScan"
              firstLine="Building"
              secondLine="trust online"
              subtitle="AI Deepfake Detection Platform — detect AI-generated images in seconds."
            />

            <div className="landing__cta">
              <button type="button" className="landing__btn landing__btn--primary" onClick={handleStart}>
                {isAuthed ? 'Open checker' : 'Sign in to start'}
              </button>
              <button
                type="button"
                className="landing__btn landing__btn--secondary"
                onClick={() => navigate('/auth', { state: { authMode: 'signup', redirectTo: '/checker' } })}
              >
                Create account
              </button>
            </div>

            <div className="landing__mini">
              <div className="landing__mini-card">
                <div className="landing__mini-title">Upload</div>
                <div className="landing__mini-sub">JPEG / PNG / WEBP (up to 5MB)</div>
              </div>
              <div className="landing__mini-card">
                <div className="landing__mini-title">Analyze</div>
                <div className="landing__mini-sub">Artifacts + EXIF metadata signals</div>
              </div>
              <div className="landing__mini-card">
                <div className="landing__mini-title">Verify</div>
                <div className="landing__mini-sub">Score + verdict with breakdown</div>
              </div>
            </div>
          </div>

          <aside className="landing__right" aria-label="Preview cards">
            <div className="landing__panel landing__panel--light">
              <div className="landing__panel-chip">Overview</div>
              <div className="landing__panel-line" />
              <div className="landing__panel-line landing__panel-line--short" />
              <div className="landing__panel-meter">
                <span />
              </div>
            </div>
            <div className="landing__panel landing__panel--dark">
              <div className="landing__panel-chip">Authenticity</div>
              <div className="landing__panel-line" />
              <div className="landing__panel-line landing__panel-line--short" />
              <div className="landing__panel-meter">
                <span />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
