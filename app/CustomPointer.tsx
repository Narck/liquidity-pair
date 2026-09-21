"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[data-cursor='interactive']",
].join(",");

export default function CustomPointer() {
  const pointerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pointer = pointerRef.current;
    const finePointer = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!pointer || !finePointer.matches) return;

    let frame = 0;
    let x = -100;
    let y = -100;

    const paint = () => {
      frame = 0;
      pointer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      pointer.classList.add("is-visible");
      pointer.classList.toggle(
        "is-interactive",
        event.target instanceof Element && Boolean(event.target.closest(INTERACTIVE_SELECTOR)),
      );
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const handlePointerDown = () => pointer.classList.add("is-pressed");
    const handlePointerUp = () => pointer.classList.remove("is-pressed");
    const hidePointer = () => {
      pointer.classList.remove("is-visible", "is-interactive", "is-pressed");
    };

    document.documentElement.classList.add("has-custom-pointer");
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", hidePointer);
    window.addEventListener("blur", hidePointer);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.documentElement.classList.remove("has-custom-pointer");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener("mouseleave", hidePointer);
      window.removeEventListener("blur", hidePointer);
    };
  }, []);

  return (
    <div ref={pointerRef} className="custom-pointer" aria-hidden="true">
      <svg className="custom-pointer-arrow" viewBox="0 0 32 40">
        <path
          className="custom-pointer-arrow-shadow"
          d="M2 2v26l7.3-6.4 6 12.4 5.9-2.9-6-12.1h10z"
          transform="translate(3 3)"
        />
        <path
          className="custom-pointer-arrow-face"
          d="M2 2v26l7.3-6.4 6 12.4 5.9-2.9-6-12.1h10z"
        />
      </svg>
      <span className="custom-pointer-label">GO!</span>
    </div>
  );
}
