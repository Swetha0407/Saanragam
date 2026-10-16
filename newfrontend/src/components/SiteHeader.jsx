import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function SiteHeader() {
  const [lampOn, setLampOn] = useState(false);

  useEffect(() => {
    if (lampOn) {
      document.body.classList.add("dark-lamp");
    } else {
      document.body.classList.remove("dark-lamp");
    }

    const handlePointerMove = (e) => {
      document.body.style.setProperty("--lamp-x", `${e.clientX}px`);
      document.body.style.setProperty("--lamp-y", `${e.clientY}px`);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [lampOn]);

  return (
    <header className="site-header" role="banner">
      {/* Upper Teak Bar: Brand & Lamp */}
      <div className="site-header__top">
        <Link className="site-brand" to="/">
          <span className="site-brand__icon" aria-hidden="true">✦</span>
          <span className="site-brand__title">OlaiLens · சான்றகம்</span>
        </Link>

        <div className="nav-actions">
          <button
            type="button"
            className={`lamp-toggle-btn ${lampOn ? "lamp-active" : ""}`}
            onClick={() => setLampOn(!lampOn)}
            title="விளக்கு ஒளி"
            aria-pressed={lampOn}
          >
            <span
              className="lamp-indicator-dot"
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: lampOn ? "#ffd580" : "#8c532b",
                boxShadow: lampOn ? "0 0 8px #ffd580" : "none",
                marginRight: "4px",
              }}
            />
            <span>{lampOn ? "விளக்கு ஒளிர்கிறது" : "விளக்கு ஒளி"}</span>
          </button>
        </div>
      </div>

      {/* Lower Teak Shelf: All 8 Feature Buttons Centered in One Row */}
      <nav className="site-header__shelf" aria-label="முதன்மை வழிசெலுத்தல்">
        <div className="site-header__shelf-inner">
          <NavLink to="/" end className="shelf-link">முகப்பு</NavLink>
          <NavLink to="/kural" className="shelf-link">திருக்குறள்</NavLink>
          <NavLink to="/verify" className="shelf-link">மெய்ப்பிப்பு</NavLink>
          <NavLink to="/kural-for-you" className="shelf-link">சூழல் குறள்</NavLink>
          <NavLink to="/word-meaning" className="shelf-link">சொல்லாய்வாளர்</NavLink>
          <NavLink to="/word-history" className="shelf-link">சொல்லின் மரபு</NavLink>
          <NavLink to="/daily-kural" className="shelf-link">இன்றைய குறள்</NavLink>
          <NavLink to="/thiruvalluvar" className="shelf-link">வள்ளுவர்</NavLink>
        </div>
      </nav>
    </header>
  );
}
