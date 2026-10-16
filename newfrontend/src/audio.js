/**
 * src/audio.js - Thirukkural Audio Controller
 * OlaiLens (சான்றகம்) Platform
 * 
 * Features:
 * - High-fidelity MP3 playback from /audio/{kuralNumber}.mp3 (or VITE_AUDIO_BASE)
 * - SpeechSynthesis ("ta-IN") fallback on network error or non-Kural books
 * - Palm-leaf styled Play/Pause inline SVG button (min 44x44px target)
 * - Synchronous audio.play() call for iOS Safari compliance
 * - Line 1 / Line 2 couplet synchronization based on character split
 * - Single sound enforcement & immediate stop on navigation
 * - 150ms debounce for rapid turns
 * - Preload metadata for next kural; released on jumps
 * - Space bar toggle & visibilitychange auto-pause
 */

const AUDIO_BASE = (import.meta.env && import.meta.env.VITE_AUDIO_BASE) || "/audio";

class KuralAudioController {
  constructor() {
    this.currentKuralNumber = 1;
    this.currentBook = "kural"; // "kural", "tolkappiyam", etc.
    this.line1Text = "";
    this.line2Text = "";
    this.isPlaying = false;
    this.isSpeech = false;

    this.audio = new Audio();
    this.preloadAudio = null;
    this.debounceTimer = null;
    this.speechUtterance = null;
    this.speechTimer = null;

    this.btnEl = null;
    this.tooltipEl = null;

    this._boundOnTimeUpdate = this._onTimeUpdate.bind(this);
    this._boundOnEnded = this._onEnded.bind(this);
    this._boundOnError = this._onError.bind(this);

    this.audio.addEventListener("timeupdate", this._boundOnTimeUpdate);
    this.audio.addEventListener("ended", this._boundOnEnded);
    this.audio.addEventListener("error", this._boundOnError);

    // Pause on tab hide / visibilitychange
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.isPlaying) {
        this.pause();
      }
    });

    // Space bar toggle (when not typing in an input)
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.key === " ") {
        const active = document.activeElement;
        const tag = active ? active.tagName.toUpperCase() : "";
        if (tag === "INPUT" || tag === "TEXTAREA" || active?.isContentEditable) {
          return;
        }
        // Do not toggle if cover is visible
        const cover = document.getElementById("cover");
        if (cover && !cover.hidden && !cover.classList.contains("open-anim")) {
          return;
        }
        e.preventDefault();
        this.toggle();
      }
    });
  }

  attachButton(btnElement) {
    this.btnEl = btnElement;
    if (!this.btnEl) return;

    this.btnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this._updateButtonUI();
  }

  setKural(kuralNumber, line1 = "", line2 = "", book = "kural") {
    const isDifferent = this.currentKuralNumber !== kuralNumber || this.currentBook !== book;

    if (isDifferent) {
      this.stop();
    }

    this.currentKuralNumber = parseInt(kuralNumber, 10) || 1;
    this.line1Text = line1 || "";
    this.line2Text = line2 || "";
    this.currentBook = (book || "kural").toLowerCase();

    // Preload next kural metadata only for Kural book
    if (this.currentBook === "kural" && this.currentKuralNumber < 1330) {
      this._preloadNext(this.currentKuralNumber + 1);
    } else {
      this._releasePreload();
    }
  }

  onJump(targetKuralNumber) {
    this.stop();
    this._releasePreload();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;

    // Tolkappiyam and other non-Kural books: speech fallback only, never request /audio
    if (this.currentBook !== "kural" && this.currentBook !== "thirukkural") {
      this._playSpeech();
      return;
    }

    const audioUrl = `${AUDIO_BASE}/${this.currentKuralNumber}.mp3`;

    // Synchronous execution for iOS Safari requirement
    try {
      this.isSpeech = false;
      this.isPlaying = true;
      this._updateButtonUI();

      if (!this.audio.src.endsWith(`/${this.currentKuralNumber}.mp3`)) {
        this.audio.src = audioUrl;
      }

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err && err.name === "AbortError") {
            return;
          }
          console.warn("[Audio] Direct MP3 playback rejected, falling back to speech:", err);
          if (this.isPlaying) {
            this._playSpeech();
          }
        });
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.warn("[Audio] Error initiating play:", err);
      if (this.isPlaying) {
        this._playSpeech();
      }
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    if (this.isSpeech && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    if (this.speechTimer) {
      clearInterval(this.speechTimer);
      this.speechTimer = null;
    }
    this._clearHighlight();
    this._updateButtonUI();
  }

  stop() {
    this.isPlaying = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this.speechTimer) {
      clearInterval(this.speechTimer);
      this.speechTimer = null;
    }
    this.isSpeech = false;
    this._clearHighlight();
    this._updateButtonUI();
  }

  _onError() {
    if (!this.isPlaying) return;
    if (!this.audio.src || this.audio.src === window.location.href) return;
    console.warn(`[Audio] Failed to load audio for Kural ${this.currentKuralNumber}, falling back to speech.`);
    this._playSpeech();
  }

  _playSpeech() {
    this.isSpeech = true;
    const textToSpeak = `${this.line1Text} ${this.line2Text}`.trim();

    if (!textToSpeak) {
      if (this.isPlaying) {
        this._showTooltip("Audio not available");
      }
      this.stop();
      return;
    }

    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      if (this.isPlaying) {
        this._showTooltip("Audio not available");
      }
      this.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "ta-IN";
      utterance.rate = 0.88; // Gentle recitation speed

      if (window.speechSynthesis.getVoices) {
        const voices = window.speechSynthesis.getVoices();
        const taVoice = voices.find((v) => v.lang && (v.lang === "ta-IN" || v.lang.startsWith("ta")));
        if (taVoice) {
          utterance.voice = taVoice;
        }
      }

      const l1Len = this.line1Text.trim().length;
      const l2Len = this.line2Text.trim().length;
      const totalLen = l1Len + l2Len || 1;
      const estimatedDurationMs = Math.max(3000, totalLen * 95);
      const splitTimeMs = estimatedDurationMs * (l1Len / totalLen);
      const startTime = Date.now();

      utterance.onstart = () => {
        if (!this.isPlaying && !this.isSpeech) return;
        this.isPlaying = true;
        this._updateButtonUI();
        this._setLineHighlight(1);

        this.speechTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          if (elapsed >= splitTimeMs) {
            this._setLineHighlight(2);
          } else {
            this._setLineHighlight(1);
          }
        }, 100);
      };

      utterance.onend = () => {
        this.stop();
      };

      utterance.onerror = (ev) => {
        if (ev && (ev.error === "canceled" || ev.error === "interrupted")) {
          return;
        }
        const wasActive = this.isPlaying;
        this.stop();
        if (wasActive) {
          this._showTooltip("Audio not available");
        }
      };

      this.speechUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[SpeechSynthesis Error]", err);
      const wasActive = this.isPlaying;
      this.stop();
      if (wasActive) {
        this._showTooltip("Audio not available");
      }
    }
  }

  _onTimeUpdate() {
    if (!this.isPlaying || this.isSpeech) return;

    const duration = this.audio.duration;
    const current = this.audio.currentTime;

    if (!duration || isNaN(duration)) {
      this._setLineHighlight(1);
      return;
    }

    // Split duration proportionally by character length
    const l1Len = this.line1Text.trim().length || 1;
    const l2Len = this.line2Text.trim().length || 1;
    const totalLen = l1Len + l2Len;
    const splitTime = duration * (l1Len / totalLen);

    if (current < splitTime) {
      this._setLineHighlight(1);
    } else {
      this._setLineHighlight(2);
    }
  }

  _onEnded() {
    this.stop();
  }

  _setLineHighlight(activeLineNum) {
    const l1 = document.querySelector("#kural-tamil .kural-line.line-1");
    const l2 = document.querySelector("#kural-tamil .kural-line.line-2");

    if (activeLineNum === 1) {
      l1?.classList.add("kural-audio-active");
      l2?.classList.remove("kural-audio-active");
    } else if (activeLineNum === 2) {
      l2?.classList.add("kural-audio-active");
      l1?.classList.remove("kural-audio-active");
    }
  }

  _clearHighlight() {
    const l1 = document.querySelector("#kural-tamil .kural-line.line-1");
    const l2 = document.querySelector("#kural-tamil .kural-line.line-2");
    l1?.classList.remove("kural-audio-active");
    l2?.classList.remove("kural-audio-active");
  }

  _preloadNext(nextNum) {
    if (this.preloadAudio) {
      this.preloadAudio.src = "";
      this.preloadAudio = null;
    }
    try {
      this.preloadAudio = new Audio();
      this.preloadAudio.preload = "metadata";
      this.preloadAudio.src = `${AUDIO_BASE}/${nextNum}.mp3`;
    } catch (e) {
      // Ignore preload errors
    }
  }

  _releasePreload() {
    if (this.preloadAudio) {
      this.preloadAudio.src = "";
      this.preloadAudio = null;
    }
  }

  _showTooltip(message) {
    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement("div");
      this.tooltipEl.className = "kural-audio-tooltip";
      document.body.appendChild(this.tooltipEl);
    }

    this.tooltipEl.textContent = message;
    this.tooltipEl.classList.add("show");

    if (this.btnEl) {
      const rect = this.btnEl.getBoundingClientRect();
      this.tooltipEl.style.top = `${rect.bottom + 8}px`;
      this.tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
    }

    setTimeout(() => {
      this.tooltipEl?.classList.remove("show");
    }, 2500);
  }

  _updateButtonUI() {
    if (!this.btnEl) return;

    this.btnEl.setAttribute("aria-pressed", this.isPlaying ? "true" : "false");
    this.btnEl.setAttribute(
      "aria-label",
      this.isPlaying ? "குறள் ஒலி இடைநிறுத்து / Pause audio" : "குறள் ஒலி கேட்க / Play audio"
    );

    const playIcon = this.btnEl.querySelector(".audio-icon-play");
    const pauseIcon = this.btnEl.querySelector(".audio-icon-pause");

    if (playIcon && pauseIcon) {
      if (this.isPlaying) {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
        this.btnEl.classList.add("playing");
      } else {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
        this.btnEl.classList.remove("playing");
      }
    }
  }
}

export const kuralAudio = new KuralAudioController();
