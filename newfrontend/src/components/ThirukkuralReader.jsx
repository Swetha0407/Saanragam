import React, { useEffect, useRef } from "react";
import { LeafMotionController } from "../motion.js";
import { kuralAudio } from "../audio.js";
import "../style.css";

function toTamilNumeral(n) {
  if (n < 1 || n > 1330) return "";
  const digits = ["", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"];
  let num = n;
  let res = "";
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = Math.floor(num / 100);
  num %= 100;
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  if (thousands > 0) res += (thousands === 1 ? "" : digits[thousands]) + "௲";
  if (hundreds > 0) res += (hundreds === 1 ? "" : digits[hundreds]) + "௱";
  if (tens > 0) res += (tens === 1 ? "" : digits[tens]) + "௰";
  if (ones > 0) res += digits[ones];
  return res || "௦";
}

function getPaalForChapter(chNo) {
  if (chNo <= 38) return { name: "அறத்துப்பால்", en: "Book of Virtue", range: "1–38" };
  if (chNo <= 108) return { name: "பொருட்பால்", en: "Book of Wealth", range: "39–108" };
  return { name: "இன்பத்துப்பால்", en: "Book of Love", range: "109–133" };
}

export default function ThirukkuralReader() {
  const containerRef = useRef(null);

  useEffect(() => {
    let kurals = [];
    let chapters = [];
    let index = 0;
    let fontScale = 1;
    let busy = false;
    let lampMode = false;
    let motion = null;
    let disposed = false;

    const $ = (id) => document.getElementById(id);

    function buildChapters() {
      const map = new Map();
      kurals.forEach((k, i) => {
        const key = k.chapterNo ?? k.chapter;
        if (!map.has(key)) {
          const chNo = k.chapterNo || (map.size + 1);
          const paalInfo = getPaalForChapter(chNo);
          map.set(key, {
            no: chNo,
            name: k.chapter,
            en: k.chapterEn,
            paal: paalInfo.name,
            paalEn: paalInfo.en,
            range: paalInfo.range,
            first: i
          });
        }
      });
      chapters = [...map.values()];
    }

    function buildIndexPanel(filterQuery = "") {
      const list = $("index-list");
      if (!list) return;
      list.innerHTML = "";

      const query = filterQuery.trim().toLowerCase();
      let lastPaal = null;

      chapters.forEach((c) => {
        const match =
          !query ||
          c.name.toLowerCase().includes(query) ||
          (c.en && c.en.toLowerCase().includes(query)) ||
          String(c.no).includes(query);

        if (!match) return;

        if (c.paal !== lastPaal && !query) {
          lastPaal = c.paal;
          const sep = document.createElement("div");
          sep.className = "paal-separator-leaf";
          sep.innerHTML = `
            <span class="paal-title">${c.paal}</span>
            <span class="paal-range">${c.range} அதிகாரங்கள்</span>
          `;
          list.appendChild(sep);
        }

        const currentChNo = kurals[index]?.chapterNo;
        const isCurrent = c.no === currentChNo;

        const b = document.createElement("button");
        b.className = `chapter-item ${isCurrent ? "active" : ""}`;
        b.dataset.chNo = c.no;
        b.innerHTML = `
          <span class="c-no">${c.no}.</span>
          <span class="c-name">${c.name}</span>
        `;

        b.addEventListener("click", () => {
          closeIndex();
          if (c.first !== index) {
            goTo(c.first);
          }
        });

        list.appendChild(b);
      });
    }

    function renderContent() {
      const k = kurals[index];
      if (!k) return;

      const numEl = $("kural-number");
      if (numEl) {
        numEl.innerHTML = `
          <span class="arabic-numeral">குறள் ${k.n}</span>
        `;
      }

      const chEl = $("chapter-name");
      if (chEl) chEl.textContent = k.chapter;

      const lines = (k.tamil || "").split("\n");
      const l1 = lines[0] || "";
      const l2 = lines[1] || "";

      const tEl = $("kural-tamil");
      if (tEl) {
        tEl.innerHTML = `
          <span class="kural-line line-1">${l1}</span>
          <span class="kural-line line-2">${l2}</span>
        `;
      }

      const mEl = $("kural-modern");
      if (mEl) mEl.textContent = k.modern;

      const eEl = $("kural-english");
      if (eEl) eEl.textContent = k.english;

      const jEl = $("jump-input");
      if (jEl) jEl.value = "";

      const progressRatio = (index + 1) / kurals.length;
      const pb = $("progress-bar");
      if (pb) pb.style.width = `${progressRatio * 100}%`;

      const leftStack = $("stack-left-layers");
      const rightStack = $("stack-right-layers");
      if (leftStack) leftStack.style.height = `${Math.max(15, progressRatio * 90)}%`;
      if (rightStack) rightStack.style.height = `${Math.max(15, (1 - progressRatio) * 90)}%`;

      kuralAudio.setKural(k.n, l1, l2, "kural");
    }

    function goTo(newIndex) {
      if (newIndex < 0 || newIndex >= kurals.length || newIndex === index || busy) return;
      busy = true;

      kuralAudio.stop();

      const dir = newIndex > index ? "to-next" : "to-prev";
      index = newIndex;

      if (motion) {
        motion.turn(dir, newIndex);
      } else {
        renderContent();
        busy = false;
      }
    }

    const next = () => {
      if (index < kurals.length - 1) goTo(index + 1);
    };

    const prev = () => {
      if (index > 0) goTo(index - 1);
    };

    function jump() {
      const jEl = $("jump-input");
      if (!jEl) return;
      const val = jEl.value.trim();
      const n = parseInt(val, 10);
      if (!Number.isInteger(n) || n < 1 || n > kurals.length) {
        if (motion) motion.shakeInvalid();
        jEl.classList.add("invalid");
        setTimeout(() => jEl.classList.remove("invalid"), 400);
        return;
      }

      const targetIndex = n - 1;
      if (targetIndex === index) return;

      kuralAudio.onJump(n);

      if (motion) {
        busy = true;
        index = targetIndex;
        motion.jumpTo(n, () => {
          renderContent();
          busy = false;
        });
      } else {
        goTo(targetIndex);
      }
    }

    function setFont(delta) {
      fontScale = Math.min(1.6, Math.max(0.75, fontScale + delta));
      document.documentElement.style.setProperty("--scale", fontScale);
    }

    function showApp() {
      const cover = $("cover");
      if (cover) {
        cover.classList.add("open-anim");
        setTimeout(() => {
          if (disposed) return;
          cover.hidden = true;
          const app = $("app");
          if (app) app.hidden = false;
          if (motion) motion.cacheHolePosition();
        }, 1050);
      }
    }

    function showCover() {
      kuralAudio.stop();
      const cover = $("cover");
      const app = $("app");
      if (cover && app) {
        cover.hidden = false;
        app.hidden = true;
        cover.classList.remove("open-anim");
      }
    }

    function openIndex() {
      const p = $("index-panel");
      if (p) {
        p.hidden = false;
        buildIndexPanel();
        $("index-search")?.focus();
      }
    }

    function closeIndex() {
      const p = $("index-panel");
      if (p) p.hidden = true;
    }

    function setLampMode(active) {
      lampMode = active;
      if (lampMode) {
        document.body.classList.add("dark-lamp");
        const dbgMode = $("dbg-mode");
        if (dbgMode) dbgMode.textContent = "Lamp-Lit (Night)";
      } else {
        document.body.classList.remove("dark-lamp");
        const dbgMode = $("dbg-mode");
        if (dbgMode) dbgMode.textContent = "Daylight Reading";
      }
    }

    function toggleLampMode() {
      setLampMode(!lampMode);
    }

    $("open-btn")?.addEventListener("click", showApp);
    $("home-btn")?.addEventListener("click", showCover);
    $("theme-btn")?.addEventListener("click", toggleLampMode);
    $("index-btn")?.addEventListener("click", openIndex);
    $("index-close")?.addEventListener("click", closeIndex);
    $("next-btn")?.addEventListener("click", next);
    $("prev-btn")?.addEventListener("click", prev);
    $("jump-btn")?.addEventListener("click", jump);
    $("jump-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") jump();
    });
    $("font-up")?.addEventListener("click", () => setFont(0.08));
    $("font-down")?.addEventListener("click", () => setFont(-0.08));
    $("index-search")?.addEventListener("input", (e) => {
      buildIndexPanel(e.target.value);
    });

    const keydownHandler = (e) => {
      if (e.key === "Escape") {
        closeIndex();
        return;
      }
      if (e.target.tagName === "INPUT" || $("app")?.hidden) return;

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        toggleLampMode();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if ($("index-panel")?.hidden) openIndex();
        else closeIndex();
      } else if (e.key === "/") {
        e.preventDefault();
        $("jump-input")?.focus();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        const dbg = $("debug-overlay");
        if (dbg) dbg.hidden = !dbg.hidden;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener("keydown", keydownHandler);

    try {
      motion = new LeafMotionController({
        onTextSwap: () => {
          renderContent();
        },
        onTurnSettled: () => {
          busy = false;
        }
      });
    } catch (err) {
      console.warn("LeafMotionController error:", err);
    }

    kuralAudio.attachButton($("kural-audio-btn"));

    fetch("/kurals.json")
      .then((r) => r.json())
      .then((data) => {
        if (disposed) return;
        kurals = data;
        buildChapters();
        buildIndexPanel();
        renderContent();
        if (motion) motion.cacheHolePosition();
      })
      .catch((err) => {
        console.error("Failed to load kurals.json", err);
      });

    return () => {
      disposed = true;
      kuralAudio.stop();
      document.removeEventListener("keydown", keydownHandler);
      if (motion && motion.stopLoop) {
        motion.stopLoop();
      }
    };
  }, []);

  return (
    <div className="olailens-reader-root" ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {/* COVER: AUTHENTIC TEAK-WOOD BOARDS WITH RED CORD & KNOT */}
      <section id="cover" className="cover">
        <div className="cover-bundle">
          {/* Bottom Teak Board */}
          <div className="teak-board bottom-board" />

          {/* Palm leaf stack peek under cover */}
          <div className="cover-leaf-peek" />

          {/* Top Teak Board with branded scorch text */}
          <div className="teak-board top-board" id="cover-top-board">
            <div className="board-texture" />
            <div className="board-hole hole-left" />
            <div className="board-hole hole-right" />

            <div className="scorch-content">
              <span className="cover-kicker">பழந்தமிழ்ச் சுவடித் திரட்டு</span>
              <h1 className="cover-title">OlaiLens</h1>
              <div className="rule kolam-rule">
                <svg viewBox="0 0 190 16" className="kolam-svg">
                  <use href="#pulli-kolam" />
                </svg>
              </div>
              <p className="cover-tamil">திருக்குறள்</p>
              <p className="cover-sub">
                1,330 couplets of Thiruvalluvar, inscribed on a palm-leaf manuscript bundle
              </p>
            </div>

            {/* Red Cotton Cord Knot & Pull-tab */}
            <div className="cover-cord-assembly" id="cover-cord">
              <div className="cord-strand cord-top" />
              <div className="cord-knot" id="cord-knot">
                <div className="knot-core" />
                <div className="knot-loop" />
              </div>
              <div className="cord-strand cord-bottom" />
              {/* The pull-tab is the open button */}
              <button
                id="open-btn"
                className="pull-tab"
                aria-label="கயிற்றை அவிழ்த்து சுவடியைத் திறக்க / Untie cord and open"
              >
                <span className="tab-ribbon" />
                <span className="tab-label">சுவடி திறக்க · Pull to Open</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* APP: LIVING PALM-LEAF CHUVADI READER */}
      <div id="app" hidden>
        <header>
          <div className="brand-group">
            <button id="home-btn" className="brand" title="சுவடிக்கட்டு முகப்பு / Back to cover">
              <span className="brand-wood">OlaiLens</span>
              <span className="brand-tamil">ஓலை</span>
            </button>
            <span className="scribe-indicator" aria-hidden="true">
              ஏட்டுச்சுவடி
            </span>
          </div>

          <div className="tools">
            <button id="theme-btn" className="ghost tool-btn" title="விளக்கு ஒளி / Lamp-lit Mode (Press 'd')">
              <svg class="tool-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2c-.6 0-1 .4-1 1 0 1.5-1.5 2.5-1.5 4 0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0-1.5-1.5-2.5-1.5-4 0-.6-.4-1-1-1zm-6 9c0 3.3 2.7 6 6 6s6-2.7 6-6H4z" />
              </svg>
              <span className="btn-text">விளக்கு</span>
            </button>
            <button id="index-btn" className="ghost tool-btn" title="அதிகாரங்கள் / Chapters (Press 'c')">
              <span className="btn-icon">☰</span>
              <span className="btn-text">அதிகாரம்</span>
            </button>
            <div className="font-stepper" role="group" aria-label="எழுத்து அளவு / Font size">
              <button id="font-down" className="ghost tool-btn" title="சிறிய எழுத்து / Smaller font">
                A−
              </button>
              <button id="font-up" className="ghost tool-btn" title="பெரிய எழுத்து / Larger font">
                A+
              </button>
            </div>
          </div>
        </header>

        {/* BUNDLE WRAPPER & PHYSICAL MANUSCRIPT BOOK */}
        <div className="bundle-container">
          {/* Physical Leaf Bundle Thickness on the edge */}
          <div className="bundle-edge left-edge" id="bundle-edge-left" title="முந்தைய ஏடுகள் / Previous leaves">
            <div className="stack-layers" id="stack-left-layers" />
          </div>

          <main id="book" role="region" aria-label="திருக்குறள் ஏட்டுச்சுவடி / Thirukkural Palm Leaf">
            {/* Continuous Twisted Red Cord with cast shadow */}
            <div id="cord" className="cord">
              <div className="cord-thread cord-thread-left" />
              <div className="cord-thread cord-thread-right" />
              <div className="cord-shadow" />
            </div>

            {/* LEFT LEAF: PRIMARY TAMIL COUPLET STRIP */}
            <section className="leaf left" id="leaf-left">
              <div className="leaf-texture-overlay" />
              <div className="leaf-midrib" />
              <span className="hole left-hole" />

              <div className="leaf-content" aria-live="polite">
                <div className="kural-header">
                  <div className="kural-header-left">
                    <p id="kural-number" className="num" />
                    <p id="chapter-name" className="chapter" />
                  </div>
                  <button
                    id="kural-audio-btn"
                    type="button"
                    className="kural-audio-btn"
                    aria-label="குறள் ஒலி கேட்க / Play Kural audio"
                    aria-pressed="false"
                    title="குறள் ஒலி கேட்க / Play Kural audio"
                  >
                    <svg className="audio-icon audio-icon-play" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <svg className="audio-icon audio-icon-pause" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ display: "none" }}>
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  </button>
                </div>

                <div className="rule small kolam-rule">
                  <svg viewBox="0 0 190 16" className="kolam-svg">
                    <use href="#pulli-kolam" />
                  </svg>
                </div>

                {/* Two incised lines: 4 words top, 3 words bottom */}
                <p id="kural-tamil" className="tamil" />
              </div>
              <div className="contact-shadow" id="left-contact-shadow" />
            </section>

            {/* RIGHT LEAF: COMMENTARY SLIP (MODERN TAMIL & ENGLISH) */}
            <section className="leaf right" id="leaf-right">
              <div className="leaf-texture-overlay" />
              <div className="leaf-midrib" />
              <span className="hole right-hole" />

              <div className="leaf-content">
                <span className="scribe-label">இன்றைய உரை</span>
                <h2 className="section-title">இன்றைய தமிழில்</h2>
                <p id="kural-modern" />

                <div className="rule small kolam-rule">
                  <svg viewBox="0 0 190 16" className="kolam-svg">
                    <use href="#pulli-kolam" />
                  </svg>
                </div>

                <span className="scribe-label">ENGLISH TRANSLATION</span>
                <h2 className="section-title">English</h2>
                <p id="kural-english" />
              </div>
              <div className="contact-shadow" id="right-contact-shadow" />
            </section>

            {/* DYNAMIC FLIPPER FOR 3D SPRING LEAF TURNS */}
            <div id="flipper" className="flipper" aria-hidden="true" />
          </main>

          {/* Bundle Stack on the right side */}
          <div className="bundle-edge right-edge" id="bundle-edge-right" title="அடுத்த ஏடுகள் / Remaining leaves">
            <div className="stack-layers" id="stack-right-layers" />
          </div>
        </div>

        {/* PROGRESS & LEAF STACK INDICATOR */}
        <div className="progress" aria-hidden="true">
          <div id="progress-bar" />
        </div>

        {/* BOTTOM NAVIGATION CONTROLS */}
        <nav aria-label="சுவடி வழிசெலுத்தல் / Leaf navigation">
          <button id="prev-btn" className="gold-btn leaf-nav-btn" title="முந்தைய குறள் / Previous (←)">
            <span className="nav-arrow">←</span> முந்தையது
          </button>

          <div className="jump">
            <label htmlFor="jump-input" className="visually-hidden">
              குறள் எண்
            </label>
            <input id="jump-input" type="number" min="1" max="1330" placeholder="குறள் 1–1330" />
            <button id="jump-btn" className="ghost jump-submit-btn">
              செல்க
            </button>
          </div>

          <button id="next-btn" className="gold-btn leaf-nav-btn" title="அடுத்த குறள் / Next (→)">
            அடுத்தது <span className="nav-arrow">→</span>
          </button>
        </nav>
      </div>

      {/* CHAPTER INDEX (FANNED-OUT LEAF TABS GROUPED BY 3 BOOKS) */}
      <aside
        id="index-panel"
        className="index-panel"
        hidden
        aria-modal="true"
        role="dialog"
        aria-label="அதிகார அட்டவணை / Chapter Index"
      >
        <div className="panel-head">
          <div className="panel-title-wrap">
            <span className="panel-sub">133 அதிகாரங்கள்</span>
            <h3>அதிகாரச் சுவடி</h3>
          </div>
          <button id="index-close" className="ghost close-btn" title="மூடுக / Close (Esc)">
            ✕
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="index-search-wrap">
          <input
            id="index-search"
            type="search"
            placeholder="அதிகாரம் அல்லது எண் தேடுக..."
            autoComplete="off"
          />
        </div>

        {/* Fanned-out Leaf Tab List */}
        <div id="index-list" className="fanned-leaf-list" role="list" />
      </aside>

      {/* HIDDEN DEBUG OVERLAY (PRESS 'm' TO TOGGLE) */}
      <div id="debug-overlay" className="debug-overlay" hidden>
        <div className="debug-header">
          <span>ŌLAI MOTION TELEMETRY</span>
          <span className="debug-key">[M] close</span>
        </div>
        <div className="debug-row">
          <span>Angle (--turn):</span>
          <span id="dbg-angle">0.00°</span>
        </div>
        <div className="debug-row">
          <span>Velocity:</span>
          <span id="dbg-vel">0.00 deg/s</span>
        </div>
        <div className="debug-row">
          <span>Spring State:</span>
          <span id="dbg-state">settled</span>
        </div>
        <div className="debug-row">
          <span>Slice Lag:</span>
          <span id="dbg-lag">0.00°</span>
        </div>
        <div className="debug-row">
          <span>Active Flippers:</span>
          <span id="dbg-flippers">0</span>
        </div>
        <div className="debug-row">
          <span>Frame Rate:</span>
          <span id="dbg-fps">60 fps</span>
        </div>
        <div className="debug-row">
          <span>Mode:</span>
          <span id="dbg-mode">Daylight</span>
        </div>
      </div>
    </div>
  );
}
