import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQ_ITEMS = [
  {
    q: 'What image formats are supported?',
    a: 'We support JPEG, PNG, and WEBP images up to 5MB.',
  },
  {
    q: 'How accurate is the AI detection?',
    a: 'Our analysis combines model patterns, artifact detection, and metadata. Results are probability scores, not guarantees.',
  },
  {
    q: 'Is my uploaded image stored?',
    a: 'Images are processed for analysis. We do not store or share your uploads beyond what\'s needed to return results.',
  },
  {
    q: 'What does the score breakdown mean?',
    a: 'Model score reflects AI-like patterns, artifact score checks for visual inconsistencies, and metadata score evaluates EXIF data.',
  },
  {
    q: 'Why might metadata be missing?',
    a: 'AI-generated images often lack camera EXIF data. Real photos typically include camera make, model, and timestamp.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="contact">
      <div className="contact__grid">
        <section className="contact__form-section">
          <h1 className="contact__title">Get in touch</h1>

          <form
            className="contact__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="contact__row">
              <div className="contact__field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder=" "
                />
              </div>
              <div className="contact__field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder=" "
                />
              </div>
            </div>
            <div className="contact__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder=" "
              />
            </div>
            <div className="contact__field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder=" "
                rows={4}
              />
            </div>
            <button type="submit" className="contact__submit">
              <span className="contact__submit-dot" aria-hidden="true" />
              Submit
            </button>
          </form>

          <div className="contact__email">
            <span className="contact__email-label">Email us</span>
            <a href="mailto:deepscan@info.com" className="contact__email-link">
              deepscan@info.com
            </a>
          </div>
        </section>

        <section className="contact__faq-section">
          <h2 className="contact__faq-title">Service FAQ</h2>
          <div className="contact__faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="contact__faq-item">
                <summary className="contact__faq-question">{item.q}</summary>
                <p className="contact__faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="contact__back">
        <Link to="/" className="contact__back-link">
          ← Back to analyzer
        </Link>
      </div>
    </div>
  );
}
