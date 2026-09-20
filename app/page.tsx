"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CONTRACT = "8CECyxU5dTBwvzYXDcvzkgQ3qV8nsxXDrST396isn4Tu";
const DEX_URL = "https://dexscreener.com/solana/xZJTKthDmRx2H7fHp5FTeuv9V8vVrpYZkToa5sCmAXV";
const X_URL = "https://x.com/LiqPairMET";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const asset = (path: string) => `${BASE_PATH}${path}`;

const gallery = [
  { image: asset("/gallery/lp-01.webp"), label: "BEACH LIQUIDITY" },
  { image: asset("/gallery/lp-02.webp"), label: "AFTER-HOURS LP" },
  { image: asset("/gallery/lp-03.webp"), label: "SUNSET POSITION" },
  { image: asset("/gallery/lp-04.webp"), label: "MOON-LIT MARKET" },
  { image: asset("/gallery/lp-05.webp"), label: "POOLSIDE ALPHA" },
  { image: asset("/gallery/lp-06.webp"), label: "DEEP LIQUIDITY" },
  { image: asset("/gallery/lp-07.webp"), label: "TROPICAL PAIR" },
  { image: asset("/gallery/lp-08.webp"), label: "COFFEE & CURVES" },
];

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const fullLogo = useRef<HTMLDivElement>(null);
  const navMark = useRef<HTMLDivElement>(null);
  const navMarkCanvas = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const labSection = useRef<HTMLElement>(null);
  const gallerySection = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];

    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const destination = navMarkCanvas.current?.getBoundingClientRect();
      const source = fullLogo.current?.getBoundingClientRect();

      gsap.set(navMark.current, { autoAlpha: 0 });
      gsap.set(".hero-reveal", { autoAlpha: 0, y: 28 });
      gsap.set(".intro-letter", { autoAlpha: 0 });

      const introTimeline = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          if (intro.current) intro.current.style.display = "none";
        },
      });

      if (reduceMotion || !destination || !source) {
        introTimeline
          .to(fullLogo.current, { autoAlpha: 1, duration: 0.18 })
          .addLabel("reducedHandoff", "+=0.2")
          .to([".intro-cover", ".intro-wash", ".intro-bubble", fullLogo.current], { autoAlpha: 0, duration: 0.18 }, "reducedHandoff")
          .to(intro.current, { backgroundColor: "rgba(125, 53, 255, 0)", duration: 0.18 }, "reducedHandoff")
          .to(".hero-reveal", { autoAlpha: 1, y: 0, duration: 0.1 }, "reducedHandoff")
          .set(navMark.current, { autoAlpha: 1 }, "reducedHandoff+=0.18")
          .set(intro.current, { display: "none" }, "<");
      } else {
        const sourceCenterX = source.left + source.width / 2;
        const sourceCenterY = source.top + source.height / 2;
        const endScale = destination.width / source.width;
        const deltaX = destination.left + destination.width / 2 - sourceCenterX;
        const deltaY = destination.top + destination.height / 2 - sourceCenterY;

        introTimeline
          .fromTo(fullLogo.current,
            { autoAlpha: 0, scale: 0.58, rotate: -3, filter: "blur(18px) saturate(1.8)" },
            { autoAlpha: 1, scale: 1, rotate: 0, filter: "blur(0px) saturate(1)", duration: 0.95, ease: "back.out(1.7)" },
          )
          .fromTo(".intro-bubble", { autoAlpha: 0, scale: 0, rotate: -24 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.62, stagger: 0.08, ease: "back.out(2)" }, "-=0.35")
          .to(".intro-wordmark-full", { autoAlpha: 0, filter: "blur(10px)", duration: 0.46, delay: 0.35, ease: "power2.inOut" })
          .to(".intro-letter", { autoAlpha: 1, duration: 0.46, ease: "none" }, "<")
          .addLabel("lettersMerge", "+=0.08")
          .to(".intro-letter-l", { xPercent: 31, yPercent: -5, duration: 0.72, ease: "expo.inOut" }, "lettersMerge")
          .to(".intro-letter-l-arm", { scaleY: 1.24, duration: 0.72, ease: "expo.inOut" }, "lettersMerge")
          .to(".intro-letter-p", { xPercent: -12, yPercent: 20, duration: 0.72, ease: "expo.inOut" }, "lettersMerge")
          .to(fullLogo.current, { x: deltaX, y: deltaY, scale: endScale, duration: 0.88, ease: "expo.inOut" }, "+=0.42")
          .addLabel("landed")
          .addLabel("handoff", "landed-=0.34")
          .to([".intro-cover", ".intro-wash", ".intro-bubble"], { autoAlpha: 0, duration: 0.42 }, "handoff")
          .to(intro.current, { backgroundColor: "rgba(125, 53, 255, 0)", duration: 0.42 }, "handoff")
          .to(".hero-reveal", { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.08, ease: "back.out(1.5)" }, "handoff+=0.06")
          .set(navMark.current, { autoAlpha: 1 }, "landed")
          .set(fullLogo.current, { autoAlpha: 0 }, "landed")
          .set(intro.current, { display: "none" }, "handoff+=0.42");
      }

      if (!reduceMotion) {
        gsap.to(".hero-art", {
          scale: 1.045,
          yPercent: 1.5,
          ease: "none",
          scrollTrigger: { trigger: hero.current, start: "top top", end: "bottom top", scrub: 0.8 },
        });

        gsap.to(".spin-sticker", { rotate: 360, duration: 18, repeat: -1, ease: "none" });

        if (hero.current) {
          const floatScale = window.innerWidth <= 600 ? 0.68 : 1;
          const randomSignedOffset = (maximum: number, minimumRatio = 0.55) => {
            const magnitude = gsap.utils.random(maximum * minimumRatio, maximum, 0.1);
            return Math.random() < 0.5 ? -magnitude : magnitude;
          };
          const heroFloaters = [
            { element: hero.current.querySelector<HTMLElement>(".hero-space-far"), x: 4, y: 3, rotation: 0, minDuration: 10, maxDuration: 14 },
            { element: hero.current.querySelector<HTMLElement>(".hero-space-near"), x: 7, y: 5, rotation: 0, minDuration: 9, maxDuration: 13 },
            { element: hero.current.querySelector<HTMLElement>(".hero-sticker"), x: 14, y: 16, rotation: 1.2, minDuration: 6.4, maxDuration: 8.4 },
            { element: hero.current.querySelector<HTMLElement>(".hero-ticket"), x: 16, y: 13, rotation: 1.1, minDuration: 6.8, maxDuration: 9 },
            { element: hero.current.querySelector<HTMLElement>(".hero-cta"), x: 12, y: 15, rotation: 1.5, minDuration: 6.2, maxDuration: 8.2 },
            { element: hero.current.querySelector<HTMLElement>(".contract-pill"), x: 10, y: 8, rotation: 0.8, minDuration: 7, maxDuration: 9.5 },
          ];

          heroFloaters.forEach(({ element, x, y, rotation, minDuration, maxDuration }, index) => {
            if (!element) return;
            gsap.to(element, {
              "--float-x": () => `${randomSignedOffset(x * floatScale)}px`,
              "--float-y": () => `${randomSignedOffset(y * floatScale)}px`,
              "--float-rotation": () => `${randomSignedOffset(rotation * floatScale, 0.45)}deg`,
              duration: gsap.utils.random(minDuration, maxDuration, 0.1),
              delay: index * 0.24,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              repeatRefresh: true,
            });
          });
        }

        if (finePointer && hero.current) {
          const heroLayers = [
            { element: hero.current.querySelector<HTMLElement>(".hero-space-far"), x: -5, y: -4 },
            { element: hero.current.querySelector<HTMLElement>(".hero-space-near"), x: 13, y: 9 },
            { element: hero.current.querySelector<HTMLElement>(".hero-sticker"), x: -7, y: -5 },
            { element: hero.current.querySelector<HTMLElement>(".hero-ticket"), x: 6, y: 4 },
            { element: hero.current.querySelector<HTMLElement>(".hero-cta"), x: 8, y: 6 },
            { element: hero.current.querySelector<HTMLElement>(".contract-pill"), x: -4, y: 3 },
            { element: hero.current.querySelector<HTMLElement>(".scroll-cue"), x: 3, y: -2 },
          ];
          let targetX = 0;
          let targetY = 0;
          let currentX = 0;
          let currentY = 0;
          let motionActive = false;

          const renderHeroMotion = () => {
            if (!motionActive) return;
            const smoothing = 1 - Math.pow(0.84, gsap.ticker.deltaRatio(60));
            currentX += (targetX - currentX) * smoothing;
            currentY += (targetY - currentY) * smoothing;

            heroLayers.forEach(({ element, x: depthX, y: depthY }) => {
              if (!element) return;
              element.style.setProperty("--parallax-x", `${currentX * depthX}px`);
              element.style.setProperty("--parallax-y", `${currentY * depthY}px`);
            });

            if (Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001) {
              currentX = targetX;
              currentY = targetY;
              motionActive = false;
            }
          };

          const moveHero = (event: PointerEvent) => {
            if (!hero.current) return;
            const bounds = hero.current.getBoundingClientRect();
            targetX = gsap.utils.clamp(-1, 1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1);
            targetY = gsap.utils.clamp(-1, 1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1);
            motionActive = true;
          };

          const resetHero = () => {
            targetX = 0;
            targetY = 0;
            motionActive = true;
          };

          gsap.ticker.add(renderHeroMotion);
          hero.current.addEventListener("pointermove", moveHero, { passive: true });
          hero.current.addEventListener("pointerleave", resetHero);
          cleanups.push(() => {
            gsap.ticker.remove(renderHeroMotion);
            hero.current?.removeEventListener("pointermove", moveHero);
            hero.current?.removeEventListener("pointerleave", resetHero);
          });
        }

        const labStage = labSection.current?.querySelector<HTMLElement>(".pair-lab-stage");
        const labField = labSection.current?.querySelector<HTMLElement>(".pair-lab-field");
        const labTokens = gsap.utils.toArray<HTMLElement>(".lab-token");

        gsap.set(".lab-result", { autoAlpha: 0, scale: 0.35, rotate: -16 });
        gsap.set(".lab-impact", { autoAlpha: 0, scale: 0.25 });

        const labTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: labSection.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.82,
          },
        });

        labTimeline
          .fromTo(".lab-token-lp",
            { xPercent: -175, yPercent: 48, rotate: -24, scale: 0.72 },
            { xPercent: -58, yPercent: -22, rotate: -7, scale: 1, duration: 1, ease: "power3.out" },
            0,
          )
          .fromTo(".lab-token-met",
            { xPercent: 175, yPercent: -42, rotate: 24, scale: 0.72 },
            { xPercent: 58, yPercent: 22, rotate: 7, scale: 1, duration: 1, ease: "power3.out" },
            0,
          )
          .fromTo(".lab-orbit-rings", { rotate: -24, scale: 0.7 }, { rotate: 128, scale: 1, duration: 1.8, ease: "none" }, 0)
          .to(".lab-token-lp", { xPercent: 10, yPercent: 0, rotate: 350, scale: 0.74, duration: 1.1, ease: "power3.in" }, 1.02)
          .to(".lab-token-met", { xPercent: -10, yPercent: 0, rotate: -350, scale: 0.74, duration: 1.1, ease: "power3.in" }, 1.02)
          .to(".lab-copy-before", { autoAlpha: 0, y: -24, duration: 0.28 }, 1.62)
          .to(labTokens, { autoAlpha: 0, scale: 0.12, duration: 0.2, ease: "power4.in" }, 2.05)
          .to(".lab-impact", { autoAlpha: 1, scale: 1, duration: 0.22, ease: "expo.out" }, 2.08)
          .fromTo(".lab-result",
            { autoAlpha: 0, scale: 0.35, rotate: -16 },
            { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.58, ease: "back.out(1.8)" },
            2.13,
          )
          .to(".lab-impact", { autoAlpha: 0.28, scale: 1.45, duration: 0.65, ease: "power2.out" }, 2.22)
          .fromTo(".lab-copy-after", { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }, 2.24)
          .to(".pair-lab-stage", { "--lab-fade": "100%", duration: 0.9, ease: "none" }, 2.55);

        if (finePointer && labStage && labField) {
          const lpFace = labField.querySelector<HTMLElement>(".lab-token-lp .lab-token-face");
          const metFace = labField.querySelector<HTMLElement>(".lab-token-met .lab-token-face");
          const result = labField.querySelector<HTMLElement>(".lab-result");
          const fieldX = gsap.quickTo(labField, "rotationY", { duration: 0.65, ease: "power3.out" });
          const fieldY = gsap.quickTo(labField, "rotationX", { duration: 0.65, ease: "power3.out" });
          const lpX = lpFace ? gsap.quickTo(lpFace, "x", { duration: 0.55, ease: "power3.out" }) : null;
          const lpY = lpFace ? gsap.quickTo(lpFace, "y", { duration: 0.55, ease: "power3.out" }) : null;
          const metX = metFace ? gsap.quickTo(metFace, "x", { duration: 0.55, ease: "power3.out" }) : null;
          const metY = metFace ? gsap.quickTo(metFace, "y", { duration: 0.55, ease: "power3.out" }) : null;
          const resultX = result ? gsap.quickTo(result, "x", { duration: 0.7, ease: "power3.out" }) : null;
          const resultY = result ? gsap.quickTo(result, "y", { duration: 0.7, ease: "power3.out" }) : null;

          const moveLab = (event: PointerEvent) => {
            const bounds = labStage.getBoundingClientRect();
            const x = gsap.utils.clamp(-1, 1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1);
            const y = gsap.utils.clamp(-1, 1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1);
            labStage.style.setProperty("--lab-glow-x", `${(x + 1) * 50}%`);
            labStage.style.setProperty("--lab-glow-y", `${(y + 1) * 50}%`);
            fieldX(x * 4.5);
            fieldY(y * -3.5);
            lpX?.(x * 13);
            lpY?.(y * 10);
            metX?.(x * -10);
            metY?.(y * -8);
            resultX?.(x * 7);
            resultY?.(y * 5);
          };

          const resetLab = () => {
            labStage.style.setProperty("--lab-glow-x", "50%");
            labStage.style.setProperty("--lab-glow-y", "50%");
            fieldX(0);
            fieldY(0);
            lpX?.(0);
            lpY?.(0);
            metX?.(0);
            metY?.(0);
            resultX?.(0);
            resultY?.(0);
          };

          labStage.addEventListener("pointermove", moveLab, { passive: true });
          labStage.addEventListener("pointerleave", resetLab);
          cleanups.push(() => {
            labStage.removeEventListener("pointermove", moveLab);
            labStage.removeEventListener("pointerleave", resetLab);
          });
        }

        const cards = gsap.utils.toArray<HTMLElement>(".gallery-card");
        cards.forEach((card, index) => {
          if (index === 0) {
            gsap.set(card, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: -2, scale: 1 });
          } else {
            gsap.set(card, {
              autoAlpha: 0,
              xPercent: index % 2 ? 125 : -125,
              yPercent: 18,
              rotate: index % 2 ? 14 : -14,
              scale: 0.72,
            });
          }
        });

        const galleryTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: gallerySection.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.75,
          },
        });

        cards.slice(1).forEach((card, index) => {
          const previous = cards[index];
          galleryTimeline
            .to(previous, { autoAlpha: 0.18, yPercent: -32, rotate: index % 2 ? -11 : 11, scale: 0.68, duration: 0.8 }, index)
            .to(card, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: index % 2 ? 2 : -2, scale: 1, duration: 0.9, ease: "power3.out" }, index + 0.05);
        });

        const galleryDeck = root.current?.querySelector<HTMLElement>(".gallery-deck");
        if (finePointer && galleryDeck) {
          let activeSurface: HTMLElement | null = null;

          const resetSurface = (surface: HTMLElement) => {
            const light = surface.querySelector<HTMLElement>(".gallery-card-light");
            gsap.to(surface, {
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              "--card-contrast": "1",
              "--card-saturation": "1",
              duration: 0.72,
              ease: "power3.out",
              overwrite: "auto",
            });
            if (light) gsap.to(light, { autoAlpha: 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
          };

          const moveCard = (event: PointerEvent) => {
            const visibleCard = cards.reduce<{ card: HTMLElement | null; opacity: number }>((active, card) => {
              const opacity = Number(gsap.getProperty(card, "opacity")) || 0;
              return opacity > active.opacity ? { card, opacity } : active;
            }, { card: null, opacity: -1 });

            if (!visibleCard.card || visibleCard.opacity < 0.35) return;
            const surface = visibleCard.card.querySelector<HTMLElement>(".gallery-card-tilt");
            if (!surface) return;

            if (activeSurface && activeSurface !== surface) resetSurface(activeSurface);
            activeSurface = surface;

            const bounds = galleryDeck.getBoundingClientRect();
            const x = gsap.utils.clamp(-1, 1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1);
            const y = gsap.utils.clamp(-1, 1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1);
            const pull = Math.min(1, Math.hypot(x, y));
            const light = surface.querySelector<HTMLElement>(".gallery-card-light");

            surface.style.setProperty("--light-x", `${(1 - x) * 50}%`);
            surface.style.setProperty("--light-y", `${(1 - y) * 50}%`);
            gsap.to(surface, {
              rotationX: -y * 7,
              rotationY: x * 9,
              scale: 1.018,
              transformPerspective: 950,
              transformOrigin: "center center",
              "--card-contrast": (1 + pull * 0.16).toFixed(3),
              "--card-saturation": (1 + pull * 0.08).toFixed(3),
              duration: 0.42,
              ease: "power3.out",
              overwrite: "auto",
            });
            if (light) gsap.to(light, { autoAlpha: 0.78, duration: 0.28, ease: "power2.out", overwrite: "auto" });
          };

          const resetCard = () => {
            if (activeSurface) resetSurface(activeSurface);
            activeSurface = null;
          };

          galleryDeck.addEventListener("pointermove", moveCard, { passive: true });
          galleryDeck.addEventListener("pointerleave", resetCard);
          cleanups.push(() => {
            galleryDeck.removeEventListener("pointermove", moveCard);
            galleryDeck.removeEventListener("pointerleave", resetCard);
          });
        }

        gsap.fromTo(".gallery-progress-fill", { clipPath: "inset(0 100% 0 0)" }, {
          clipPath: "inset(0 0% 0 0)",
          ease: "none",
          scrollTrigger: { trigger: gallerySection.current, start: "top top", end: "bottom bottom", scrub: true },
        });

        const revealOnce = (trigger: string, selectors: string[]) => {
          const elements = selectors.flatMap((selector) => gsap.utils.toArray<HTMLElement>(selector));
          if (!elements.length) return;

          gsap.fromTo(elements,
            {
              autoAlpha: 0,
              y: 72,
              filter: "blur(10px)",
            },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.64,
              stagger: 0.075,
              ease: "power4.out",
              clearProps: "filter",
              scrollTrigger: {
                trigger,
                start: "top 84%",
                once: true,
                toggleActions: "play none none none",
              },
            },
          );
        };

        revealOnce(".about-grid", [
          ".about-label",
          ".about-copy .eyebrow",
          ".about-copy h2",
          ".about-note",
          ".about-badges span",
        ]);
        revealOnce(".gallery-scroll", [
          ".gallery-heading p",
          ".gallery-heading h2",
          ".gallery-instruction",
        ]);
        revealOnce(".finale", [
          ".finale > p",
          ".finale > h2",
          ".finale-actions",
        ]);

        gsap.fromTo(".finale-logo",
          {
            autoAlpha: 0,
            y: 58,
            scale: 0.94,
            filter: "blur(10px) drop-shadow(0px 0px 0px rgba(17, 6, 32, 0))",
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px) drop-shadow(0px 8px 12px rgba(17, 6, 32, 0.28))",
            duration: 0.86,
            delay: 0.18,
            ease: "power4.out",
            clearProps: "transform,filter,opacity,visibility",
            scrollTrigger: {
              trigger: ".finale",
              start: "top 84%",
              once: true,
              toggleActions: "play none none none",
            },
          },
        );
      }
    }, root);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, []);

  return (
    <main ref={root} className="site-shell">
      <div ref={intro} className="intro" aria-label="Liquidity Pair intro">
        <img className="intro-cover" src={asset("/brand/lp-hero.webp")} alt="" fetchPriority="high" />
        <div className="intro-wash" />
        <span className="intro-bubble bubble-one">HOT<br />PAIR!</span>
        <span className="intro-bubble bubble-two">LP × MET</span>
        <div ref={fullLogo} className="intro-wordmark" role="img" aria-label="Liquidity Pair">
          <img className="intro-wordmark-full" src={asset("/brand/liquidity-pair-wordmark.webp")} alt="" fetchPriority="high" />
          <img className="intro-letter intro-letter-l intro-letter-l-stem" src={asset("/brand/wordmark-l-stem.webp")} alt="" fetchPriority="high" />
          <img className="intro-letter intro-letter-l intro-letter-l-arm" src={asset("/brand/wordmark-l-arm.webp")} alt="" fetchPriority="high" />
          <img className="intro-letter intro-letter-p" src={asset("/brand/wordmark-p.webp")} alt="" fetchPriority="high" />
        </div>
      </div>

      <header className="site-header">
        <a className="brand-link" href="#top" aria-label="Liquidity Pair home">
          <div ref={navMark} className="brand-monogram" aria-hidden="true">
            <div ref={navMarkCanvas} className="brand-monogram-canvas">
              <img className="brand-letter brand-letter-l" src={asset("/brand/wordmark-l-stem.webp")} alt="" />
              <img className="brand-letter brand-letter-l brand-letter-l-arm" src={asset("/brand/wordmark-l-arm.webp")} alt="" />
              <img className="brand-letter brand-letter-p" src={asset("/brand/wordmark-p.webp")} alt="" />
            </div>
          </div>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#about">THE LORE</a>
          <a href="#gallery">THE PAIR</a>
          <a className="nav-social" href={X_URL} target="_blank" rel="noreferrer" aria-label="Liquidity Pair on X">
            <span>X</span><span aria-hidden="true">↗</span>
          </a>
          <a className="nav-chart" href={DEX_URL} target="_blank" rel="noreferrer">
            <span>PEEP CHART</span><span className="nav-arrow" aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section id="top" ref={hero} className="hero">
        <img className="hero-art" src={asset("/brand/lp-hero.webp")} alt="Liquidity Pair character in a cosmic liquidity pool" />
        <div className="hero-shade" />
        <div className="hero-space-layer hero-space-far" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <i className="hero-star" key={`far-star-${index}`} />)}
        </div>
        <div className="hero-space-layer hero-space-near" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <i className="hero-star" key={`near-star-${index}`} />)}
          <i className="hero-streak hero-streak-one" />
          <i className="hero-streak hero-streak-two" />
          <i className="hero-streak hero-streak-three" />
        </div>
        <div className="hero-sticker hero-reveal">
          <span>NO LORE</span>
          <strong><span>JUST</span><span>LIQUIDITY</span></strong>
        </div>
        <div className="hero-ticket hero-reveal">
          <span>ONE OF THE FIRST</span>
          <strong>EMBER DEPLOYS</strong>
          <small>PAIRED WITH $MET</small>
        </div>
        <a className="hero-cta hero-reveal" href={DEX_URL} target="_blank" rel="noreferrer">
          GET IN<br />THE POOL <span>↗</span>
        </a>
        <a className="contract-pill hero-reveal" href={`https://solscan.io/token/${CONTRACT}`} target="_blank" rel="noreferrer">
          CA: {CONTRACT.slice(0, 5)}...{CONTRACT.slice(-4)} ↗
        </a>
        <div className="scroll-cue hero-reveal"><span>SCROLL FOR THE PAIR</span><i /></div>
      </section>

      <section id="about" className="about">
        <div className="ticker" aria-hidden="true">
          <div>
            <span>LIQUIDITY PAIR ★ </span><span>BUILT DIFFERENT ★ </span><span>LP × MET ★ </span>
            <span>LIQUIDITY PAIR ★ </span><span>BUILT DIFFERENT ★ </span><span>LP × MET ★ </span>
          </div>
        </div>
        <div className="about-grid">
          <div className="about-label">
            <span>THE ENTIRE LORE</span>
            <b>↓</b>
          </div>
          <div className="about-copy">
            <p className="eyebrow">A VERY SERIOUS CRYPTO PROJECT*</p>
            <h2>METEORA MADE<br />LIQUIDITY POOLS.<br /><em>WE BROUGHT<br />THE PAIR.</em></h2>
            <div className="about-note">
              <p>One of the first coins to hit Ember. Paired directly with $MET. Powered by liquidity, sunshine, and absolutely no unnecessary lore.</p>
              <small>*it is not serious at all</small>
            </div>
          </div>
          <div className="about-badges" aria-hidden="true">
            <span className="spin-sticker">100%<br />PAIR</span>
            <span>SOLANA<br />SUMMER</span>
          </div>
        </div>
      </section>

      <section id="lab" ref={labSection} className="pair-lab" aria-labelledby="pair-lab-title">
        <div className="pair-lab-stage">
          <div className="pair-lab-stars" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => <i key={`lab-star-${index}`} />)}
          </div>
          <div className="pair-lab-heading lab-copy-before">
            <p>THE PAIRING RITUAL</p>
            <h2 id="pair-lab-title">LIQUIDITY<br /><em>HAS GRAVITY.</em></h2>
          </div>
          <div className="pair-lab-field" aria-hidden="true">
            <div className="lab-orbit-rings"><i /><i /><i /></div>
            <div className="lab-token lab-token-lp">
              <div className="lab-token-face"><strong>LP</strong><span>THE MEME</span></div>
            </div>
            <div className="lab-token lab-token-met">
              <div className="lab-token-face"><strong>$MET</strong><span>THE LIQUIDITY</span></div>
            </div>
            <div className="lab-impact">
              <svg className="lab-impact-rays" viewBox="0 0 100 100" aria-hidden="true">
                {Array.from({ length: 24 }, (_, index) => (
                  <path
                    key={`impact-ray-${index}`}
                    d="M47.38 .07H52.62L51.52 21.04H48.48Z"
                    transform={`rotate(${index * 15} 50 50)`}
                  />
                ))}
              </svg>
            </div>
            <div className="lab-result">
              <img src={asset("/brand/lp-pfp.webp")} alt="" />
            </div>
          </div>
          <div className="pair-lab-result-copy lab-copy-after">
            <span>PERFECTLY PAIRED</span>
            <strong>MET FOUND<br />ITS MATCH.</strong>
            <small>LP × MET · ON SOLANA</small>
          </div>
          <p className="pair-lab-footnote lab-copy-before">TWO ASSETS. ONE VERY UNSERIOUS POSITION.</p>
          <div className="pair-lab-scroll lab-copy-before" aria-hidden="true">KEEP PAIRING <i>↓</i></div>
        </div>
      </section>

      <section id="gallery" ref={gallerySection} className="gallery-scroll">
        <div className="gallery-stage">
          <div className="gallery-heading">
            <p>THE LIQUIDITY LOOKBOOK</p>
            <h2>PAIR-O-RAMA</h2>
          </div>
          <div className="gallery-deck">
            {gallery.map((item, index) => (
              <div className="gallery-card" key={item.image}>
                <figure className="gallery-card-tilt">
                  <img src={item.image} alt={`${item.label} — Liquidity Pair artwork`} loading="lazy" decoding="async" />
                  <i className="gallery-card-light" aria-hidden="true" />
                  <figcaption>
                    <span>{String(index + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</span>
                    <strong>{item.label}</strong>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
          <p className="gallery-instruction">KEEP SCROLLING<br />SHE&apos;S GOT RANGE ↓</p>
          <div className="gallery-progress"><i className="gallery-progress-fill" /></div>
        </div>
      </section>

      <section className="finale">
        <div className="finale-sun" />
        <p>ENOUGH LOOKING.</p>
        <h2>GET LIQUID.</h2>
        <div className="finale-actions">
          <a href={DEX_URL} target="_blank" rel="noreferrer">VIEW THE PAIR ↗</a>
          <a href={X_URL} target="_blank" rel="noreferrer">STALK US ON X ↗</a>
        </div>
        <img className="finale-logo" src={asset("/brand/liquidity-pair-wordmark.webp")} alt="Liquidity Pair" loading="lazy" decoding="async" />
      </section>
    </main>
  );
}
