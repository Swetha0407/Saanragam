import "./style.css";
import { LeafMotionController } from "./motion.js";
import { kuralAudio } from "./audio.js";

// DOM helper
const $ = (id) => document.getElementById(id);

let kurals = [];
let chapters = [];
let index = 0;
let fontScale = 1;
let busy = false;
let lampMode = false;
let motion = null;

/**
 * Traditional Classical Tamil Numeral Converter (1 to 1330)
 * 1: ௧, 2: ௨, 3: ௩, 4: ௪, 5: ௫, 6: ௬, 7: ௭, 8: ௮, 9: ௯
 * 10: ௰, 100: ௱, 1000: ௲
 */
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

  if (thousands > 0) {
    res += (thousands === 1 ? "" : digits[thousands]) + "௲";
  }
  if (hundreds > 0) {
    res += (hundreds === 1 ? "" : digits[hundreds]) + "௱";
  }
  if (tens > 0) {
    res += (tens === 1 ? "" : digits[tens]) + "௰";
  }
  if (ones > 0) {
    res += digits[ones];
  }
  return res || "௦";
}

/**
 * Categorize into the Three Classical Books (முப்பால்)
 * அறத்துப்பால்: Ch 1-38
 * பொருட்பால்: Ch 39-108
 * இன்பத்துப்பால் / காமத்துப்பால்: Ch 109-133
 */
function getPaalForChapter(chNo) {
  if (chNo <= 38) return { name: "அறத்துப்பால்", en: "Book of Virtue", range: "1–38" };
  if (chNo <= 108) return { name: "பொருட்பால்", en: "Book of Wealth", range: "39–108" };
  return { name: "இன்பத்துப்பால்", en: "Book of Love", range: "109–133" };
}

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
    // Search filtering
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

  const lines = (k.tamil || "").split("\n");
  const l1 = lines[0] || "";
  const l2 = lines[1] || "";

  if ($("chapter-name")) $("chapter-name").textContent = k.chapter;
  if ($("kural-tamil")) {
    $("kural-tamil").innerHTML = `
      <span class="kural-line line-1">${l1}</span>
      <span class="kural-line line-2">${l2}</span>
    `;
  }
  if ($("kural-modern")) $("kural-modern").textContent = k.modern;
  if ($("kural-english")) $("kural-english").textContent = k.english;
  if ($("jump-input")) $("jump-input").value = "";

  // Update physical leaf bundle thickness layers
  const progressRatio = (index + 1) / kurals.length;
  if ($("progress-bar")) $("progress-bar").style.width = `${progressRatio * 100}%`;

  const leftStack = $("stack-left-layers");
  const rightStack = $("stack-right-layers");
  if (leftStack) leftStack.style.height = `${Math.max(15, progressRatio * 90)}%`;
  if (rightStack) rightStack.style.height = `${Math.max(15, (1 - progressRatio) * 90)}%`;

  kuralAudio.setKural(k.n, l1, l2, "kural");

  history.replaceState(null, "", `#${k.n}`);
}

function goTo(newIndex) {
  if (newIndex < 0 || newIndex >= kurals.length || newIndex === index || busy) return;
  busy = true;

  kuralAudio.stop();

  const dir = newIndex > index ? "to-next" : "to-prev";
  const oldIndex = index;
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
  const val = $("jump-input").value.trim();
  const n = parseInt(val, 10);
  if (!Number.isInteger(n) || n < 1 || n > kurals.length) {
    if (motion) motion.shakeInvalid();
    $("jump-input").classList.add("invalid");
    setTimeout(() => $("jump-input").classList.remove("invalid"), 400);
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
  localStorage.setItem("olailens_font_scale", fontScale);
}

/**
 * Cover Untying Animation (Cord slides out, knot loosens, top board swings up)
 */
function showApp() {
  const cover = $("cover");
  cover.classList.add("open-anim");

  setTimeout(() => {
    cover.hidden = true;
    $("app").hidden = false;
    if (motion) motion.cacheHolePosition();
  }, 1050);
}

function showCover() {
  kuralAudio.stop();
  const cover = $("cover");
  cover.hidden = false;
  $("app").hidden = true;
  cover.classList.remove("open-anim");
}

const openIndex = () => {
  $("index-panel").hidden = false;
  buildIndexPanel();
  $("index-search")?.focus();
};

const closeIndex = () => {
  $("index-panel").hidden = true;
};

/**
 * Lamp-lit Night Mode (Vilakku)
 */
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
  localStorage.setItem("olailens_lamp_mode", lampMode ? "true" : "false");
}

function toggleLampMode() {
  setLampMode(!lampMode);
}

