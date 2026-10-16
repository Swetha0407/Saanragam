import React, { useEffect, useState } from "react";
import { getDailyKural } from "../api";

export default function DailyKural() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDailyKural()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "இன்றைய குறளைப் பெற முடியவில்லை.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="hero-teak-board" style={{ textAlign: "center", padding: "50px" }}>
        <p className="hero-eyebrow">விடியலின் நல்வாழ்த்து</p>
        <h2 style={{ color: "#dfc28d" }}>இன்றைய நற்பேறு ஓலை மலர்கிறது…</h2>
      </div>
    );
  }

  if (error || !data || !data.kural) {
    return (
      <div className="hero-teak-board" style={{ borderColor: "#8c281e", color: "#ffb4aa" }}>
        {error || "குறள் கிடைக்கவில்லை."}
      </div>
    );
  }

  const kural = data.kural;
  const tamilDate = data.date
    ? new Date(data.date + "T12:00:00").toLocaleDateString("ta-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="daily-kural-container">
      {/* CONSECRATED DAILY PALM LEAF */}
      <article
        className="olai-strip"
        style={{
          padding: "clamp(32px, 5vw, 56px) clamp(64px, 7.5vw, 92px)",
          textAlign: "center",
          position: "relative",
          marginBottom: "28px",
        }}
      >
        <div className="cord-eyelet left" aria-hidden="true" />
        <div className="cord-eyelet right" aria-hidden="true" />

        {/* Date and Holy Lamp Tag */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span className="hero-eyebrow" style={{ color: "var(--soot-muted)", margin: 0 }}>
            {tamilDate} · இன்றைய நற்பேறு
          </span>
          <span className="kural-num-badge">குறள் {kural.number}</span>
        </div>

        {/* Inscribed Couplet */}
        <div
          className="inscribed-text"
          style={{
            fontSize: "clamp(1.3rem, 3.2vw, 1.7rem)",
            fontWeight: "700",
            lineHeight: "1.9",
            maxWidth: "780px",
            margin: "0 auto 16px",
          }}
        >
          <div>{kural.line1}</div>
          <div>{kural.line2}</div>
        </div>

        {/* Pulli-kolam mark */}
        <div className="kolam-divider" style={{ margin: "14px auto" }}>
          <svg viewBox="0 0 190 16">
            <use href="#pulli-kolam" />
          </svg>
        </div>

        {/* Detailed Explanation */}
        <div
          style={{
            maxWidth: "680px",
            margin: "16px auto 0",
            fontSize: "1.05rem",
            color: "var(--soot-mid)",
            lineHeight: "1.8",
            fontFamily: "var(--font-tamil-sans)",
          }}
        >
          <strong style={{ color: "var(--soot-ink)" }}>பொருள்: </strong>
          {kural.explanation || kural.meaning}
        </div>
      </article>

      {/* DAILY REFLECTION CONTEMPLATION LEAF */}
      {data.reflection_question && (
        <div
          className="olai-strip"
          style={{
            padding: "20px clamp(20px, 4vw, 36px)",
            position: "relative",
            background: "linear-gradient(180deg, #dfc086 0%, #caa060 100%)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span className="hero-eyebrow" style={{ color: "var(--soot-muted)", margin: 0 }}>
              இன்றைய சிந்தனை
            </span>
            <p className="inscribed-text" style={{ fontSize: "1.08rem", margin: "4px 0 0", fontWeight: "600" }}>
              {data.reflection_question}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
