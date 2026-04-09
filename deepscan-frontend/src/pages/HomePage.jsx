import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ScannerVisual from '../components/ScannerVisual';
import FeatureCardComponent from '../components/FeatureCardComponent';
import CountUp from '../components/CountUp';
import '../components/HeroCards.css';
import '../components/ScannerVisual.css';

export default function HomePage({ isAuthed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

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

  const handleMouseMove = (e) => {
    const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    setParallax({ x, y });
  };

  return (
    <div className="home-v2" onMouseMove={handleMouseMove}>
      <section className="landing">
        <div className="landing__hero custom-layout" style={{ transformStyle: 'preserve-3d' }}>
          <div 
            className="landing__left"
            style={{ 
              transform: `translate3d(${parallax.x * -15}px, ${parallax.y * -15}px, 0)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="kicker-tag" style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.8 }}>
              <span className="dot" style={{ background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }}></span>
              $ npm install authenticity --save
            </div>
            <h1 className="landing__main-title">
              Engineered <br />
              <span>Authenticity.</span>
            </h1>
            <p className="landing__subtext" style={{ maxWidth: '480px' }}>
              The high-performance neural engine for deepfake detection. 
              Verify media at its source with sub-second latency and 99.2% accuracy.
            </p>

            <div className="landing__cta">
              <button type="button" className="landing__btn-v2 primary" onClick={handleStart}>
                {isAuthed ? '/launch_vault' : '/initialize_engine'}
              </button>
              <button
                type="button"
                className="landing__btn-v2 secondary"
                onClick={() => navigate('/learn-more')}
              >
                Docs ↗
              </button>
            </div>

            <div className="landing__tech-stats" style={{ borderTop: '1px solid var(--border2)', paddingTop: '32px', marginTop: '40px' }}>
              <div className="tech-stat-item">
                <span className="label" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SCANNED_SAMPLES</span>
                <span className="value" style={{ fontFamily: "'Space Grotesk', sans-serif" }}><CountUp end={1248390} /></span>
              </div>
              <div className="tech-stat-item">
                <span className="label" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CONFIDENCE_RATIO</span>
                <span className="value" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>99.2%</span>
              </div>
              <div className="tech-stat-item">
                <span className="label" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SYSTEM_HEALTH</span>
                <span className="value active" style={{ color: 'var(--emerald)', fontFamily: "'Space Grotesk', sans-serif" }}>STABLE</span>
              </div>
            </div>
          </div>

          <div 
            className="landing__right visual-container"
            style={{ 
              transform: `translate3d(${parallax.x * 25}px, ${parallax.y * 25}px, 50px) rotateY(${parallax.x * 5}deg)`,
              transition: 'transform 0.1s ease-out',
              transformStyle: 'preserve-3d'
            }}
          >
            <ScannerVisual />
          </div>
        </div>
      </section>

      <section className="features-brief" style={{ borderTop: '1px solid var(--border2)', marginTop: '80px', paddingTop: '80px' }}>
        <div className="section-header">
           <h2 className="section-title">Engine <span>Capabilities</span></h2>
        </div>
        <div className="landing__mini">
          <FeatureCardComponent index={0} title="Neural Scan" subtitle="427-layer DenseNet artifact detection" />
          <FeatureCardComponent index={1} title="EXIF Entropy" subtitle="Metadata signal verification & hash check" />
          <FeatureCardComponent index={2} title="Verdict CLI" subtitle="Real-time binary classification API" />
        </div>
      </section>
    </div>
  );
}

