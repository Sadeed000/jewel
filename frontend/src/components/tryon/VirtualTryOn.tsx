'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Camera, Download, RefreshCw, SwitchCamera, Check, ShieldCheck, Sun, ScanFace, RotateCcw, Sparkles } from 'lucide-react';
import LogoLoader from '@/components/common/LogoLoader';
import { getTryOnConfig, getTryOnImage, type TryOnConfig } from '@/lib/tryOn';
import { resolveImageUrl, productImageUrl, cn } from '@/lib/utils';
import { prepareTryOnOverlay } from '@/lib/tryOnOverlay';
import { useToast } from '@/components/providers/ToastProvider';

/**
 * Camera-based virtual try-on.
 *
 * Uses MediaPipe Tasks Vision to track landmarks each frame and draws the
 * product image anchored to the right part of the body:
 *
 *   rings / bracelets / bangles → hand landmarks
 *   earrings / pendants / necklaces / chains / mangalsutra / nose pins → face landmarks
 *
 * The vision runtime is ~2MB, so it is imported dynamically — it only loads
 * when someone actually opens try-on, and never affects first page load.
 *
 * Everything runs locally in the browser. No frame is uploaded anywhere.
 */

/* MediaPipe ships its WASM binaries and models on a CDN; these are fetched
   once and then cached by the browser. */
const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

type Status = 'idle' | 'loading' | 'ready' | 'denied' | 'error' | 'unsupported';

interface Point {
  x: number;
  y: number;
}

/** Landmark indices we anchor to. */
const HAND = { WRIST: 0, INDEX_MCP: 5, RING_MCP: 13, RING_PIP: 14, PINKY_MCP: 17 };
const FACE = { LEFT_EAR: 234, RIGHT_EAR: 454, CHIN: 152, NOSE_TIP: 1, FOREHEAD: 10 };

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export interface TryOnProduct {
  _id: string;
  name: string;
  type: string;
  slug: string;
  tryOnImage?: string;
  coverImages?: string[];
  images?: string[];
}

