import React, { useMemo } from 'react';

export default function AnimatedTitle({
  eyebrow = 'DeepScan',
  firstLine = 'Building',
  secondLine = 'trust online',
  subtitle = 'Upload an image and get a fast authenticity score using artifact and metadata signals.',
}) {
  const words = useMemo(() => {
    const a = String(firstLine).trim().split(/\s+/);
    const b = String(secondLine).trim().split(/\s+/);
    return { a, b };
  }, [firstLine, secondLine]);

  return (
    <div className="animated-hero">
      <div className="animated-hero__eyebrow">{eyebrow}</div>

      <h1 className="animated-hero__title" aria-label={`${firstLine} ${secondLine}`}>
        <span className="animated-hero__line">
          {words.a.map((w, idx) => (
            <span key={`a-${w}-${idx}`} className="animated-hero__word" style={{ '--d': `${idx * 90}ms` }}>
              {w}
            </span>
          ))}
        </span>
        <span className="animated-hero__line animated-hero__line--muted">
          {words.b.map((w, idx) => (
            <span
              key={`b-${w}-${idx}`}
              className="animated-hero__word"
              style={{ '--d': `${(words.a.length + idx) * 90}ms` }}
            >
              {w}
            </span>
          ))}
        </span>
      </h1>

      <p className="animated-hero__subtitle">{subtitle}</p>
    </div>
  );
}

