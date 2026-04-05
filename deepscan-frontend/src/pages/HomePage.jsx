import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AnimatedTitle from '../components/AnimatedTitle';
import HeroOrb from '../components/HeroOrb';
import FeatureCardComponent from '../components/FeatureCardComponent';
import CountUp from '../components/CountUp';
import '../components/HeroCards.css';

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
          <HeroOrb />
          <div className="landing__left">
            <AnimatedTitle
              eyebrow="AI Deepfake"
              firstLine="Building"
              secondLine="trust online"
              subtitle="AI Deepfake Detection Platform — detect AI-generated images in seconds."
            />

            <div className="landing__cta">
              <button type="button" className="landing__btn landing__btn--primary stagger-slide-up delay-btn-1" onClick={handleStart}>
                {isAuthed ? 'Open checker' : 'Sign in to start'}
              </button>
              <button
                type="button"
                className="landing__btn landing__btn--secondary stagger-slide-up delay-btn-2"
                onClick={() => navigate('/auth', { state: { authMode: 'signup', redirectTo: '/checker' } })}
              >
                Create account
              </button>
            </div>

            <div className="landing__mini">
              <FeatureCardComponent index={0} title="Upload" subtitle="JPEG / PNG / WEBP (up to 5MB)" />
              <FeatureCardComponent index={1} title="Analyze" subtitle="Artifacts + EXIF metadata signals" />
              <FeatureCardComponent index={2} title="Verify" subtitle="Score + verdict with breakdown" />
            </div>
          </div>

          <aside className="landing__right" aria-label="Preview cards">
            <div className="landing__panel landing__panel--light">
              <div className="landing__panel-chip">Overview</div>
              <div className="landing__list">
                <div className="landing__list-item">
                  <span className="landing__list-label">🛡️ Images Scanned</span>
                  <span className="landing__list-value"><CountUp end={1248390} /></span>
                </div>
              </div>
            </div>
            
            <div className="landing__panel landing__panel--dark">
              <div className="landing__panel-chip">Authenticity</div>
              
              <div className="landing__progress">
                <div className="landing__progress-row">
                  <div className="landing__progress-label">
                    <span>AI Generated</span>
                    <span>87%</span>
                  </div>
                  <div className="landing__progress-bg">
                    <div className="landing__progress-fill" style={{ '--w': '87%', background: '#ef4444' }} />
                  </div>
                </div>

                <div className="landing__progress-row">
                  <div className="landing__progress-label">
                    <span>Metadata Anomaly</span>
                    <span>63%</span>
                  </div>
                  <div className="landing__progress-bg">
                    <div className="landing__progress-fill" style={{ '--w': '63%', background: '#f97316' }} />
                  </div>
                </div>

                <div className="landing__progress-row">
                  <div className="landing__progress-label">
                    <span>Real / Authentic</span>
                    <span>12%</span>
                  </div>
                  <div className="landing__progress-bg">
                    <div className="landing__progress-fill" style={{ '--w': '12%', background: '#10b981' }} />
                  </div>
                </div>
              </div>

              <div className="landing__badge">
                ⚠️ LIKELY DEEPFAKE
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
