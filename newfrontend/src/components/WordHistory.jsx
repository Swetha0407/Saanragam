import React, { useState } from "react";
import { getWordHistory } from "../api";

export default function WordHistory() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async (wordToSearch) => {
    const query = (wordToSearch || word).trim();
    if (!query) {
      setError("வரலாறு அறிய ஒரு சொல்லை உள்ளிடவும்.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await getWordHistory(query);
      setResult(data);
    } catch (err) {
      setError(err.message || "சொல் வரலாற்றைப் பெற முடியவில்லை.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="word-history-container">
      {/* Search Input Panel */}
      <div className="stylus-input-panel">
        <form onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
          <label
            style={{
              display: "block",
              color: "#dfb268",
              fontSize: "0.92rem",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            வேர்ச்சொல் / மூலச்சொல்
          </label>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="stylus-input"
              placeholder="எ.கா. கண், நீர், மரம், அம்மா…"
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />
            <button type="submit" className="seal-btn" disabled={loading}>
              {loading ? "மரபு ஆராய்கிறது…" : "சொல் மரபு காண்க"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="hero-teak-board" style={{ borderColor: "#8c281e", color: "#ffb4aa" }}>
          {error}
        </div>
      )}

      {/* HISTORICAL RESULT PALM LEAF */}
      {result && (
        <div className="olai-strip history-leaf" style={{ padding: "32px clamp(64px, 7vw, 92px)", position: "relative" }}>
          <div className="cord-eyelet left" aria-hidden="true" />
          <div className="cord-eyelet right" aria-hidden="true" />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid rgba(120, 80, 35, 0.3)", paddingBottom: "14px", marginBottom: "16px" }}>
            <div>
              <span className="hero-eyebrow" style={{ color: "var(--soot-muted)" }}>திராவிட மொழி மூல ஆய்வு</span>
              <h2 className="inscribed-text" style={{ margin: "2px 0 0", fontSize: "1.8rem" }}>
                {result.word}
              </h2>
            </div>
            {result.historical_results?.[0]?.dedr_number && (
              <span className="dedr-badge">
                DEDR {result.historical_results[0].dedr_number}
              </span>
            )}
          </div>

          {/* Dictionary meaning if found */}
          {result.dictionary_meaning && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 6px", color: "var(--soot-muted)", fontSize: "0.92rem" }}>
                அகராதிப் பொருள்:
              </h4>
              <p className="inscribed-text" style={{ fontSize: "1.05rem", lineHeight: "1.7", margin: 0 }}>
                {result.dictionary_meaning}
              </p>
            </div>
          )}

          {/* Dravidian Etymology & Cognates */}
          {result.historical_match_found && result.historical_results.length > 0 ? (
            <div>
              <h4 style={{ margin: "16px 0 10px", color: "var(--soot-ink)", fontSize: "1.05rem" }}>
                திராவிட ஒப்பீட்டு வடிவங்கள் (Dravidian Cognates):
              </h4>

              {result.historical_results.map((item, idx) => (
                <div key={idx} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "1.1rem", color: "var(--soot-ink)" }}>
                      மூல வடிவம்: {item.attested_form}
                    </strong>
                    <span style={{ fontSize: "0.88rem", color: "var(--soot-muted)" }}>
                      ({item.meaning})
                    </span>
                  </div>

                  {item.related_forms && item.related_forms.length > 0 && (
                    <table className="history-cognates-table">
                      <thead>
                        <tr>
                          <th>மொழி (Language)</th>
                          <th>சொல் வடிவம் (Cognate Form)</th>
                          <th>விளக்கம் (Comment)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.related_forms.slice(0, 10).map((rf, rIdx) => (
                          <tr key={rIdx}>
                            <td><strong>{rf.language}</strong></td>
                            <td className="inscribed-text">{rf.form}</td>
                            <td>{rf.comment || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--soot-mid)" }}>
              {result.message || "வரலாற்றுப் பதிவு கிடைக்கவில்லை."}
            </p>
          )}

          <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px dashed rgba(120, 80, 35, 0.3)", fontSize: "0.8rem", color: "var(--soot-muted)" }}>
            ஆதாரம்: {result.dataset_citation || result.source}
          </div>
        </div>
      )}
    </div>
  );
}
