"use client";

import { useEffect, useRef } from "react";

const MAX_RIPPLES = 12;

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  uniform float uTime;
  uniform float uFocusX;
  uniform vec4 uRipples[${MAX_RIPPLES}];

  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    float viewportAspect = uResolution.x / max(uResolution.y, 1.0);
    float imageAspect = uImageResolution.x / max(uImageResolution.y, 1.0);
    vec2 scale = vec2(1.0);

    if (viewportAspect > imageAspect) {
      scale.y = imageAspect / viewportAspect;
    } else {
      scale.x = viewportAspect / imageAspect;
    }

    return (uv - 0.5) * scale + vec2(uFocusX, 0.5);
  }

  void main() {
    float viewportAspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 displacement = vec2(0.0);
    float lightBand = 0.0;

    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 ripple = uRipples[i];
      float age = uTime - ripple.z;
      float active = step(0.0, age) * step(age, 3.8);
      vec2 delta = vUv - ripple.xy;
      delta.x *= viewportAspect;
      float distanceFromCenter = length(delta);
      float radius = age * 0.19;
      float ring = exp(-42.0 * abs(distanceFromCenter - radius));
      float decay = exp(-age * 0.72);
      float oscillation = sin((distanceFromCenter - radius) * 118.0);
      float amplitude = active * ripple.w * ring * decay * oscillation;
      vec2 direction = delta / max(distanceFromCenter, 0.001);
      direction.x /= viewportAspect;

      displacement += direction * amplitude * 0.014;
      lightBand += amplitude;
    }

    vec2 uv = clamp(coverUv(vUv + displacement), 0.001, 0.999);
    float chroma = min(abs(lightBand) * 0.0018, 0.004);
    vec3 color;
    color.r = texture2D(uTexture, clamp(uv + vec2(chroma, 0.0), 0.001, 0.999)).r;
    color.g = texture2D(uTexture, uv).g;
    color.b = texture2D(uTexture, clamp(uv - vec2(chroma, 0.0), 0.001, 0.999)).b;
    color += max(lightBand, 0.0) * vec3(0.12, 0.055, 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create the hero ripple shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

type HeroRippleProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function HeroRipple({ src, alt, className = "" }: HeroRippleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!container || !image || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let vertexShader: WebGLShader | null = null;
    let fragmentShader: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let frame = 0;
    let visible = true;
    let textureReady = false;
    let rippleIndex = 0;
    let lastPointerRipple = 0;
    let lastPointerX = Number.NaN;
    let lastPointerY = Number.NaN;
    let lastAmbientRipple = -1.4;
    const startedAt = performance.now();
    const ripples = new Float32Array(MAX_RIPPLES * 4);

    for (let index = 0; index < MAX_RIPPLES; index += 1) {
      ripples[index * 4 + 2] = -100;
    }

    try {
      vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      if (!program) throw new Error("Unable to create the hero ripple program.");

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.bindAttribLocation(program, 0, "aPosition");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? "Shader linking failed.");
      }

      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([17, 6, 32, 255]),
      );
    } catch (error) {
      console.warn("Hero ripple effect could not start.", error);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      return;
    }

    const textureLocation = gl.getUniformLocation(program, "uTexture");
    const resolutionLocation = gl.getUniformLocation(program, "uResolution");
    const imageResolutionLocation = gl.getUniformLocation(program, "uImageResolution");
    const timeLocation = gl.getUniformLocation(program, "uTime");
    const focusLocation = gl.getUniformLocation(program, "uFocusX");
    const ripplesLocation = gl.getUniformLocation(program, "uRipples[0]");
    gl.uniform1i(textureLocation, 0);

    const elapsedSeconds = () => (performance.now() - startedAt) / 1000;

    const addRipple = (x: number, y: number, strength: number) => {
      const offset = (rippleIndex % MAX_RIPPLES) * 4;
      rippleIndex += 1;
      ripples[offset] = Math.max(0.02, Math.min(0.98, x));
      ripples[offset + 1] = Math.max(0.02, Math.min(0.98, 1 - y));
      ripples[offset + 2] = elapsedSeconds();
      ripples[offset + 3] = strength;
    };

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * dpr));
      const height = Math.max(1, Math.round(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const uploadImage = () => {
      if (!image.complete || image.naturalWidth === 0 || !texture) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
      container.classList.add("is-ripple-ready");
      resize();
    };

    const pointerPosition = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      return {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height,
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const now = performance.now();
      const point = pointerPosition(event);
      const movedFarEnough = Number.isNaN(lastPointerX)
        || Math.hypot(point.x - lastPointerX, point.y - lastPointerY) > 0.022;
      if (now - lastPointerRipple < 52 || !movedFarEnough) return;

      lastPointerRipple = now;
      lastPointerX = point.x;
      lastPointerY = point.y;
      addRipple(point.x, point.y, 0.42);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const point = pointerPosition(event);
      addRipple(point.x, point.y, 1.05);
    };

    const handlePointerLeave = () => {
      lastPointerX = Number.NaN;
      lastPointerY = Number.NaN;
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      if (!textureReady || !visible || document.hidden) return;

      const time = elapsedSeconds();
      if (time - lastAmbientRipple > 3.4) {
        lastAmbientRipple = time;
        addRipple(0.18 + Math.random() * 0.64, 0.64 + Math.random() * 0.22, 0.24);
      }

      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(imageResolutionLocation, image.naturalWidth, image.naturalHeight);
      gl.uniform1f(timeLocation, time);
      gl.uniform1f(focusLocation, window.innerWidth <= 600 ? 0.52 : 0.5);
      gl.uniform4fv(ripplesLocation, ripples);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; },
      { threshold: 0.01 },
    );

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    container.parentElement?.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.parentElement?.addEventListener("pointerdown", handlePointerDown, { passive: true });
    container.parentElement?.addEventListener("pointerleave", handlePointerLeave);
    image.addEventListener("load", uploadImage);
    if (image.complete) uploadImage();
    resize();
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.parentElement?.removeEventListener("pointermove", handlePointerMove);
      container.parentElement?.removeEventListener("pointerdown", handlePointerDown);
      container.parentElement?.removeEventListener("pointerleave", handlePointerLeave);
      image.removeEventListener("load", uploadImage);
      container.classList.remove("is-ripple-ready");
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    };
  }, [src]);

  return (
    <div ref={containerRef} className={`${className} hero-ripple`.trim()}>
      <img ref={imageRef} className="hero-ripple-fallback" src={src} alt={alt} />
      <canvas ref={canvasRef} className="hero-ripple-canvas" aria-hidden="true" />
    </div>
  );
}
