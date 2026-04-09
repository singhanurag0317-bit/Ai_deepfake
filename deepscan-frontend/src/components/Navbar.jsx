import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ isAuthed, userEmail, onAuthNavigate, onLogout, onGoToChecker }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <img src="/logo.png" alt="Deepfake Logo" className="navbar__logo-img" />
          <div className="navbar__logo-wrapper">
            <span className="navbar__logo-text">Deepfake</span>
            <span className="navbar__logo-subtitle">Research Vault</span>
          </div>
        </Link>

        <nav className="navbar__right">
          <Link to="/how-it-works" className="navbar__link">How it works</Link>
          <Link to="/features" className="navbar__link">Features</Link>
          <Link to="/about" className="navbar__link">About</Link>
          <Link to="/learn-more" className="navbar__btn navbar__btn--secondary">Learn more</Link>

          {isAuthed ? (
            <button
              type="button"
              className="navbar__btn navbar__btn--contact"
              onClick={onLogout}
              title={userEmail || 'Logout'}
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              className="navbar__btn navbar__btn--contact"
              onClick={onAuthNavigate}
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
