/**
 * OlaiLens Motion Engine
 * Realistic Palm-Leaf Manuscript (Ōlai-Chuvadi) Physics & Interaction System
 *
 * Physical Principles:
 * 1. Rigid body pivoting around the cord hole.
 * 2. Subtle elastic flex along length (slices lag on acceleration, overshoot on stop).
 * 3. Damped wobble landing with contact pulse.
 * 4. Loose hang with micro-play on the cord.
 */

export class Spring {
  constructor({ stiffness = 170, damping = 16, mass = 1 } = {}) {
    this.k = stiffness;
    this.c = damping;
    this.m = mass;
    this.x = 0;       // angle in degrees
    this.v = 0;       // angular velocity in deg/s
    this.target = 0;  // target angle
    this.isGrabbed = false;
  }

  to(target) {
    this.target = target;
    this.isGrabbed = false;
  }

  grab() {
    this.isGrabbed = true;
    this.v = 0;
  }

  release(velocity = 0) {
    this.isGrabbed = false;
    this.v = velocity;
  }

  step(dt) {
    if (this.isGrabbed) return;
    // Semi-implicit Euler integration:
    // a = (-k * (x - target) - c * v) / m
    const f = -this.k * (this.x - this.target) - this.c * this.v;
    const a = f / this.m;
    this.v += a * dt;
    this.x += this.v * dt;
  }

  isSettled() {
    return (
      !this.isGrabbed &&
      Math.abs(this.v) < 0.01 &&
      Math.abs(this.x - this.target) < 0.01
    );
  }

  snapTo(target) {
    this.x = target;
    this.target = target;
    this.v = 0;
    this.isGrabbed = false;
  }
}

export class LeafMotionController {
  constructor(options = {}) {
    this.bookEl = options.bookEl || document.getElementById("book");
    this.flipperEl = options.flipperEl || document.getElementById("flipper");
    this.cordEl = options.cordEl || document.getElementById("cord");
    this.leafLeftEl = options.leafLeftEl || document.querySelector(".leaf.left");
    this.leafRightEl = options.leafRightEl || document.querySelector(".leaf.right");
    this.onTextSwap = options.onTextSwap || (() => {});
    this.onTurnSettled = options.onTurnSettled || (() => {});
    this.onKuralCommit = options.onKuralCommit || (() => {});

    // Core spring: governs angle from 0 to 170 degrees (or -170 for prev)
    this.spring = new Spring({ stiffness: 170, damping: 16, mass: 1 });

    // State tracking
    this.direction = "to-next"; // "to-next" | "to-prev"
    this.isAnimating = false;
    this.textSwapped = false;
    this.activeFlippersCount = 0;
    this.poolFlippers = [];
    this.maxPoolSize = 4;

    // Riffle tracking
    this.isRiffling = false;
    this.riffleInterval = null;
    this.riffleTargetKural = null;

    // Drag tracking
    this.isDragging = false;
    this.dragStartAngle = 0;
    this.dragPointerHistory = [];
    this.holePosition = { x: 28, y: 130 }; // cached cord hole center

    // Timing & animation loop
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.substep = 1 / 120;
    this.rafId = null;
    this.fps = 60;
    this.fpsFrames = 0;
    this.fpsLastCheck = performance.now();

    // Idle life state
    this.idleTime = 0;
    this.idleRafId = null;

    // Accessibility check
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.init();
  }

