"use client";

import { useEffect, useRef } from "react";

type Eye = {
  shell: HTMLSpanElement;
  pupil: HTMLSpanElement;
  limit: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  impacts: number;
};

export default function NavEyes() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const rightRef = useRef<HTMLSpanElement>(null);
  const leftPupilRef = useRef<HTMLSpanElement>(null);
  const rightPupilRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const leftPupil = leftPupilRef.current;
    const rightPupil = rightPupilRef.current;
    if (!button || !left || !right || !leftPupil || !rightPupil) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const eyes: Eye[] = [
      { shell: left, pupil: leftPupil, limit: 0, x: 0, y: 0, vx: 0, vy: 0, impacts: 0 },
      { shell: right, pupil: rightPupil, limit: 0, x: 0, y: 0, vx: 0, vy: 0, impacts: 0 },
    ];
    let frame = 0;
    let mode: "follow" | "fall" | "rest" = "follow";
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    let lastTime = 0;
    let fallStart = 0;

    const measure = () => {
      for (const eye of eyes) {
        eye.limit = Math.max(1, (eye.shell.clientWidth - eye.pupil.clientWidth) / 2 - 4);
      }
    };

    const paint = () => {
      for (const eye of eyes) {
        eye.pupil.style.transform = `translate3d(${eye.x.toFixed(2)}px, ${eye.y.toFixed(2)}px, 0)`;
      }
    };

    const tick = (time: number) => {
      frame = 0;
      const dt = Math.min((time - (lastTime || time)) / 16.67, 2);
      lastTime = time;

      if (mode === "fall") {
        for (const eye of eyes) {
          eye.vy += 0.48 * dt;
          eye.x += eye.vx * dt;
          eye.y += eye.vy * dt;

          const distance = Math.hypot(eye.x, eye.y);
          if (distance > eye.limit) {
            const nx = eye.x / distance;
            const ny = eye.y / distance;
            eye.x = nx * eye.limit;
            eye.y = ny * eye.limit;
            const outwardSpeed = eye.vx * nx + eye.vy * ny;
            if (outwardSpeed > 0) {
              const bounce = eye.impacts === 0 ? 0.63 : 0.48;
              eye.vx -= (1 + bounce) * outwardSpeed * nx;
              eye.vy -= (1 + bounce) * outwardSpeed * ny;
              if (eye.impacts === 0) eye.vx += (Math.random() - 0.5) * 2.8;
              eye.impacts++;
            }
          }
          eye.vx *= Math.pow(0.99, dt);
        }
        paint();
        if (time - fallStart > 2600) {
          mode = "rest";
          for (const eye of eyes) {
            eye.x = Math.max(-eye.limit * 0.42, Math.min(eye.limit * 0.42, eye.x));
            eye.y = Math.sqrt(eye.limit * eye.limit - eye.x * eye.x);
          }
          paint();
          return;
        }
        frame = requestAnimationFrame(tick);
        return;
      }

      if (mode === "follow" && pointerX !== null && pointerY !== null && !reducedMotion.matches) {
        let moving = false;
        for (const eye of eyes) {
          const rect = eye.shell.getBoundingClientRect();
          const dx = pointerX - (rect.left + rect.width / 2);
          const dy = pointerY - (rect.top + rect.height / 2);
          const distance = Math.hypot(dx, dy) || 1;
          const targetX = (dx / distance) * eye.limit * 0.72;
          const targetY = (dy / distance) * eye.limit * 0.72;
          eye.x += (targetX - eye.x) * 0.2;
          eye.y += (targetY - eye.y) * 0.2;
          if (Math.abs(targetX - eye.x) + Math.abs(targetY - eye.y) > 0.1) moving = true;
        }
        paint();
        if (moving) frame = requestAnimationFrame(tick);
      }
    };

    const requestTick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (mode === "rest" && !button.contains(event.target as Node)) mode = "follow";
      if (mode === "follow") requestTick();
    };

    const drop = () => {
      if (reducedMotion.matches) return;
      measure();
      mode = "fall";
      lastTime = 0;
      fallStart = performance.now();
      for (const eye of eyes) {
        eye.x = (Math.random() - 0.5) * eye.limit * 0.35;
        eye.y = -eye.limit;
        eye.vx = (Math.random() - 0.5) * 2.3;
        eye.vy = 0;
        eye.impacts = 0;
      }
      paint();
      requestTick();
    };

    const handleEnter = (event: PointerEvent) => {
      if (event.pointerType !== "touch") drop();
    };
    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") drop();
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", handleMove, { passive: true });
    button.addEventListener("pointerenter", handleEnter);
    button.addEventListener("pointerdown", handleDown);
    button.addEventListener("click", drop);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", handleMove);
      button.removeEventListener("pointerenter", handleEnter);
      button.removeEventListener("pointerdown", handleDown);
      button.removeEventListener("click", drop);
    };
  }, []);

  return (
    <button ref={buttonRef} className="nav-eyes" type="button" aria-label="Play with the googly eyes">
      <span ref={leftRef} className="nav-eye nav-eye-left" aria-hidden="true">
        <span ref={leftPupilRef} className="nav-eye-pupil" />
      </span>
      <span ref={rightRef} className="nav-eye nav-eye-right" aria-hidden="true">
        <span ref={rightPupilRef} className="nav-eye-pupil" />
      </span>
    </button>
  );
}
