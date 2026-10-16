import React, { useState } from "react";
import { getWordMeaning } from "../api";

export default function WordMeaning() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async (wordToSearch) => {
    const query = (wordToSearch || word).trim();
    if (!query) {
      setError("பொருள் அறிய தமிழ்ச் சொல்லை உள்ளிடவும்.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await getWordMeaning(query);
      setResult(data);
    } catch (err) {
      setError(err.message || "சொல்லின் பொருளைத் தேட முடியவில்லை.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="word-meaning-container">
      {/* Search Input Desk */}
      <div className="stylus-input-panel">
        <form onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                color: "#dfb268",
                fontSize: "0.92rem",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              தமிழ்ச் சொல்
            </label>
            <input
              type="text"
              className="stylus-input"
              style={{ width: "100%" }}
              placeholder="எ.கா. அறம், வெள்ளம், அன்பு…"
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />
          </div>

          <button type="submit" className="seal-btn" disabled={loading}>
            {loading ? "சுவடியில் தேடுகிறது…" : "பொருள் தேடுக"}
          </button>
        </form>
      </div>

      {error && (
        <div className="hero-teak-board" style={{ borderColor: "#8c281e", color: "#ffb4aa" }}>
          {error}
        </div>
      )}

      {/* DICTIONARY RESULT PALM LEAF */}
      {result && (
        <div className="olai-strip dictionary-leaf" style={{ padding: "32px clamp(64px, 7vw, 92px)", position: "relative" }}>
          <div className="cord-eyelet left" aria-hidden="true" />
          <div className="cord-eyelet right" aria-hidden="true" />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid rgba(120, 80, 35, 0.3)", paddingBottom: "12px", marginBottom: "16px" }}>
            <h2 className="inscribed-text" style={{ margin: 0, fontSize: "1.8rem" }}>
              {result.word}
            </h2>
            <span style={{ fontSize: "0.85rem", color: "var(--soot-muted)" }}>
              {result.source || "தமிழ் அகராதி"}
            </span>
          </div>

          {result.found ? (
            <div>
              <h4 style={{ margin: "0 0 8px", color: "var(--soot-muted)", fontSize: "0.95rem" }}>
                அகராதிப் பொருள்:
              </h4>
              <p className="inscribed-text" style={{ fontSize: "1.15rem", lineHeight: "1.8", margin: "0 0 20px" }}>
                {result.meanings}
              </p>

              {/* Context Checked inside Thirukkural */}
              {result.context_checked && (
                <div
                  style={{
                    background: "rgba(80, 48, 15, 0.12)",
                    border: "1px dashed rgba(120, 80, 35, 0.35)",
                    borderRadius: "8px",
                    padding: "16px",
                    marginTop: "16px",
                  }}
                >
                  <span className="kural-num-badge" style={{ marginBottom: "8px", display: "inline-block" }}>
                    குறள் {result.kural?.எண்} சூழல் ஒப்பீடு
                  </span>
                  <div className="inscribed-text" style={{ fontSize: "1.1rem", fontWeight: "700", margin: "8px 0" }}>
                    <div>{result.kural?.முதல்_வரி}</div>
                    <div>{result.kural?.இரண்டாம்_வரி}</div>
                  </div>
                  <p style={{ margin: "8px 0 0", color: "var(--soot-mid)", fontSize: "0.94rem" }}>
                    {result.context_message}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--soot-mid)", fontSize: "1.05rem" }}>
              {result.message || "இந்தச் சொல்லுக்கான நேரடிப் பொருள் கிடைக்கவில்லை."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
