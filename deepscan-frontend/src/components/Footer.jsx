import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [showCookieNotice, setShowCookieNotice] = useState(false);

  const handleCookieSettings = () => {
    setShowCookieNotice(true);
  };

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__column">
            <h3 className="footer__heading">Company</h3>
            <ul className="footer__links">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/how-it-works">How it works</Link></li>
            </ul>
          </div>
          <div className="footer__column">
            <h3 className="footer__heading">Client services</h3>
            <ul className="footer__links">
              <li><Link to="/contact">Get in touch</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer__column">
            <h3 className="footer__heading">Connect</h3>
            <ul className="footer__links">
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              <li><a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a></li>
              <li><a href="https://threads.net" target="_blank" rel="noopener noreferrer">Threads</a></li>
            </ul>
          </div>
          <div className="footer__column">
            <h3 className="footer__heading">Legal</h3>
            <ul className="footer__links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Use</Link></li>
              <li><button type="button" className="footer__link-btn" onClick={handleCookieSettings}>Cookie Settings</button></li>
              <li><button type="button" className="footer__link-btn">Do Not Sell My Info</button></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">DeepScan • AI Deepfake Detection Platform • 2026</span>
          <span className="footer__rights">All Rights Reserved</span>
        </div>
      </div>

      {showCookieNotice && (
        <div className="footer__cookie-overlay" onClick={() => setShowCookieNotice(false)}>
          <div className="footer__cookie-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Cookie Settings</h4>
            <p>We use essential cookies to run the site. You can manage your preferences below.</p>
            <button type="button" className="footer__cookie-close" onClick={() => setShowCookieNotice(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
