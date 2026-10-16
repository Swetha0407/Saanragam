import React, { useState, useEffect } from "react";
import { getKuralByNumber } from "../api";

const PROMPTS = [
  { question: "மன அமைதி பெற வழி என்ன?", kuralNo: 7, paal: "அறத்துப்பால்", advice: "இறைவனின் மெய்மை உணர்ந்து பற்றுகளைத் துறப்பதே அமைதி தரும்." },
  { question: "கடினமான முடிவை எவ்வாறு எடுப்பது?", kuralNo: 467, paal: "பொருட்பால்", advice: "நன்கு சிந்தித்து ஆராய்ந்த பின்பே தொடங்குக; தொடங்கிய பின் சிந்திக்கலாம் என்பது இழுக்கு." },
  { question: "உண்மையான நட்பை எவ்வாறு அறிவது?", kuralNo: 788, paal: "பொருட்பால்", advice: "உடுக்கை இழந்தவன் கை போல துன்பக் காலத்தில் உடனே உதவுவதே நட்பு." },
  { question: "கோபத்தை வெல்வது எப்படி?", kuralNo: 305, paal: "அறத்துப்பால்", advice: "தன்னைத் தான் காக்க விரும்பினால் சினத்தைக் காக்க வேண்டும்; இல்லையேல் சினமே தன்னைக் கொல்லும்." },
  { question: "உண்மையான அன்பின் அடையாளம் எது?", kuralNo: 72, paal: "அறத்துப்பால்", advice: "அன்புடையவர்கள் தன் எலும்பையும் பிறருக்காகக் கொடுப்பர்." },
];

export default function ThiruvalluvarGuide() {
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[1]);
  const [activeKural, setActiveKural] = useState(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const consultValluvar = async (prompt) => {
    setSelectedPrompt(prompt);
    setLoading(true);
    try {
      const res = await getKuralByNumber(prompt.kuralNo);
      if (res.success && res.kural) {
        setActiveKural(res.kural);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      try {
        const res = await getKuralByNumber(PROMPTS[1].kuralNo);
        if (!ignore && res.success && res.kural) {
          setActiveKural(res.kural);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    // Map to closest philosophical pillar
    const matched = PROMPTS[customQuestion.length % PROMPTS.length];
    consultValluvar({
      question: customQuestion.trim(),
      kuralNo: matched.kuralNo,
      paal: matched.paal,
      advice: `உங்கள் வினாவிற்கு ("${customQuestion}") திருவள்ளுவர் அருளும் நெறி: ${matched.advice}`,
    });
    setCustomQuestion("");
  };

  return (
    <div className="valluvar-chamber-container">
      {/* SACRED CHAMBER STAGE WITH PORTRAIT */}
      <div className="valluvar-chamber-stage">
        <div className="chamber-backdrop">
          <div className="chamber-quote-bubble">
            <span className="hero-eyebrow" style={{ color: "#ffd580", margin: 0 }}>
              வள்ளுவர் அருளுரை
            </span>
            <p style={{ margin: "6px 0 0", fontSize: "1.15rem", lineHeight: "1.7", fontFamily: "var(--font-tamil-serif)" }}>
              "{selectedPrompt.advice}"
            </p>
          </div>
        </div>

        {/* CONSULTATION INPUT PANEL */}
        <div className="chamber-controls-panel">
          <form onSubmit={handleCustomSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="stylus-input"
              placeholder="உங்கள் வினாவை இங்கே கேட்கவும் (எ.கா. மன அமைதி பெற வழி என்ன?)…"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              style={{ flex: 1, minWidth: "240px" }}
            />
            <button type="submit" className="seal-btn">
              வள்ளுவரிடம் கேட்க
            </button>
          </form>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="hero-teak-board" style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ color: "#dfc28d", margin: 0 }}>வள்ளுவர் சிந்தித்து ஓலையில் பொறிக்கிறார்…</p>
        </div>
      )}

      {/* INSCRIBED COUNSEL PALM LEAF */}
      {!loading && activeKural && (
        <article className="olai-strip" style={{ padding: "clamp(32px, 5vw, 56px) clamp(64px, 7.5vw, 92px)", position: "relative", textAlign: "center" }}>
          <div className="cord-eyelet left" aria-hidden="true" />
          <div className="cord-eyelet right" aria-hidden="true" />

          <span className="kural-num-badge" style={{ marginBottom: "12px", display: "inline-block" }}>
            {selectedPrompt.paal} · குறள் {activeKural.number}
          </span>

          <div className="inscribed-text" style={{ fontSize: "1.35rem", fontWeight: "700", lineHeight: "1.8", maxWidth: "750px", margin: "0 auto 14px" }}>
            <div>{activeKural.line1}</div>
            <div>{activeKural.line2}</div>
          </div>

          <div style={{ maxWidth: "650px", margin: "0 auto", color: "var(--soot-mid)", fontSize: "1rem", lineHeight: "1.7" }}>
            <strong>விளக்கம்: </strong> {activeKural.explanation || activeKural.meaning}
          </div>
        </article>
      )}
    </div>
  );
}