export default function VirtualTryOn({
  product,
  onClose,
}: {
  product: TryOnProduct;
  onClose: () => void;
}) {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedRef = useRef<{ anchors: Point[]; span: number; angle: number } | null>(null);
  const lastVideoTime = useRef(-1);
  const generationRef = useRef(0);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  /** Latest slider value, read inside the render loop without re-subscribing. */
  const sizeRef = useRef(1);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [detected, setDetected] = useState(false);
  const [sizeAdjust, setSizeAdjust] = useState(1);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [captured, setCaptured] = useState<string | null>(null);
  const [overlayStatus, setOverlayStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const config = getTryOnConfig(product.type);
  const { url: rawImage } = getTryOnImage(product);

  useEffect(() => {
    sizeRef.current = sizeAdjust;
  }, [sizeAdjust]);

  /* ── Draw one frame ── */
  const drawFrame = useCallback(
    (cfg: TryOnConfig) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) return;
      if (lastVideoTime.current === video.currentTime) return;
      lastVideoTime.current = video.currentTime;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match the canvas to the actual video frame so coordinates line up.
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const { width: W, height: H } = canvas;

      ctx.save();
      // Front camera is mirrored so movement feels natural.
      if (facingMode === 'user') {
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      let result: any;
      try {
        result = landmarker.detectForVideo(video, performance.now());
      } catch {
        return; // transient decode error; try again next frame
      }

      const marks =
        cfg.tracker === 'hand' ? result?.landmarks?.[0] : result?.faceLandmarks?.[0];

      if (!marks) {
        setDetected(false);
        smoothedRef.current = null;
        return;
      }
      setDetected(true);

      // Landmarks are normalised 0..1; convert to canvas pixels, mirroring
      // to match the flipped video.
      const px = (p: Point): Point => ({
        x: (facingMode === 'user' ? 1 - p.x : p.x) * W,
        y: p.y * H,
      });

      let anchors: Point[] = [];
      let span = 0;
      let angle = 0;

      if (cfg.mode === 'ring') {
        const mcp = px(marks[HAND.RING_MCP]);
        const pip = px(marks[HAND.RING_PIP]);
        // Sit the band between the knuckle and the first joint.
        anchors = [{ x: (mcp.x + pip.x) / 2, y: (mcp.y + pip.y) / 2 }];
        // Finger width ≈ a fraction of the knuckle span across the hand.
        span = dist(px(marks[HAND.INDEX_MCP]), px(marks[HAND.PINKY_MCP])) / 4;
        angle = Math.atan2(pip.y - mcp.y, pip.x - mcp.x) + Math.PI / 2;
      } else if (cfg.mode === 'wrist') {
        const wrist = px(marks[HAND.WRIST]);
        const indexMcp = px(marks[HAND.INDEX_MCP]);
        const pinkyMcp = px(marks[HAND.PINKY_MCP]);
        const palm = mid(indexMcp, pinkyMcp);
        // Just below the wrist, along the forearm direction.
        const dx = wrist.x - palm.x;
        const dy = wrist.y - palm.y;
        anchors = [{ x: wrist.x + dx * 0.25, y: wrist.y + dy * 0.25 }];
        span = dist(indexMcp, pinkyMcp);
        angle = Math.atan2(dy, dx) - Math.PI / 2;
      } else if (cfg.mode === 'ears') {
        const left = px(marks[FACE.LEFT_EAR]);
        const right = px(marks[FACE.RIGHT_EAR]);
        // Hang from the lobe, a little below the tragion landmark.
        const drop = dist(left, right) * 0.055;
        anchors = [
          { x: left.x - (right.x - left.x) * 0.025, y: left.y + drop },
          { x: right.x + (right.x - left.x) * 0.025, y: right.y + drop },
        ];
        span = dist(left, right);
        angle = Math.atan2(right.y - left.y, right.x - left.x);
      } else if (cfg.mode === 'neck') {
        const chin = px(marks[FACE.CHIN]);
        const forehead = px(marks[FACE.FOREHEAD]);
        const faceHeight = dist(chin, forehead);
        const left = px(marks[FACE.LEFT_EAR]);
        const right = px(marks[FACE.RIGHT_EAR]);
        // Below the chin by a fraction of face height — approximates the
        // hollow of the throat without needing pose landmarks.
        anchors = [{ x: chin.x, y: chin.y + faceHeight * 0.45 }];
        span = dist(left, right);
        angle = Math.atan2(right.y - left.y, right.x - left.x);
      } else {
        // nose
        const nose = px(marks[FACE.NOSE_TIP]);
        const left = px(marks[FACE.LEFT_EAR]);
        const right = px(marks[FACE.RIGHT_EAR]);
        span = dist(left, right);
        anchors = [{ x: nose.x - span * 0.06, y: nose.y }];
        angle = Math.atan2(right.y - left.y, right.x - left.x);
      }

      // Face roll must stay upright when mirrored landmarks reverse direction.
      if (cfg.tracker === 'face') {
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle < -Math.PI / 2) angle += Math.PI;
      }
      // Ear order reverses with the camera mirror; keep the jewellery upright.
      if (cfg.tracker === 'face') {
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle < -Math.PI / 2) angle += Math.PI;
      }
      const previous = smoothedRef.current;
      if (previous && previous.anchors.length === anchors.length) {
        const amount = 0.38;
        anchors = anchors.map((p, i) => ({
          x: previous.anchors[i].x + (p.x - previous.anchors[i].x) * amount,
          y: previous.anchors[i].y + (p.y - previous.anchors[i].y) * amount,
        }));
        span = previous.span + (span - previous.span) * amount;
        const delta = Math.atan2(Math.sin(angle - previous.angle), Math.cos(angle - previous.angle));
        angle = previous.angle + delta * amount;
      }
      smoothedRef.current = { anchors, span, angle };
      const overlay = overlayRef.current;
      if (!overlay || !overlay.width) return;

      const targetW = span * cfg.scale * sizeRef.current;
      const targetH = targetW * (overlay.height / overlay.width);

      for (const [index, anchor] of anchors.entries()) {
        ctx.save();
        ctx.translate(anchor.x, anchor.y);
        ctx.rotate(angle);

        // Hang earrings by the top attachment, rather than their centre.
        if (cfg.mode === 'ears' && index === 1) ctx.scale(-1, 1);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.shadowColor = 'rgba(44, 25, 12, 0.20)';
        ctx.shadowBlur = Math.max(0.5, targetW * 0.012);
        ctx.shadowOffsetY = Math.max(0.5, targetW * 0.008);
        ctx.drawImage(overlay, -targetW / 2, cfg.mode === 'ears' ? -targetH * 0.04 : -targetH / 2, targetW, targetH);
        ctx.restore();
      }
    },
    [facingMode]
  );

  /* ── Start camera + model ── */
  const stop = useCallback(() => {
    generationRef.current++;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { landmarkerRef.current?.close?.(); } catch { /* already closed */ }
    landmarkerRef.current = null;
    smoothedRef.current = null;
    lastVideoTime.current = -1;
  }, []);

  const start = useCallback(async () => {
    if (!config) return;
    stop();
    const generation = generationRef.current;
    const current = () => generation === generationRef.current;
    setDetected(false);
    setStatus('loading');
    setErrorMessage('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    try {
      // Dynamic import keeps the ~2MB vision runtime out of the main bundle.
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
      if (!current()) return;

      const landmarker =
        config.tracker === 'hand'
          ? await vision.HandLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'GPU' },
              runningMode: 'VIDEO',
              numHands: 1,
              minHandDetectionConfidence: 0.65,
              minTrackingConfidence: 0.65,
            })
          : await vision.FaceLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
              runningMode: 'VIDEO',
              numFaces: 1,
              minFaceDetectionConfidence: 0.65,
              minTrackingConfidence: 0.65,
            });
      if (!current()) { landmarker.close(); return; }
      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 } },
        audio: false,
      });
      if (!current()) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) { stop(); return; }
      video.srcObject = stream;
      await video.play();
      if (!current()) return;

      setStatus('ready');

      const loop = () => {
        if (!current()) return;
        drawFrame(config);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      if (!current()) return;
      stop();
      const e = err as Error & { name?: string };
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        setStatus('denied');
      } else if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
        setStatus('error');
        setErrorMessage('No camera was found on this device.');
      } else {
        setStatus('error');
        setErrorMessage(e.message || 'Could not start the camera.');
      }
    }
  }, [config, facingMode, drawFrame, stop]);

  useEffect(() => {
    start();
    return stop;
    // Restart when the camera is flipped.
  }, [start, stop]);

  /* Preload the overlay image once. */
  useEffect(() => {
    let cancelled = false;
    overlayRef.current = null;
    setOverlayStatus('loading');
    if (!rawImage) { setOverlayStatus('error'); return; }
    prepareTryOnOverlay(resolveImageUrl(rawImage), product.type === 'earrings')
      .then((overlay) => {
        if (!cancelled) { overlayRef.current = overlay; setOverlayStatus('ready'); }
      })
      .catch(() => { if (!cancelled) setOverlayStatus('error'); });
    return () => { cancelled = true; };
  }, [rawImage, product.type]);

  /* Release the camera if the tab is hidden, so the light goes off. */
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stop, start]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusBefore = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[data-tryon-dialog]');
    dialog?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)')];
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); focusBefore?.focus(); };
  }, [onClose]);

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      setCaptured(canvas.toDataURL('image/png'));
      toast.success('Snapshot captured');
    } catch {
      // Tainted canvas — a cross-origin overlay without CORS headers.
      toast.error('Could not save this snapshot.');
    }
  };

  const handleDownload = () => {
    if (!captured) return;
    const a = document.createElement('a');
    a.href = captured;
    a.download = `aurelia-tryon-${product.slug}.png`;
    a.click();
  };

  if (!config) return null;

  const canCapture = status === 'ready' && detected && overlayStatus === 'ready';
  const trackingLabel = overlayStatus === 'loading' ? 'Preparing your piece' : overlayStatus === 'error' ? 'Preview image unavailable' : detected ? 'Jewellery in place' : 'Finding your position';

  return (
    <div className="fixed inset-0 z-[95] w-screen flex items-center justify-center bg-[#161210]/80 p-3 backdrop-blur-md sm:p-6">
      <div data-tryon-dialog tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Virtual try-on: ${product.name}`}
        className="relative flex max-h-[94dvh] min-w-0 w-full max-w-6xl flex-col overflow-auto rounded-[24px] bg-[#faf7f2] shadow-2xl outline-none">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e7dfd5] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-4">
            <span className="font-display text-2xl text-brand-maroon">Aurelia<span className="text-brand-gold">.</span></span>
            <span className="hidden h-6 w-px bg-[#ded4c7] sm:block" />
            <span className="hidden text-[10px] uppercase tracking-[0.24em] text-brand-muted sm:block">The try-on studio</span>
          </div>
          <button onClick={onClose} aria-label="Close try-on" className="grid h-10 w-10 place-items-center rounded-full border border-[#e7dfd5] bg-white transition-colors hover:bg-brand-cream"><X size={18} /></button>
        </header>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 p-3 sm:p-5">
            <div className="relative overflow-hidden rounded-2xl bg-[#211e1b]">
              <div className="relative aspect-[4/3] max-h-[62dvh] min-h-[260px] w-full lg:aspect-[5/4]">
                <video ref={videoRef} playsInline muted className="hidden" />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />
                {captured && <img src={captured} alt="Your try-on snapshot" className="absolute inset-0 h-full w-full bg-[#211e1b] object-contain" />}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md">
                  <span className={cn('h-1.5 w-1.5 rounded-full', status === 'ready' ? 'bg-emerald-300' : 'bg-amber-200')} />{captured ? 'Your snapshot' : 'Live preview'}
                </div>
                {!captured && <button onClick={() => setFacingMode((m) => m === 'user' ? 'environment' : 'user')} disabled={status !== 'ready'} aria-label="Switch camera" title="Switch camera" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-md disabled:opacity-40"><SwitchCamera size={16} /></button>}

                {(status === 'loading' || status === 'idle') && <div className="absolute inset-0 grid place-items-center bg-[#211e1b] px-6 text-center"><div><LogoLoader size={56} light /><p className="mt-5 font-display text-2xl text-white">A moment for your mirror</p><p className="mt-2 text-xs text-white/60">Preparing your camera and jewellery preview.</p></div></div>}
                {(status === 'denied' || status === 'error' || status === 'unsupported') && <div className="absolute inset-0 grid place-items-center bg-[#211e1b] px-8 text-center"><div className="max-w-sm"><Camera size={30} className="mx-auto text-brand-gold-light" /><p className="mt-4 font-display text-2xl text-white">{status === 'denied' ? 'Let us open your mirror' : 'Camera unavailable'}</p><p className="mt-3 text-sm leading-relaxed text-white/65">{status === 'denied' ? 'Allow camera access in your browser settings, then try again.' : status === 'unsupported' ? 'Open this page in a browser with camera support using HTTPS or localhost.' : errorMessage}</p>{status !== 'unsupported' && <button onClick={start} className="btn-primary mt-5">Try again</button>}</div></div>}
                {status === 'ready' && !captured && <div className="absolute inset-x-4 bottom-5 flex justify-center"><p className="max-w-md rounded-2xl border border-white/15 bg-black/45 px-4 py-2.5 text-center text-xs leading-relaxed text-white backdrop-blur-md">{overlayStatus === 'error' ? 'This piece needs a transparent preview image. Explore the product details.' : !detected ? config.hint : 'Move gently to see how it sits on you.'}</p></div>}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-[10px] text-white/65" role="status" aria-live="polite">
                <span className="inline-flex items-center gap-2"><span className={cn('h-1.5 w-1.5 rounded-full', canCapture ? 'bg-emerald-300' : 'bg-amber-200')} />{trackingLabel}</span>
                <span className="uppercase tracking-widest">Your private mirror</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#e7dfd5] bg-white px-4 py-4">
              {captured ? <div className="flex justify-center gap-3"><button onClick={() => setCaptured(null)} className="btn-outline inline-flex items-center gap-2"><RefreshCw size={15} /> Retake</button><button onClick={handleDownload} className="btn-primary inline-flex items-center gap-2"><Download size={15} /> Save photo</button></div> : <div className="flex flex-wrap items-center gap-4">
                <label className="flex min-w-[180px] flex-1 items-center gap-3"><span className="text-xs text-brand-muted">Fine-tune fit</span><input type="range" min={0.65} max={1.45} step={0.025} value={sizeAdjust} disabled={overlayStatus !== 'ready'} onChange={(e) => setSizeAdjust(Number(e.target.value))} className="min-w-0 flex-1 accent-brand-maroon" aria-label="Adjust jewellery size" /><span className="w-9 text-right text-[10px] tabular-nums text-brand-muted">{Math.round(sizeAdjust * 100)}%</span></label>
                <button onClick={() => setSizeAdjust(1)} className="grid h-9 w-9 place-items-center rounded-full border border-[#e7dfd5] text-brand-muted hover:bg-brand-cream" aria-label="Reset jewellery size" title="Reset fit"><RotateCcw size={15} /></button>
                <button onClick={handleCapture} disabled={!canCapture} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"><Camera size={15} /> Capture look</button>
              </div>}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-brand-muted"><ShieldCheck size={12} />Your camera stays private. Photos save only when you choose.</p>
          </div>

          <aside className="flex flex-col gap-5 border-t border-[#e7dfd5] bg-[#f2ece4]/60 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div><p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-brand-maroon"><Sparkles size={12} /> Selected for you</p><h2 className="mt-2 font-display text-2xl leading-tight text-brand-ink">The finishing touch.</h2></div>
            <div className="overflow-hidden rounded-2xl border border-[#e5dace] bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-[#f6f2ec]"><img src={productImageUrl(product)} alt={product.name} className="h-full w-full object-contain p-3" /></div>
              <div className="p-4"><p className="text-[9px] uppercase tracking-[0.18em] text-brand-muted">{config.label} collection</p><h3 className="mt-2 font-display text-xl leading-snug text-brand-ink">{product.name}</h3><a href={`/product/${product.slug}`} onClick={onClose} className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#ded3c5] px-4 py-3 text-xs text-brand-maroon transition-colors hover:bg-brand-cream">Explore this piece <span aria-hidden="true">&nearr;</span></a></div>
            </div>
            <div className="space-y-3"><p className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">For your best look</p><p className="flex items-start gap-2.5 text-xs leading-relaxed text-brand-muted"><Sun size={15} className="mt-0.5 shrink-0 text-brand-gold-dark" />Face a window or a soft light.</p><p className="flex items-start gap-2.5 text-xs leading-relaxed text-brand-muted"><ScanFace size={15} className="mt-0.5 shrink-0 text-brand-gold-dark" />{config.tracker === 'hand' ? 'Keep your hand steady and fingers relaxed.' : 'Keep your face centred and jewellery area visible.'}</p><p className="flex items-start gap-2.5 text-xs leading-relaxed text-brand-muted"><Check size={15} className="mt-0.5 shrink-0 text-brand-gold-dark" />Start at the suggested size, then adjust to suit.</p></div>
            {overlayStatus === 'error' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Live jewellery preview is unavailable for this photograph. A transparent image of the piece is needed.</p>}
            <p className="mt-auto border-t border-[#e1d7ca] pt-4 font-display text-base italic text-brand-muted">A little closer to finding your forever piece.</p>
            <p className="text-[10px] leading-relaxed text-brand-muted">Virtual preview; actual size and fit may vary.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
