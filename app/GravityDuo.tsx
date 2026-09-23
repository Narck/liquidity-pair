"use client";

import { useEffect, useRef } from "react";

type Orb = {
  element: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
};

type ChannelPoint = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const FALL_GRAVITY = 820;

export default function GravityDuo() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLSpanElement>(null);
  const secondRef = useRef<HTMLSpanElement>(null);
  const sparkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const arena = arenaRef.current;
    const first = firstRef.current;
    const second = secondRef.current;
    const spark = sparkRef.current;
    const about = document.querySelector<HTMLElement>(".about");
    const gravityWord = document.querySelector<HTMLElement>(".gravity-word");
    if (!overlay || !arena || !first || !second || !spark || !about || !gravityWord) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const orbs: [Orb, Orb] = [
      { element: first, x: 0, y: 0, vx: 260, vy: 70, angle: -12 },
      { element: second, x: 0, y: 0, vx: -260, vy: -70, angle: 12 },
    ];
    let state: "idle" | "running" | "done" = "idle";
    let frame = 0;
    let lastTime = 0;
    let fallElapsed = 0;
    let carrierY = 0;
    let launchY = 0;
    let startY = 0;
    let channel: ChannelPoint[] = [];
    let limit = 1;
    let orbRadius = 1;
    let collisionCooldown = 0;
    let sparkAnimation: Animation | null = null;

    const sizeArena = () => {
      const previousLimit = limit;
      orbRadius = first.offsetWidth / 2;
      limit = Math.max(1, arena.offsetWidth / 2 - orbRadius - 7);
      if (previousLimit === 1) {
        orbs[0].x = -limit * 0.5;
        orbs[0].y = -limit * 0.2;
        orbs[1].x = limit * 0.5;
        orbs[1].y = limit * 0.2;
      } else {
        for (const orb of orbs) {
          orb.x *= limit / previousLimit;
          orb.y *= limit / previousLimit;
        }
      }
    };

    const buildChannel = () => {
      const sectionWidth = about.clientWidth;
      const halfArena = arena.offsetWidth / 2;
      const insideSection = (x: number) => clamp(x, halfArena, sectionWidth - halfArena);
      const sectionBounds = about.getBoundingClientRect();
      const gravityBounds = gravityWord.getBoundingClientRect();
      const gravityX = insideSection(gravityBounds.left - sectionBounds.left + gravityBounds.width / 2);
      const gravityY = gravityBounds.top - sectionBounds.top + gravityBounds.height / 2;
      const grid = about.querySelector<HTMLElement>(".about-grid");
      startY = (grid?.offsetTop ?? 0) + halfArena * 0.4;
      channel = [
        { x: insideSection(gravityX - Math.min(sectionWidth * 0.07, 70)), y: startY },
        { x: gravityX, y: Math.max(startY + 80, gravityY) },
        { x: insideSection(gravityX + Math.min(sectionWidth * 0.08, 80)), y: about.clientHeight + halfArena + 20 },
      ];
    };

    const channelX = (y: number) => {
      if (!channel.length) return about.clientWidth / 2;
      if (y <= channel[0].y) return channel[0].x;
      for (let index = 1; index < channel.length; index++) {
        const previous = channel[index - 1];
        const next = channel[index];
        if (y > next.y) continue;
        const progress = (y - previous.y) / (next.y - previous.y);
        const smooth = progress * progress * (3 - 2 * progress);
        return previous.x + (next.x - previous.x) * smooth;
      }
      return channel[channel.length - 1].x;
    };

    const keepInside = (orb: Orb) => {
      const distance = Math.hypot(orb.x, orb.y);
      if (distance <= limit) return;
      const nx = orb.x / distance;
      const ny = orb.y / distance;
      orb.x = nx * limit;
      orb.y = ny * limit;
      const outwardSpeed = orb.vx * nx + orb.vy * ny;
      if (outwardSpeed > 0) {
        orb.vx -= 1.96 * outwardSpeed * nx;
        orb.vy -= 1.96 * outwardSpeed * ny;
      }
    };

    const flashCollision = (x: number, y: number) => {
      spark.style.translate = `${x}px ${y}px`;
      sparkAnimation?.cancel();
      sparkAnimation = spark.animate([
        { opacity: 0.95, transform: "translate(-50%, -50%) scale(0.45) rotate(-20deg)" },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1.7) rotate(20deg)" },
      ], { duration: 330, easing: "ease-out" });
    };

    const moveOrbs = (dt: number) => {
      const [a, b] = orbs;
      for (const orb of orbs) {
        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.angle += orb.vx * dt * 0.1;
        keepInside(orb);
      }

      const contactX = b.x - a.x;
      const contactY = b.y - a.y;
      const contactDistance = Math.hypot(contactX, contactY);
      const diameter = orbRadius * 2;
      if (contactDistance < diameter) {
        const nx = contactDistance > 0.001 ? contactX / contactDistance : 1;
        const ny = contactDistance > 0.001 ? contactY / contactDistance : 0;
        const overlap = (diameter - contactDistance) / 2 + 0.1;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (approach < 0) {
          const impulse = -(1 + 0.98) * approach / 2;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
          if (collisionCooldown <= 0) {
            flashCollision((a.x + b.x) / 2, (a.y + b.y) / 2);
            collisionCooldown = 0.24;
          }
        }
        keepInside(a);
        keepInside(b);
      }
      collisionCooldown = Math.max(0, collisionCooldown - dt);

      for (const orb of orbs) {
        orb.element.style.transform = `translate3d(${orb.x - orbRadius}px, ${orb.y - orbRadius}px, 0) rotate(${orb.angle}deg)`;
      }
    };

    const finish = () => {
      state = "done";
      overlay.dataset.state = "done";
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const tick = (time: number) => {
      frame = 0;
      if (state !== "running") return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      moveOrbs(dt);

      const halfArena = arena.offsetWidth / 2;
      fallElapsed += dt;
      carrierY = launchY + 0.5 * FALL_GRAVITY * fallElapsed * fallElapsed;
      if (carrierY - halfArena > about.clientHeight + 30) {
        finish();
        return;
      }

      arena.style.transform = `translate3d(${channelX(carrierY) - halfArena}px, ${carrierY - halfArena}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (state !== "idle" || reducedMotion.matches) return;
      sizeArena();
      buildChannel();
      launchY = startY;
      carrierY = startY;
      fallElapsed = 0;
      orbs[0].vx = 245 + Math.random() * 50;
      orbs[0].vy = 60 + Math.random() * 35;
      orbs[1].vx = -(245 + Math.random() * 50);
      orbs[1].vy = -(60 + Math.random() * 35);
      moveOrbs(0);
      arena.style.transform = `translate3d(${channelX(carrierY) - arena.offsetWidth / 2}px, ${carrierY - arena.offsetWidth / 2}px, 0)`;
      state = "running";
      overlay.dataset.state = "running";
      frame = requestAnimationFrame(tick);
      observer.disconnect();
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
    }, { rootMargin: "0px 0px -15% 0px" });
    const onResize = () => {
      sizeArena();
      if (state === "running") buildChannel();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      } else if (state === "running" && !frame) {
        frame = requestAnimationFrame(tick);
      }
    };
    const onMotionPreference = () => {
      if (reducedMotion.matches && state !== "done") finish();
    };
    observer.observe(about);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    reducedMotion.addEventListener("change", onMotionPreference);

    return () => {
      cancelAnimationFrame(frame);
      sparkAnimation?.cancel();
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotionPreference);
    };
  }, []);

  return (
    <div className="gravity-duo" data-state="idle" ref={overlayRef} aria-hidden="true">
      <div className="gravity-duo-arena" ref={arenaRef}>
        <span className="gravity-duo-orb gravity-duo-orb-a" ref={firstRef} />
        <span className="gravity-duo-orb gravity-duo-orb-b" ref={secondRef} />
        <span className="gravity-duo-spark" ref={sparkRef}>✦</span>
      </div>
    </div>
  );
}
