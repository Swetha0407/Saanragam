import React from "react";

export default function SaanragamLayout({
  eyebrow = "தமிழ் மரபின் திறவுகோல்",
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <main className={`page-container ${className}`}>
      {(eyebrow || title || subtitle) && (
        <header className="hero-teak-board">
          {eyebrow && <span className="hero-eyebrow">{eyebrow}</span>}
          {title && <h1 className="hero-title">{title}</h1>}
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </main>
  );
}