  init() {
    this.buildFlipperSlices(this.flipperEl);
    this.initFlipperPool();
    this.cacheHolePosition();
    this.bindEvents();
    this.startIdleLife();

    // Watch for reduced motion preference changes
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      this.reducedMotion = e.matches;
    });

    // Reset physics cleanly on tab visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stopLoop();
      } else {
        this.lastTime = performance.now();
        this.accumulator = 0;
        if (!this.spring.isSettled()) {
          this.startLoop();
        }
      }
    });

    window.addEventListener("resize", () => {
      this.cacheHolePosition();
    });
  }

  cacheHolePosition() {
    const holeLeft = this.leafLeftEl ? this.leafLeftEl.querySelector(".hole") : null;
    const holeRight = this.leafRightEl ? this.leafRightEl.querySelector(".hole") : null;
    if (this.bookEl) {
      const bookRect = this.bookEl.getBoundingClientRect();
      if (holeLeft) {
        const leftRect = holeLeft.getBoundingClientRect();
        const lx = leftRect.left + leftRect.width / 2 - bookRect.left;
        const ly = leftRect.top + leftRect.height / 2 - bookRect.top;
        this.holePosition = {
          x: lx,
          y: ly,
          viewportX: leftRect.left + leftRect.width / 2,
          viewportY: leftRect.top + leftRect.height / 2,
        };
        this.flipperEl.style.transformOrigin = `${lx}px ${ly}px`;
        if (this.cordEl) {
          this.cordEl.style.setProperty("--cord-left-x", `${lx}px`);
        }
      }
      if (holeRight && this.cordEl) {
        const rightRect = holeRight.getBoundingClientRect();
        const rx = rightRect.left + rightRect.width / 2 - bookRect.left;
        this.cordEl.style.setProperty("--cord-right-x", `${rx}px`);
      }
    }
  }

  buildFlipperSlices(container) {
    container.innerHTML = "";
    // Create 4 slices (slice 0 near hole, slice 3 at outer tip)
    for (let i = 0; i < 4; i++) {
      const slice = document.createElement("div");
      slice.className = "flipper-slice";
      slice.dataset.slice = i;
      slice.style.setProperty("--i", i);

      // Slice inner contents representing the leaf texture & incised text copy
      slice.innerHTML = `
        <div class="slice-inner slice-front">
          <div class="slice-texture"></div>
          <div class="slice-midrib"></div>
          <div class="slice-content-slot"></div>
        </div>
        <div class="slice-inner slice-back">
          <div class="slice-texture"></div>
          <div class="slice-midrib"></div>
        </div>
      `;
      container.appendChild(slice);
    }
  }

  initFlipperPool() {
    this.poolFlippers = [];
    for (let p = 0; p < this.maxPoolSize; p++) {
      const poolEl = document.createElement("div");
      poolEl.className = "flipper riffle-leaf";
      poolEl.hidden = true;
      this.buildFlipperSlices(poolEl);
      this.bookEl.appendChild(poolEl);
      this.poolFlippers.push({ el: poolEl, inUse: false, angle: 0 });
    }
  }

  /**
   * Main Spring Physics Loop (Fixed 1/120s Substeps)
   */
  startLoop() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.flipperEl.style.willChange = "transform, opacity";

    const tick = (now) => {
      // Calculate real delta time (clamped to max 0.1s to prevent spiral on tab unfocus)
      const frameTime = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.accumulator += frameTime;

      // Substep integration
      while (this.accumulator >= this.substep) {
        this.spring.step(this.substep);
        this.accumulator -= this.substep;
      }

      // Render physics state to CSS custom properties
      this.renderPhysics();

      // FPS calculation
      this.fpsFrames++;
      if (now - this.fpsLastCheck >= 500) {
        this.fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastCheck));
        this.fpsFrames = 0;
        this.fpsLastCheck = now;
      }

      this.updateDebugTelemetry();

      // Check for settling
      if (this.spring.isSettled() && !this.spring.isGrabbed) {
        this.stopLoop();
        this.onSettle();
      } else {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.flipperEl.style.willChange = "auto";
  }

  renderPhysics() {
    const angle = this.spring.x;
    const velocity = this.spring.v;

    // 1. Write the primary rotation angle
    this.flipperEl.style.setProperty("--turn", `${angle}deg`);

    // 2. Derive 3D lift (rotateY up to 12deg and translateZ up to 24px at apex ~85deg)
    const normMid = Math.sin((Math.min(Math.max(angle, 0), 170) / 170) * Math.PI);
    const apexLift = normMid * 24; // px
    const liftTilt = (this.direction === "to-next" ? 1 : -1) * normMid * 12; // deg
    this.flipperEl.style.setProperty("--apex-z", `${apexLift}px`);
    this.flipperEl.style.setProperty("--lift-tilt", `${liftTilt}deg`);

    // 3. Tip lag and overshoot flex across the 4 slices
    // Slice extra = clamp(velocity * k * i, -5deg, 5deg)
    // Trailing tip: when velocity > 0, outer slice lags behind
    const kFlex = 0.0042;
    const baseLag = Math.max(-5, Math.min(5, -velocity * kFlex));
    this.flipperEl.style.setProperty("--slice-lag", `${baseLag}deg`);

    // 4. Fake deepening shadow under outgoing leaf via gradient opacity
    const shadowOpacity = Math.max(0, Math.min(1, normMid * 0.75));
    const shadowEl = document.getElementById("left-contact-shadow");
    if (shadowEl) {
      shadowEl.style.opacity = shadowOpacity;
    }

    // 5. Cord tension displacement: quick 2px shift when leaf accelerates
    if (this.cordEl && Math.abs(velocity) > 40) {
      const cordShift = Math.max(-2.5, Math.min(2.5, velocity * 0.004));
      this.cordEl.style.transform = `translateX(${cordShift}px) scaleY(${1 + Math.abs(cordShift) * 0.02})`;
    } else if (this.cordEl) {
      this.cordEl.style.transform = "";
    }

    // 6. Text swap: execute cleanly when leaf passes 90deg hidden position
    if (!this.textSwapped && angle >= 88 && angle <= 110) {
      this.textSwapped = true;
      this.onTextSwap();
    }
  }

  onSettle() {
    this.isAnimating = false;
    const finalAngle = this.spring.target;

    // Trigger damped landing wobble / clack contact pulse
    this.fireContactPulse();

    // Immediately clear replica text in all flipper slices to prevent ghosting or overwriting
    const slots = this.flipperEl.querySelectorAll(".slice-content-slot");
    slots.forEach((s) => (s.innerHTML = ""));

    // Reset flipper visibility
    setTimeout(() => {
      this.flipperEl.classList.remove("active", "to-next", "to-prev");
      this.flipperEl.style.opacity = "0";
      this.spring.snapTo(0);
      this.flipperEl.style.setProperty("--turn", "0deg");
      this.flipperEl.style.setProperty("--slice-lag", "0deg");
      this.textSwapped = false;
      this.onTurnSettled();
    }, 40);
  }

  /**
   * 120ms Contact Pulse: Compresses lower leaf translateY(1px), tightening cast shadow
   */
  fireContactPulse() {
    const targetLeaf = this.direction === "to-next" ? this.leafLeftEl : this.leafRightEl;
    if (!targetLeaf) return;

    targetLeaf.classList.add("contact-pulse");
    setTimeout(() => {
      targetLeaf.classList.remove("contact-pulse");
    }, 140);
  }

  /**
   * Turn Leaf Command (Next or Prev)
   * Fully interruptible and reversible: Preserves existing velocity!
   */
  turn(dir, targetIndex) {
    if (this.reducedMotion) {
      // Instant cross-fade fallback for accessibility
      this.turnReducedMotion(dir, targetIndex);
      return;
    }

    this.direction = dir;
    this.textSwapped = false;
    this.isAnimating = true;

    // Cache hole coordinate before swing
    this.cacheHolePosition();

    // Populate flipper slices with current leaf's visual text copy
    this.snapshotLeafContentToFlipper();

    this.flipperEl.classList.remove("to-next", "to-prev");
    this.flipperEl.classList.add("active", dir);
    this.flipperEl.style.opacity = "1";

    if (dir === "to-next") {
      // Swings from 0 deg to 170 deg
      // If tapped mid-swing, seamlessly redirect target
      this.spring.to(170);
    } else {
      // Prev: incoming leaf swings from 170 deg to 0 deg
      this.spring.snapTo(170);
      this.spring.to(0);
      // Immediately swap text underneath so reveal is correct
      this.onTextSwap();
      this.textSwapped = true;
    }

    this.startLoop();
  }

  turnReducedMotion(dir, targetIndex) {
    if (this.leafLeftEl) {
      this.leafLeftEl.style.transition = "opacity 90ms ease-out";
      this.leafLeftEl.style.opacity = "0";
      setTimeout(() => {
        this.onTextSwap();
        this.leafLeftEl.style.opacity = "1";
        setTimeout(() => {
          this.leafLeftEl.style.transition = "";
          this.onTurnSettled();
        }, 90);
      }, 90);
    } else {
      this.onTextSwap();
      this.onTurnSettled();
    }
  }

  snapshotLeafContentToFlipper() {
    const numEl = document.getElementById("kural-number");
    const numHtml = numEl ? numEl.innerHTML : "";
    const chap = document.getElementById("chapter-name")?.textContent || "";
    const tamilEl = document.getElementById("kural-tamil");
    const tamilHtml = tamilEl ? tamilEl.innerHTML : "";

    const slots = this.flipperEl.querySelectorAll(".slice-content-slot");
    slots.forEach((slot) => {
      slot.innerHTML = `
        <div class="flipper-text-replica">
          <div class="kural-header">
            <span class="num">${numHtml}</span>
            <span class="chapter">${chap}</span>
          </div>
          <div class="rule small kolam-rule">
            <svg viewBox="0 0 190 16" class="kolam-svg">
              <use href="#pulli-kolam" />
            </svg>
          </div>
          <div class="tamil">${tamilHtml}</div>
        </div>
      `;
    });
  }

  /**
   * Pointer Events: Drag Follow with Angular Tracking & Rubber-banding
   */
  bindEvents() {
    const target = this.bookEl;
    if (!target) return;

    let pointerId = null;

    target.addEventListener("pointerdown", (e) => {
      // Don't drag if clicking interactive buttons or inputs
      if (
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest("#index-panel") ||
        this.isRiffling
      ) {
        return;
      }

      this.cacheHolePosition();
      pointerId = e.pointerId;
      target.setPointerCapture(pointerId);

      this.isDragging = true;
      this.dragPointerHistory = [{ x: e.clientX, y: e.clientY, time: performance.now() }];

      // Compute starting angle around hole
      const dx = e.clientX - this.holePosition.viewportX;
      const dy = e.clientY - this.holePosition.viewportY;
      this.dragStartAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

      this.snapshotLeafContentToFlipper();
      this.flipperEl.classList.add("active", "to-next");
      this.flipperEl.style.opacity = "1";

      this.spring.grab();
      this.startLoop();
    });

    target.addEventListener("pointermove", (e) => {
      if (!this.isDragging || e.pointerId !== pointerId) return;

      const now = performance.now();
      this.dragPointerHistory.push({ x: e.clientX, y: e.clientY, time: now });
      // Keep only last 80ms of pointer history for velocity estimation
      this.dragPointerHistory = this.dragPointerHistory.filter((pt) => now - pt.time <= 80);

      const dx = e.clientX - this.holePosition.viewportX;
      const dy = e.clientY - this.holePosition.viewportY;
      const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

      let deltaAngle = currentAngle - this.dragStartAngle;
      // Invert if dragging upward/leftward arc
      if (deltaAngle < -180) deltaAngle += 360;
      if (deltaAngle > 180) deltaAngle -= 360;

      let rawTarget = Math.max(-15, Math.min(190, deltaAngle));

      // 12% rubber-band resistance beyond limits 0..170
      if (rawTarget < 0) {
        rawTarget = rawTarget * 0.12;
      } else if (rawTarget > 170) {
        rawTarget = 170 + (rawTarget - 170) * 0.12;
      }

      this.spring.x = rawTarget;
      this.renderPhysics();
    });

    const handlePointerEnd = (e) => {
      if (!this.isDragging || e.pointerId !== pointerId) return;
      this.isDragging = false;
      try {
        target.releasePointerCapture(pointerId);
      } catch (_) {}
      pointerId = null;

      // Estimate angular release velocity from 80ms history
      let releaseVelocity = 0;
      if (this.dragPointerHistory.length >= 2) {
        const first = this.dragPointerHistory[0];
        const last = this.dragPointerHistory[this.dragPointerHistory.length - 1];
        const dt = (last.time - first.time) / 1000;
        if (dt > 0.01) {
          const dxLast = last.x - this.holePosition.viewportX;
          const dyLast = last.y - this.holePosition.viewportY;
          const dxFirst = first.x - this.holePosition.viewportX;
          const dyFirst = first.y - this.holePosition.viewportY;
          const aLast = (Math.atan2(dyLast, dxLast) * 180) / Math.PI;
          const aFirst = (Math.atan2(dyFirst, dxFirst) * 180) / Math.PI;
          releaseVelocity = (aLast - aFirst) / dt;
        }
      }

      // Commit condition: angle > 70deg or fast forward flick > 140 deg/s
      const currentAngle = this.spring.x;
      if (currentAngle > 70 || releaseVelocity > 140) {
        // Commit turn to next
        this.direction = "to-next";
        this.spring.release(Math.max(releaseVelocity, 60));
        this.spring.to(170);
      } else {
        // Revert back to 0
        this.direction = "to-prev";
        this.spring.release(Math.min(releaseVelocity, -60));
        this.spring.to(0);
      }

      this.startLoop();
    };

    target.addEventListener("pointerup", handlePointerEnd);
    target.addEventListener("pointercancel", handlePointerEnd);
  }

  /**
   * Riffle System: Flipping rapidly through bundle (every ~70ms)
   */
  startRiffle(dir, onTick, onComplete) {
    if (this.isRiffling) return;
    this.isRiffling = true;

    let leafPoolIndex = 0;
    this.riffleInterval = setInterval(() => {
      // Pick a leaf from pool
      const poolItem = this.poolFlippers[leafPoolIndex % this.maxPoolSize];
      leafPoolIndex++;

      if (poolItem) {
        poolItem.el.hidden = false;
        poolItem.el.classList.add("active", "riffle-swing");
        poolItem.el.style.setProperty("--turn", `${28 + Math.random() * 12}deg`);

        setTimeout(() => {
          poolItem.el.style.setProperty("--turn", "0deg");
          setTimeout(() => {
            poolItem.el.hidden = true;
            poolItem.el.classList.remove("active", "riffle-swing");
          }, 110);
        }, 80);
      }

      onTick();
    }, 70);

    this.stopRiffleHandler = () => {
      if (!this.isRiffling) return;
      clearInterval(this.riffleInterval);
      this.isRiffling = false;
      this.poolFlippers.forEach((p) => {
        p.el.hidden = true;
        p.el.classList.remove("active", "riffle-swing");
      });
      if (onComplete) onComplete();
    };

    return this.stopRiffleHandler;
  }

  stopRiffle() {
    if (this.stopRiffleHandler) {
      this.stopRiffleHandler();
      this.stopRiffleHandler = null;
    }
  }

  /**
   * Jump Animation: Quick ~6 leaf riffle with ease-out landing on target
   */
  jumpTo(targetKural, onLanding) {
    if (this.reducedMotion) {
      onLanding();
      return;
    }

    const leavesCount = 6;
    let count = 0;
    const triggerLeaf = (delay) => {
      if (count >= leavesCount) {
        setTimeout(() => {
          this.turn("to-next");
          onLanding();
        }, 120);
        return;
      }

      const poolItem = this.poolFlippers[count % this.maxPoolSize];
      if (poolItem) {
        poolItem.el.hidden = false;
        poolItem.el.classList.add("active", "riffle-swing");
        poolItem.el.style.setProperty("--turn", `${32 - count * 3}deg`);
        setTimeout(() => {
          poolItem.el.style.setProperty("--turn", "0deg");
          setTimeout(() => {
            poolItem.el.hidden = true;
            poolItem.el.classList.remove("active", "riffle-swing");
          }, 100);
        }, 70);
      }

      count++;
      // Increasing delay for ease-out feel
      const nextDelay = 45 + count * 18;
      setTimeout(() => triggerLeaf(nextDelay), nextDelay);
    };

    triggerLeaf(40);
  }

  /**
   * Invalid Input: Horizontal bundle shake (2 cycles, ±3px, 260ms) + cord counter-tug
   */
  shakeInvalid() {
    if (this.bookEl) {
      this.bookEl.classList.remove("shake-invalid");
      // Force layout reflow
      void this.bookEl.offsetWidth;
      this.bookEl.classList.add("shake-invalid");
      setTimeout(() => {
        this.bookEl.classList.remove("shake-invalid");
      }, 280);
    }
  }

  /**
   * Idle Life: Subtle multi-sine drift on commentary leaf (±0.35deg, ~7s period)
   */
  startIdleLife() {
    const idleTick = (time) => {
      this.idleTime = time * 0.001;

      // Summed sines with non-harmonic periods so motion never loops noticeably
      const driftAngle =
        0.24 * Math.sin(this.idleTime * 0.88) +
        0.12 * Math.sin(this.idleTime * 1.52);

      if (this.leafRightEl) {
        this.leafRightEl.style.setProperty("--idle-drift", `${driftAngle.toFixed(3)}deg`);
      }

      this.idleRafId = requestAnimationFrame(idleTick);
    };

    this.idleRafId = requestAnimationFrame(idleTick);
  }

  /**
   * Telemetry Diagnostics for [M] key Debug Overlay
   */
  updateDebugTelemetry() {
    const overlay = document.getElementById("debug-overlay");
    if (!overlay || overlay.hidden) return;

    const angleEl = document.getElementById("dbg-angle");
    const velEl = document.getElementById("dbg-vel");
    const stateEl = document.getElementById("dbg-state");
    const lagEl = document.getElementById("dbg-lag");
    const flippersEl = document.getElementById("dbg-flippers");
    const fpsEl = document.getElementById("dbg-fps");

    if (angleEl) angleEl.textContent = `${this.spring.x.toFixed(2)}°`;
    if (velEl) velEl.textContent = `${this.spring.v.toFixed(1)} deg/s`;
    if (stateEl) stateEl.textContent = this.spring.isGrabbed ? "GRABBED" : this.spring.isSettled() ? "SETTLED" : "SPRINGING";
    if (lagEl) {
      const kFlex = 0.0042;
      const baseLag = Math.max(-5, Math.min(5, -this.spring.v * kFlex));
      lagEl.textContent = `${baseLag.toFixed(2)}°`;
    }
    if (flippersEl) flippersEl.textContent = this.isAnimating ? "1 active" : "0";
    if (fpsEl) fpsEl.textContent = `${this.fps} fps`;
  }
}
