import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ isAuthed, userEmail, onAuthNavigate, onLogout, onGoToChecker }) {
  const navigate = useNavigate();

  const goToAnalyzer = () => {
    if (!isAuthed) {
      navigate('/auth', { state: { authMode: 'signin', redirectTo: '/checker' } });
      return;
    }

    if (window.location.pathname === '/checker') {
      document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    navigate('/checker');
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-text">DeepScan</span>
          <span className="navbar__logo-subtitle">AI Deepfake Detection Platform</span>
        </Link>

        <nav className="navbar__links">
          <Link to="/how-it-works" className="navbar__link">
            How it works
          </Link>
          <Link to="/features" className="navbar__link">
            Features
          </Link>
          <Link to="/about" className="navbar__link">
            About
          </Link>
        </nav>

        <div className="navbar__actions">
          <Link to="/how-it-works" className="navbar__btn navbar__btn--secondary">
            Learn more
          </Link>
          <button
            type="button"
            className="navbar__btn navbar__btn--primary"
            onClick={goToAnalyzer}
          >
            Try now
          </button>

          {isAuthed ? (
            <>
              <button
                type="button"
                className="navbar__btn navbar__btn--secondary"
                onClick={onGoToChecker}
                title="Open the checker"
              >
                Checker
              </button>
              <button
                type="button"
                className="navbar__btn navbar__btn--contact"
                onClick={onLogout}
                title={userEmail || 'Logout'}
              >
                <span className="navbar__btn-dot" aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className="navbar__btn navbar__btn--contact"
              onClick={onAuthNavigate}
            >
              <span className="navbar__btn-dot" aria-hidden="true" />
              Sign in / Sign up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
