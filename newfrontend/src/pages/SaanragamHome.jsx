import React from "react";
import { Link } from "react-router-dom";
import SaanragamLayout from "../components/SaanragamLayout";

const FEATURES = [
  {
    href: "/kural",
    tag: "முப்பால் ஏடு",
    title: "திருக்குறள்",
    desc: "1330 குறள்களை உண்மையான ஓலைச்சுவடி அமைப்பில் 3D சுழற்சி மற்றும் உரையுடன் வாசிக்க.",
  },
  {
    href: "/verify",
    tag: "உரை மெய்ப்பிப்பு",
    title: "குறள் சரிபார்ப்பு",
    desc: "நீங்கள் கண்ட திருக்குறள் வரிகள் சரியானவையா என்பதைத் தரவுத்தளத்துடன் ஒப்பிட்டு அறிய.",
  },
  {
    href: "/kural-for-you",
    tag: "வாழ்வியல் ஆலோசனை",
    title: "சூழல் குறள்",
    desc: "கோபம், கல்வி, நட்பு, மனச்சுமை உள்ளிட்ட 8 வாழ்க்கைச் சூழல்களுக்குத் திருவள்ளுவரின் நெறி.",
  },
  {
    href: "/word-meaning",
    tag: "சொற்பொருட் களஞ்சியம்",
    title: "சொல்லாய்வாளர்",
    desc: "தமிழ்ச் சொற்களின் ஆழமான அகராதிப் பொருள் மற்றும் குறள் சூழல் ஒப்பீடு.",
  },
  {
    href: "/word-history",
    tag: "திராவிட மொழி ஆய்வு",
    title: "சொல்லின் மரபு",
    desc: "DEDR தரவுகளுடன் பழந்தமிழ்ச் சொற்களின் வேர்ச்சொல் மற்றும் திராவிட மொழி ஒப்பீடுகள்.",
  },
  {
    href: "/daily-kural",
    tag: "தினசரி நற்பேறு",
    title: "இன்றைய குறள்",
    desc: "ஒவ்வொரு நாளும் விடியலைத் தமிழ் மரபுடன் தொடங்க அர்ப்பணிக்கப்பட்ட திருக்குறள் ஓலை.",
  },
  {
    href: "/thiruvalluvar",
    tag: "ஞானக் கூடம்",
    title: "திருவள்ளுவர் வழிகாட்டி",
    desc: "வாழ்க்கையின் சிக்கலான வினாக்களுக்கு திருவள்ளுவருடன் உரையாடி விடைபெறும் அரங்கம்.",
  },
];

export default function SaanragamHome() {
  return (
    <SaanragamLayout
      eyebrow="தமிழ் மரபின் திறவுகோல் · ஓலைச்சுவடி வடிவம்"
      title="சான்றகம் · OlaiLens"
      subtitle="பழந்தமிழின் ஞானத்தையும், ஈராயிரம் ஆண்டுத் திருக்குறள் இலக்கிய மரபையும் நிஜமான ஓலைச்சுவடி அமைப்பில் இன்றைய தலைமுறையுடன் இணைக்கும் தளம்."
    >
      {/* GRAND TEAK WOOD BUNDLE COVER */}
      <div className="home-bundle-cover">
        <div className="bundle-braided-cord cord-left" aria-hidden="true" />
        <div className="bundle-braided-cord cord-right" aria-hidden="true" />

        <span className="hero-eyebrow" style={{ color: "#ffd580" }}>
          செம்மொழித் தமிழ் களஞ்சியம்
        </span>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", margin: "8px 0 16px", color: "#faebd7" }}>
          திருக்குறள் ஓலைச்சுவடிக் கட்டு
        </h2>
        <p style={{ maxWidth: "600px", margin: "0 auto 24px", color: "#cdb79a", lineHeight: "1.7" }}>
          மரபார்ந்த தேக்கு மரப் பலகைகளும், சிவப்புக் கயிறும், எழுத்தாணியால் பொறிக்கப்பட்ட மை எழுத்துக்களும் கொண்ட முழுமையான தமிழ் அனுபவம்.
        </p>

        <div className="home-cover-actions">
          <Link to="/kural" className="seal-btn" style={{ fontSize: "1.05rem", padding: "14px 28px" }}>
            திருக்குறள் ஏடு திறக்க
          </Link>
        </div>
      </div>

      {/* SECTION HEADER FOR FEATURE LEAVES */}
      <div className="home-section-header">
        <span className="hero-eyebrow">ஏட்டுப் பேழை பகுதிகள்</span>
        <h3 className="home-section-title">சான்றகத்தின் 7 தனித்துவப் பகுதிகள்</h3>
        <p className="home-section-sub">ஒவ்வொரு ஏடும் ஒரு தனித்துவமான தமிழ் இலக்கிய ஆய்வு அனுபவத்தை வழங்குகிறது.</p>
      </div>

      {/* FANNED-OUT FEATURE LEAVES GRID */}
      <div className="home-features-grid" role="list">
        {FEATURES.map((item, idx) => (
          <Link
            to={item.href}
            key={item.href}
            className={`olai-strip feature-leaf-card ${idx === 0 ? "featured-card" : ""}`}
            role="listitem"
          >
            <div className="cord-eyelet left" aria-hidden="true" />
            <div className="cord-eyelet right" aria-hidden="true" />

            <div className="feature-leaf-top">
              <div className="feature-leaf-header">
                <span className="feature-leaf-tag">{item.tag}</span>
                <span className="feature-leaf-arrow" aria-hidden="true">→</span>
              </div>

              <h3 className="feature-leaf-title inscribed-text">{item.title}</h3>
              <p className="feature-leaf-desc">{item.desc}</p>
            </div>

            <div className="feature-leaf-bottom">
              <span className="feature-leaf-btn">ஏடு திறக்க →</span>
            </div>
          </Link>
        ))}
      </div>
    </SaanragamLayout>
  );
}
