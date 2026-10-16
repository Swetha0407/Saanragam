import React, { useState, useEffect } from "react";
import { getRecommendedKurals } from "../api";

const SITUATIONS = [
  { id: "anger", label: "கோபம்", desc: "சினத்தை அடக்கி சாந்தம் பெற" },
  { id: "study", label: "கல்வி", desc: "கற்றலின் மேன்மை மற்றும் அறிவு" },
  { id: "friendship", label: "நட்பு", desc: "உண்மையான தோழமையின் சிறப்பு" },
  { id: "stress", label: "மனச்சுமை", desc: "இடுக்கண் வருங்கால் அமைதி காக்க" },
  { id: "decision", label: "முடிவெடுத்தல்", desc: "தெளிவான சிந்தனையுடன் செயல்பட" },
  { id: "love", label: "அன்பு", desc: "அன்பின் பெருமையும் கருணையும்" },
  { id: "leadership", label: "தலைமை", desc: "சிறந்த தலைவரின் பண்புகள்" },
  { id: "truth", label: "வாய்மை", desc: "உண்மை பேசுவதன் மேன்மை" },
];

export default function KuralForYou() {
  const [activeSituation, setActiveSituation] = useState("stress");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRecommendation = async (sitId) => {
    setActiveSituation(sitId);
    setLoading(true);
    setError("");
    try {
      const res = await getRecommendedKurals(sitId);
      setData(res);
    } catch (err) {
      setError(err.message || "பரிந்துரைகளைப் பெற முடியவில்லை.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setError("");
      try {
        const res = await getRecommendedKurals("stress");
        if (!ignore) setData(res);
      } catch (err) {
        if (!ignore) setError(err.message || "பரிந்துரைகளைப் பெற முடியவில்லை.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const currentSitMeta = SITUATIONS.find((s) => s.id === activeSituation) || SITUATIONS[0];

  return (
    <div className="kural-for-you-container">
      {/* 8 Life Context Situation Badges */}
      <div className="situation-tabs-scroll" role="tablist">
        {SITUATIONS.map((sit) => (
          <button
            key={sit.id}
            role="tab"
            aria-selected={activeSituation === sit.id}
            type="button"
            className={`situation-tab ${activeSituation === sit.id ? "active" : ""}`}
            onClick={() => loadRecommendation(sit.id)}
            style={{ padding: "10px 20px" }}
          >
            <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>{sit.label}</span>
          </button>
        ))}
      </div>

      {/* Selected Situation Header */}
      <div className="hero-teak-board" style={{ padding: "18px 24px", marginBottom: "24px" }}>
        <span className="hero-eyebrow">சூழல் வழிகாட்டல்</span>
        <h2 style={{ margin: "4px 0 6px", color: "#faebd7", fontSize: "1.5rem" }}>
          {currentSitMeta.label} — {currentSitMeta.desc}
        </h2>
        <p style={{ margin: 0, color: "#cdb79a", fontSize: "0.95rem" }}>
          இச்சூழலுக்கு திருவள்ளுவர் அருளிய மூன்று அருள் நெறி ஓலைகள்:
        </p>
      </div>

      {loading && (
        <div className="hero-teak-board" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#dfc28d" }}>சுவடியிலிருந்து பொருத்தமான குறள்கள் எடுக்கப்படுகின்றன…</p>
        </div>
      )}

      {error && (
        <div className="hero-teak-board" style={{ borderColor: "#8c281e", color: "#ffb4aa" }}>
          {error}
        </div>
      )}

      {/* LIST OF RECOMMENDED COUPLET LEAVES */}
      {!loading && data && data.recommendations && (
        <div className="recommendations-list">
          {data.recommendations.map((rec) => (
            <article key={rec.number} className="olai-strip rec-kural-leaf">
              <div className="cord-eyelet left" aria-hidden="true" />
              <div className="cord-eyelet right" aria-hidden="true" />

              <div className="rec-kural-meta">
                <span className="kural-num-badge">குறள் {rec.number}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--soot-muted)", fontWeight: "600" }}>
                  {data.situation_label}
                </span>
              </div>

              <div
                className="inscribed-text"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  lineHeight: "1.8",
                  marginBottom: "14px",
                }}
              >
                <div>{rec.line1}</div>
                <div>{rec.line2}</div>
              </div>

              <div
                style={{
                  background: "rgba(80, 48, 15, 0.12)",
                  borderTop: "1px dashed rgba(120, 80, 35, 0.3)",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "0.96rem",
                  color: "var(--soot-mid)",
                  lineHeight: "1.65",
                }}
              >
                <strong>பொருள்: </strong> {rec.meaning || rec.explanation}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