function initLampTracking() {
  let pendingX = window.innerWidth / 2;
  let pendingY = window.innerHeight / 2;
  let ticking = false;

  const updateLampPosition = () => {
    document.documentElement.style.setProperty("--lamp-x", `${pendingX}px`);
    document.documentElement.style.setProperty("--lamp-y", `${pendingY}px`);
    ticking = false;
  };

  window.addEventListener("pointermove", (e) => {
    pendingX = e.clientX;
    pendingY = e.clientY;
    if (!ticking) {
      requestAnimationFrame(updateLampPosition);
      ticking = true;
    }
  });

  // Subtle organic flicker on lamp intensity (±4%)
  let flickerAngle = 0;
  const flickerLoop = () => {
    if (lampMode && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flickerAngle += 0.05;
      const intensity = 1 + 0.04 * (Math.sin(flickerAngle * 1.3) * Math.cos(flickerAngle * 0.7));
      document.documentElement.style.setProperty("--lamp-intensity", intensity.toFixed(3));
    }
    requestAnimationFrame(flickerLoop);
  };
  requestAnimationFrame(flickerLoop);
}

/**
 * Keybindings & Gestures
 */
function initKeyboardAndGestures() {
  let keyHoldTimer = null;
  let stopRiffleFn = null;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeIndex();
      return;
    }

    // Ignore hotkeys when typing in search or jump input
    if (e.target.tagName === "INPUT" || $("app").hidden) return;

    if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      toggleLampMode();
      return;
    }

    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      if ($("index-panel").hidden) openIndex();
      else closeIndex();
      return;
    }

    if (e.key === "/") {
      e.preventDefault();
      $("jump-input")?.focus();
      return;
    }

    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      const dbg = $("debug-overlay");
      if (dbg) dbg.hidden = !dbg.hidden;
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      goTo(kurals.length - 1);
      return;
    }

    // Hold ArrowRight / ArrowLeft for Riffle
    if (e.key === "ArrowRight") {
      if (!e.repeat) {
        next();
        keyHoldTimer = setTimeout(() => {
          if (motion && !stopRiffleFn) {
            stopRiffleFn = motion.startRiffle("to-next", () => {
              if (index < kurals.length - 1) {
                index++;
                renderContent();
              }
            });
          }
        }, 320);
      }
    } else if (e.key === "ArrowLeft") {
      if (!e.repeat) {
        prev();
        keyHoldTimer = setTimeout(() => {
          if (motion && !stopRiffleFn) {
            stopRiffleFn = motion.startRiffle("to-prev", () => {
              if (index > 0) {
                index--;
                renderContent();
              }
            });
          }
        }, 320);
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      clearTimeout(keyHoldTimer);
      if (stopRiffleFn) {
        stopRiffleFn();
        stopRiffleFn = null;
        busy = false;
      }
    }
  });
}

// Attach UI Event Listeners
$("open-btn").addEventListener("click", showApp);
$("home-btn").addEventListener("click", showCover);
$("theme-btn").addEventListener("click", toggleLampMode);
$("index-btn").addEventListener("click", openIndex);
$("index-close").addEventListener("click", closeIndex);
$("next-btn").addEventListener("click", next);
$("prev-btn").addEventListener("click", prev);
$("jump-btn").addEventListener("click", jump);
$("jump-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") jump();
});
$("font-up").addEventListener("click", () => setFont(0.08));
$("font-down").addEventListener("click", () => setFont(-0.08));

// Index search input filtering
$("index-search")?.addEventListener("input", (e) => {
  buildIndexPanel(e.target.value);
});

// Restore saved preferences
const savedScale = localStorage.getItem("olailens_font_scale");
if (savedScale) {
  fontScale = parseFloat(savedScale);
  document.documentElement.style.setProperty("--scale", fontScale);
}

const savedTheme = localStorage.getItem("olailens_lamp_mode");
if (savedTheme !== null) {
  setLampMode(savedTheme === "true");
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  setLampMode(true);
}

// Initialize Motion Physics Controller
motion = new LeafMotionController({
  onTextSwap: () => {
    renderContent();
  },
  onTurnSettled: () => {
    busy = false;
  }
});

initLampTracking();
initKeyboardAndGestures();
kuralAudio.attachButton($("kural-audio-btn"));

// Fetch Thirukkural Data
fetch("/kurals.json")
  .then((r) => r.json())
  .then((data) => {
    kurals = data;
    buildChapters();
    buildIndexPanel();

    const start = parseInt(location.hash.slice(1), 10);
    if (start >= 1 && start <= kurals.length) {
      index = start - 1;
      $("cover").hidden = true;
      $("app").hidden = false;
      motion.cacheHolePosition();
    }
    renderContent();
  })
  .catch(() => {
    $("kural-english").textContent = "Could not load kurals.json";
  });
