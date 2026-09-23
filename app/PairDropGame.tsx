"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "ready" | "falling" | "missed" | "paired" | "gameover";

export default function PairDropGame() {
  const stageRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [drops, setDrops] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const token = tokenRef.current;
    const goal = goalRef.current;
    const button = buttonRef.current;
    if (!stage || !token || !goal || !button) return;

    let currentPhase: Phase = "ready";
    let aim = 0.5;
    let attempts = 0;
    let pairedLpOnLeft: boolean | null = null;
    let frame = 0;
    let motionFrame = 0;
    let aimFrame = 0;
    let previousAimTime = 0;
    let movingLeft = false;
    let movingRight = false;
    let pairAnimation: Animation | null = null;
    let motionTime = 0;
    let previousMotionTime = 0;
    let goalOffset = 0;
    let goalFrom = 0;
    let goalTo = 0;
    let goalElapsed = 0;
    let goalDuration = 0;
    let goalDirection = Math.random() < 0.5 ? -1 : 1;
    let stageVisible = false;
    let resetTimer = 0;
    let pointerStart: { x: number; y: number } | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pegs = Array.from(stage.querySelectorAll<HTMLElement>(".pair-drop-peg"));

    const moveTargets = (time: number) => {
      motionFrame = 0;
      if (!stageVisible || reducedMotion.matches || currentPhase === "paired" || currentPhase === "gameover") return;
      const dt = previousMotionTime ? Math.min((time - previousMotionTime) / 1000, 0.04) : 0;
      previousMotionTime = time;
      motionTime += dt;

      const goalRange = Math.max(0, Math.min(stage.clientWidth * 0.19, stage.clientWidth / 2 - goal.offsetWidth / 2 - 16));
      if (goalRange > 0) {
        if (goalDuration === 0 || Math.abs(goalTo) > goalRange) {
          goalOffset = Math.max(-goalRange, Math.min(goalRange, goalOffset));
          goalFrom = goalOffset;
          goalTo = goalDirection * goalRange * (0.35 + Math.random() * 0.65);
          goalElapsed = 0;
          const speed = goalRange * (0.7 + Math.random() * 0.55);
          goalDuration = Math.max(0.55, Math.abs(goalTo - goalFrom) / speed);
          goalDirection *= -1;
        }
        goalElapsed = Math.min(goalDuration, goalElapsed + dt);
        const progress = goalElapsed / goalDuration;
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;
        goalOffset = goalFrom + (goalTo - goalFrom) * eased;
        goal.style.translate = `${goalOffset}px 0`;
        if (progress === 1) goalDuration = 0;
      }
      pegs.forEach((peg, index) => {
        if (!peg.offsetWidth) return;
        const mainPeg = index < 4;
        const rangeX = Math.min(mainPeg ? 34 : 30, stage.clientWidth * (mainPeg ? 0.075 : 0.055));
        const rangeY = Math.min(mainPeg ? 24 : 22, stage.clientHeight * 0.055);
        const speedX = 1.15 + (index % 5) * 0.23;
        const speedY = 1.42 + (index % 4) * 0.27;
        peg.style.translate = `${Math.sin(motionTime * speedX + index * 1.3) * rangeX}px ${Math.cos(motionTime * speedY + index * 0.8) * rangeY}px`;
      });
      motionFrame = requestAnimationFrame(moveTargets);
    };

    const startMotion = () => {
      if (stageVisible && !document.hidden && !reducedMotion.matches && !motionFrame) {
        previousMotionTime = 0;
        motionFrame = requestAnimationFrame(moveTargets);
      }
    };

    const stopAimMotion = () => {
      movingLeft = false;
      movingRight = false;
      cancelAnimationFrame(aimFrame);
      aimFrame = 0;
      previousAimTime = 0;
    };

    const moveAim = (time: number) => {
      aimFrame = 0;
      if (currentPhase !== "ready" || (!movingLeft && !movingRight)) return;
      const dt = previousAimTime ? Math.min((time - previousAimTime) / 1000, 0.05) : 1 / 60;
      previousAimTime = time;
      const direction = Number(movingRight) - Number(movingLeft);
      const speed = Math.min(520, stage.clientWidth * 0.65);
      aim = Math.max(0.08, Math.min(0.92, aim + direction * speed * dt / stage.clientWidth));
      paintReady();
      aimFrame = requestAnimationFrame(moveAim);
    };

    const setCurrentPhase = (next: Phase) => {
      if (next !== "ready") stopAimMotion();
      currentPhase = next;
      setPhase(next);
      stage.dataset.phase = next;
    };

    const paint = (x: number, y: number, rotation = 0) => {
      const radius = token.offsetWidth / 2;
      token.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0) rotate(${rotation}deg)`;
    };

    const paintPaired = () => {
      if (pairedLpOnLeft === null) return;
      const radius = token.offsetWidth / 2;
      const goalRadius = goal.offsetWidth / 2;
      const separation = radius + goalRadius + 1;
      const lpX = stage.clientWidth / 2 + (pairedLpOnLeft ? -separation / 2 : separation / 2);
      const metX = stage.clientWidth / 2 + (pairedLpOnLeft ? separation / 2 : -separation / 2);
      goal.style.translate = `${metX - stage.clientWidth / 2}px 0`;
      paint(lpX, stage.clientHeight - 26 - goalRadius, pairedLpOnLeft ? -8 : 8);
    };

    const paintReady = () => {
      if (currentPhase !== "ready") return;
      const radius = token.offsetWidth / 2;
      const x = Math.max(radius + 8, Math.min(stage.clientWidth - radius - 8, aim * stage.clientWidth));
      paint(x, radius + 30);
    };

    const setAim = (clientX: number) => {
      if (currentPhase !== "ready") return;
      const bounds = stage.getBoundingClientRect();
      aim = Math.max(0.08, Math.min(0.92, (clientX - bounds.left) / bounds.width));
      paintReady();
    };

    const reset = (clearScore = false) => {
      if (currentPhase === "paired" || currentPhase === "gameover") {
        goalOffset = Number.parseFloat(getComputedStyle(goal).translate) || 0;
        goalDuration = 0;
        goalDirection = Math.random() < 0.5 ? -1 : 1;
      }
      cancelAnimationFrame(frame);
      window.clearTimeout(resetTimer);
      pairAnimation?.cancel();
      pairAnimation = null;
      pairedLpOnLeft = null;
      if (clearScore) {
        attempts = 0;
        setDrops(0);
      }
      setCurrentPhase("ready");
      paintReady();
      startMotion();
    };

    const miss = (x: number, y: number, vx: number, vy: number, rotation: number) => {
      const radius = token.offsetWidth / 2;
      if (reducedMotion.matches) {
        paint(x, stage.clientHeight + radius * 2 + 20, rotation);
      } else {
        let exitX = x;
        let exitY = y;
        let exitVy = vy;
        let exitRotation = rotation;
        let previousExitTime = 0;
        const exitTick = (time: number) => {
          const dt = previousExitTime ? Math.min((time - previousExitTime) / 1000, 0.032) : 0;
          previousExitTime = time;
          exitVy += 1250 * dt;
          exitX += vx * dt;
          exitY += exitVy * dt;
          exitRotation += vx * dt * 0.38;
          paint(exitX, exitY, exitRotation);
          if (exitY - radius < stage.clientHeight + 20) frame = requestAnimationFrame(exitTick);
        };
        frame = requestAnimationFrame(exitTick);
      }
      if (attempts >= 3) {
        setCurrentPhase("gameover");
      } else {
        setCurrentPhase("missed");
        resetTimer = window.setTimeout(() => reset(), 850);
      }
    };

    const launch = () => {
      if (currentPhase === "paired" || currentPhase === "gameover") {
        reset(true);
        return;
      }
      if (currentPhase !== "ready") return;

      attempts += 1;
      setDrops(attempts);
      setCurrentPhase("falling");

      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const radius = token.offsetWidth / 2;
      const stageBounds = stage.getBoundingClientRect();
      const centerOf = (element: HTMLElement) => {
        const bounds = element.getBoundingClientRect();
        return {
          x: bounds.left - stageBounds.left + bounds.width / 2,
          y: bounds.top - stageBounds.top + bounds.height / 2,
          radius: element.offsetWidth / 2,
        };
      };

      const pair = (fromX: number, target: ReturnType<typeof centerOf>) => {
        pairedLpOnLeft = fromX <= target.x;
        const fromTransform = token.style.transform;

        setCurrentPhase("paired");
        goal.getBoundingClientRect();
        paintPaired();
        const toTransform = token.style.transform;
        if (!reducedMotion.matches) {
          const animation = token.animate([
            { transform: fromTransform, offset: 0 },
            { transform: toTransform, offset: 1 },
          ], { duration: 540, easing: "cubic-bezier(.2, 1, .3, 1)", fill: "both" });
          pairAnimation = animation;
          animation.onfinish = () => {
            if (pairAnimation === animation) {
              animation.cancel();
              pairAnimation = null;
            }
          };
        }
      };

      if (reducedMotion.matches) {
        const target = centerOf(goal);
        const paired = Math.abs(aim * width - target.x) < target.radius + radius * 0.6;
        if (paired) {
          pair(aim * width, target);
        } else {
          miss(aim * width, radius + 30, 0, 0, 0);
        }
        return;
      }

      let x = Math.max(radius + 8, Math.min(width - radius - 8, aim * width));
      let y = radius + 30;
      let vx = 0;
      let vy = 0;
      let rotation = 0;
      let previousTime = 0;

      const tick = (time: number) => {
        const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.032) : 0;
        previousTime = time;
        vy += 1250 * dt;
        x += vx * dt;
        y += vy * dt;
        rotation += vx * dt * 0.38;

        if (x < radius + 8 || x > width - radius - 8) {
          x = Math.max(radius + 8, Math.min(width - radius - 8, x));
          vx *= -0.62;
        }

        for (const peg of pegs) {
          if (!peg.offsetWidth) continue;
          const bumper = centerOf(peg);
          const dx = x - bumper.x;
          const dy = y - bumper.y;
          const distance = Math.hypot(dx, dy);
          const minimum = radius + bumper.radius;
          if (distance >= minimum || distance < 0.001) continue;

          const nx = dx / distance;
          const ny = dy / distance;
          x = bumper.x + nx * minimum;
          y = bumper.y + ny * minimum;
          const incoming = vx * nx + vy * ny;
          if (incoming < 0) {
            vx -= 1.48 * incoming * nx;
            vy -= 1.48 * incoming * ny;
          }
        }

        const target = centerOf(goal);

        paint(x, y, rotation);

        const dx = x - target.x;
        const dy = y - target.y;
        const distance = Math.hypot(dx, dy);
        const contactDistance = radius + target.radius + 1;
        if (distance <= contactDistance && y < target.y + target.radius * 0.35) {
          const normalX = distance > 0.001 ? dx / distance : 0;
          const normalY = distance > 0.001 ? dy / distance : -1;
          x = target.x + normalX * contactDistance;
          y = target.y + normalY * contactDistance;
          paint(x, y, rotation);
          pair(x, target);
          return;
        }

        if (y >= height - radius - 10 && vy > 0) {
          miss(x, y, vx, vy, rotation);
          return;
        }

        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch") setAim(event.clientX);
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart) return;
      const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      pointerStart = null;
      if (moved > 12) return;
      setAim(event.clientX);
      launch();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        if (event.key === "ArrowLeft") movingLeft = true;
        else movingRight = true;
        if (!aimFrame && currentPhase === "ready") {
          previousAimTime = 0;
          aimFrame = requestAnimationFrame(moveAim);
        }
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        launch();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") movingLeft = false;
      else if (event.key === "ArrowRight") movingRight = false;
      if (!movingLeft && !movingRight) stopAimMotion();
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(motionFrame);
        motionFrame = 0;
        stopAimMotion();
        if (currentPhase === "falling") reset();
      } else {
        startMotion();
      }
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      stageVisible = entry.isIntersecting;
      if (stageVisible) startMotion();
      else {
        cancelAnimationFrame(motionFrame);
        motionFrame = 0;
      }
    }, { rootMargin: "160px" });
    const resizeObserver = new ResizeObserver(() => {
      if (currentPhase === "paired") {
        pairAnimation?.cancel();
        pairAnimation = null;
        goal.style.transition = "none";
        paintPaired();
        goal.getBoundingClientRect();
        goal.style.removeProperty("transition");
      } else {
        paintReady();
      }
    });
    resizeObserver.observe(stage);
    intersectionObserver.observe(stage);
    paintReady();
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("keydown", onKeyDown);
    stage.addEventListener("blur", stopAimMotion);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", stopAimMotion);
    button.addEventListener("click", launch);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(motionFrame);
      cancelAnimationFrame(aimFrame);
      pairAnimation?.cancel();
      window.clearTimeout(resetTimer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("blur", stopAimMotion);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", stopAimMotion);
      button.removeEventListener("click", launch);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const message = phase === "paired"
    ? "NATURE MADE THE PAIR. YOU JUST FOUND IT."
    : phase === "gameover"
      ? "THREE DROPS. NO PAIR. RUN IT BACK."
    : phase === "missed"
      ? "MISSED THE MOVING POOL. TRY AGAIN."
    : phase === "falling"
      ? "GRAVITY IS DOING ITS THING..."
        : "TIME YOUR DROP. THREE SHOTS TO PAIR.";

  return (
    <section id="pair-drop" className="pair-drop" aria-labelledby="pair-drop-title">
      <div className="pair-drop-header">
        <div>
          <p className="pair-drop-eyebrow">A VERY UNSERIOUS EXPERIMENT / 01</p>
          <h2 id="pair-drop-title">THE PAIR <em>DROP.</em></h2>
          <p className="pair-drop-intro">Two assets. One pool. A little help from gravity.</p>
        </div>
        <div className="pair-drop-score" aria-label={`${drops} of 3 drops used`}>DROPS <strong>{String(drops).padStart(2, "0")}<small>/ 03</small></strong></div>
      </div>

      <div className="pair-drop-game">
        <div className="pair-drop-stage" ref={stageRef} role="button" tabIndex={0} aria-label="Aim and drop LP into the MET pool" data-phase={phase}>
          <span className="pair-drop-stage-label">THE GRAVITY ZONE</span>
          <span className="pair-drop-target-label">MOVING TARGET ↔</span>
          <div className="pair-drop-peg pair-drop-peg-one" aria-hidden="true">✦</div>
          <div className="pair-drop-peg pair-drop-peg-two" aria-hidden="true">✦</div>
          <div className="pair-drop-peg pair-drop-peg-three" aria-hidden="true">✦</div>
          <div className="pair-drop-peg pair-drop-peg-four" aria-hidden="true">✦</div>
          {Array.from({ length: 10 }, (_, index) => <div className={`pair-drop-peg pair-drop-peg-extra pair-drop-peg-extra-${index + 1}`} aria-hidden="true" key={index}>✦</div>)}
          <div className="pair-drop-goal" ref={goalRef} aria-hidden="true"><span>$MET</span><div className="pair-drop-burst">✦ <span>✦</span> ✦</div></div>
          <div className="pair-drop-token" ref={tokenRef} aria-hidden="true"><span>LP</span></div>
          <div className="pair-drop-floor" aria-hidden="true" />
        </div>
        <div className="pair-drop-controls">
          <p className="pair-drop-message" role="status" aria-live="polite">{message}</p>
          <div className="pair-drop-actions">
            <span className="pair-drop-hint-desktop">MOVE TO AIM · CLICK TO DROP<br />WATCH THE POOL · ← → + SPACE</span>
            <span className="pair-drop-hint-mobile">TAP TO AIM AND DROP<br />WATCH THE MOVING POOL</span>
            <button type="button" ref={buttonRef} disabled={phase === "falling" || phase === "missed"}>
              {phase === "paired" || phase === "gameover" ? "PLAY AGAIN ↺" : "DROP LP ↓"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
