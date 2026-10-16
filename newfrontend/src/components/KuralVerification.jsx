import React, { useState, useEffect } from "react";
import { verifyKural, getVerifyStatus } from "../api";

const SAMPLES = [
  { label: "நேரடி குறள் (1)", text: "அகர முதல எழுத்தெல்லாம் ஆதி பகவன் முதற்றே உலகு" },
  { label: "சொல் மாற்றப்பட்ட உரை", text: "அகர முதல எழுத்தெல்லாம் கடவுள் முதற்றே உலகு" },
  { label: "பகுதி வரி (72)", text: "அன்பிலார் எல்லாம் தமக்குரியர்" },
  { label: "வாய்மை குறள் (291)", text: "வாய்மை எனப்படுவது யாதெனின் யாதொன்றும் தீமை இலாத சொலல்" },
];

export default function KuralVerification() {
  const [quotation, setQuotation] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getVerifyStatus()
      .then((st) => setStatusInfo(st))
      .catch((err) => console.warn("Verify status check failed:", err));
  }, []);

  const handleKeySave = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem("gemini_api_key", newKey);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  };

  const runVerification = async (textToVerify) => {
    const text = (textToVerify || quotation).trim();
    if (!text) {
      setError("சரிபார்க்க வேண்டிய குறளை உள்ளிடவும்.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await verifyKural(text, apiKey.trim() || null);
      setResult(data);
    } catch (err) {
      setError(err.message || "சரிபார்க்கும்போது பிழை ஏற்பட்டது.");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (sampleText) => {
    setQuotation(sampleText);
    runVerification(sampleText);
  };

  return (
    <div className="kural-verification-container">
      {/* Desk Input Area */}
      <div className="stylus-input-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
          <label
            htmlFor="quote-input"
            style={{
              fontFamily: "var(--font-tamil-sans)",
              fontWeight: "700",
              color: "#dfb268",
              fontSize: "0.95rem",
            }}
          >
            சரிபார்க்க வேண்டிய திருக்குறள் உரை
          </label>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); runVerification(); }}>
          <textarea
            id="quote-input"
            rows={3}
            className="stylus-textarea"
            placeholder="திருக்குறள் வரிகளை இங்கே உள்ளிடவும்…"
            value={quotation}
            onChange={(e) => setQuotation(e.target.value)}
            disabled={loading}
          />

          <div className="sample-chip-row">
            <span className="sample-chip-label">மாதிரி குறள்கள் (அழுத்திச் சரிபார்க்க):</span>
            {SAMPLES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="sample-chip"
                onClick={() => handleChipClick(s.text)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            <button type="submit" className="seal-btn" disabled={loading}>
              {loading ? "ஆராய்கிறது…" : "குறளைச் சரிபார்க்கவும்"}
            </button>
            <button
              type="button"
              className="ghost-leaf-btn"
              onClick={() => {
                setQuotation("");
                setResult(null);
                setError("");
              }}
              disabled={loading}
            >
              அழிக்கவும்
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="hero-teak-board" style={{ borderColor: "#8c281e", color: "#ffb4aa", padding: "16px 20px" }}>
          {error}
        </div>
      )}

      {/* VERIFICATION RESULT PALM LEAF */}
      {result && (
        <div className="olai-strip verification-result-box">
          <div className="cord-eyelet left" aria-hidden="true" />
          <div className="cord-eyelet right" aria-hidden="true" />

          {/* Status Header */}
          <div className="verification-status-header">
            <div>
              <span className={`status-badge ${result.status}`}>
                {result.status === "verified" && "✓ குறள் சரிபார்க்கப்பட்டது"}
                {result.status === "possible_match" && "≈ சாத்தியமான பொருத்தம்"}
                {result.status === "unverified" && "? உறுதியான பொருத்தம் இல்லை"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {typeof result.faiss_score === "number" && (
                <span className="similarity-meter">
                  ஒப்பீட்டுப் பொருத்தம்: <strong>{Math.round(result.faiss_score * 100)}%</strong>
                </span>
              )}
              {typeof result.confidence === "number" && (
                <span className="similarity-meter" style={{ background: "rgba(142, 42, 30, 0.15)", borderColor: "rgba(142, 42, 30, 0.35)" }}>
                  நம்பகத்தன்மை: <strong>{Math.round(result.confidence)}%</strong>
                </span>
              )}
            </div>
          </div>

          <p style={{ margin: "0 0 16px", color: "var(--soot-mid)", fontSize: "0.98rem" }}>
            {result.message}
          </p>

          {/* SCHOLARLY ANALYSIS */}
          {result.gemini_evaluated && result.gemini_analysis && (
            <div
              style={{
                background: "rgba(70, 40, 15, 0.16)",
                border: "1.5px solid rgba(212, 163, 93, 0.45)",
                borderRadius: "10px",
                padding: "18px 22px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ color: "var(--madder-red)", fontWeight: "700", fontSize: "0.92rem", letterSpacing: "0.04em" }}>
                  ✦ இலக்கிய ஆய்வுரை
                </span>
                {result.gemini_analysis.confidence_percentage && (
                  <span style={{ fontSize: "0.82rem", color: "var(--soot-muted)" }}>
                    உறுதிப்பாடு: {result.gemini_analysis.confidence_percentage}%
                  </span>
                )}
              </div>

              {result.gemini_analysis.verdict_tamil && (
                <h4 style={{ margin: "0 0 10px", color: "var(--soot-ink)", fontSize: "1.08rem" }}>
                  {result.gemini_analysis.verdict_tamil}
                </h4>
              )}

              {result.gemini_analysis.scholar_analysis_tamil && (
                <p style={{ margin: "0 0 12px", color: "var(--soot-mid)", fontSize: "0.96rem", lineHeight: "1.7" }}>
                  {result.gemini_analysis.scholar_analysis_tamil}
                </p>
              )}

              {result.gemini_analysis.scholar_analysis_english && (
                <p style={{ margin: 0, color: "var(--soot-muted)", fontSize: "0.9rem", fontStyle: "italic", borderTop: "1px dashed rgba(120, 80, 35, 0.3)", paddingTop: "8px" }}>
                  {result.gemini_analysis.scholar_analysis_english}
                </p>
              )}
            </div>
          )}

          {/* MATCHED KURAL INSCRIBED ON PALM LEAF */}
          {result.source_text && (
            <div
              style={{
                background: "rgba(80, 48, 15, 0.12)",
                border: "1px dashed rgba(120, 80, 35, 0.4)",
                borderRadius: "8px",
                padding: "18px 24px",
                margin: "18px 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <span className="kural-num-badge">
                  குறள் {result.kural_number} {result.paal ? `· ${result.paal}` : ""} {result.chapter ? `(${result.chapter})` : ""}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--soot-muted)" }}>மூலத் திருக்குறள் ஏடு</span>
              </div>

              <div
                className="inscribed-text"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  lineHeight: "1.8",
                  margin: "8px 0 12px",
                }}
              >
                <div>{result.source_text.split("\n")[0]}</div>
                <div>{result.source_text.split("\n")[1]}</div>
              </div>

              {result.meaning && (
                <div style={{ borderTop: "1px dashed rgba(120, 80, 35, 0.25)", paddingTop: "10px", fontSize: "0.95rem", color: "var(--soot-mid)", lineHeight: "1.6" }}>
                  <strong>பொருள்: </strong> {result.meaning}
                </div>
              )}
            </div>
          )}

          {/* Word Differences Diff Chips */}
          {result.differences && result.differences.length > 0 && (
            <div style={{ margin: "18px 0" }}>
              <h4 style={{ margin: "0 0 10px", color: "var(--soot-ink)", fontSize: "1rem" }}>
                கண்டறியப்பட்ட சொல் வேறுபாடுகள்:
              </h4>
              <div className="diff-chip-grid">
                {result.differences.map((diff, i) => (
                  <div key={i} className="diff-chip-item">
                    <span style={{ color: "var(--soot-muted)", fontWeight: "600" }}>சொல் {diff.position}:</span>
                    <span>மூலம்:</span>
                    <span className="diff-expected">{diff.expected || "—"}</span>
                    <span>நீங்கள் உள்ளிட்டது:</span>
                    <span className="diff-supplied">{diff.supplied || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearest Candidates */}
          {result.candidates && result.candidates.length > 1 && (
            <div style={{ marginTop: "20px", borderTop: "1px dashed rgba(120, 80, 35, 0.3)", paddingTop: "14px" }}>
              <span style={{ fontSize: "0.86rem", color: "var(--soot-muted)", fontWeight: "600" }}>
                தொடர்புடைய பிற குறள்கள்:
              </span>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                {result.candidates.slice(1).map((cand) => (
                  <button
                    key={cand.number}
                    type="button"
                    className="sample-chip"
                    onClick={() => handleChipClick(`${cand.line1} ${cand.line2}`)}
                    style={{ textAlign: "left" }}
                  >
                    குறள் {cand.number} {cand.chapter ? `(${cand.chapter})` : ""} — {Math.round(cand.faiss_score * 100)}%
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--soot-muted)" }}>
            ஆதாரம்: {result.source || "சான்றகத்தில் உள்ள திருக்குறள் மூலப் பேழை (1,330 குறள்கள்)"}
          </div>
        </div>
      )}
    </div>
  );
}
