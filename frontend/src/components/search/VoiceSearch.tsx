'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ───────────── Web Speech API typings ─────────────
   Not in TypeScript's DOM lib (Chrome/Edge/Safari ship it prefixed), so the
   small surface we use is declared here. */
interface SpeechRecognitionAlternativeLike { transcript: string; confidence: number }
interface SpeechRecognitionResultLike { isFinal: boolean; length: number; [i: number]: SpeechRecognitionAlternativeLike }
interface SpeechRecognitionEventLike { resultIndex: number; results: { length: number; [i: number]: SpeechRecognitionResultLike } }
interface SpeechRecognitionErrorEventLike { error: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

type Status = 'idle' | 'listening' | 'done' | 'error';

const ERROR_COPY: Record<string, { title: string; hint: string }> = {
  'no-speech': { title: "Didn't hear that", hint: 'Tap the microphone and try again.' },
  aborted: { title: "Didn't hear that", hint: 'Tap the microphone and try again.' },
  'audio-capture': { title: 'No microphone found', hint: 'Connect a microphone and try again.' },
  'not-allowed': {
    title: 'Microphone access is blocked',
    hint: 'Allow microphone access from the icon in your browser’s address bar, then try again.',
  },
  'service-not-allowed': {
    title: 'Microphone access is blocked',
    hint: 'Allow microphone access from the icon in your browser’s address bar, then try again.',
  },
  network: { title: 'Voice search needs a connection', hint: 'Check your internet connection and try again.' },
  insecure: {
    title: 'Voice search needs a secure connection',
    hint: 'Open the site over https:// to use the microphone.',
  },
  unsupported: {
    title: 'Voice search isn’t available here',
    hint: 'Your browser doesn’t support it. Try Chrome, Edge or Safari, or type your search instead.',
  },
};

const EXAMPLES = ['gold earrings', 'diamond ring', 'emerald pendant', 'mangalsutra'];

/** Browsers append a full stop to dictated phrases; searches don't want it. */
const cleanTranscript = (t: string) => t.replace(/[.。!?,]+$/u, '').replace(/\s+/g, ' ').trim();

/* ───────────── Overlay ───────────── */

function VoiceSearchOverlay({ onClose, onResult }: { onClose: () => void; onResult: (text: string) => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const erroredRef = useRef(false);
  // Held in a ref so a parent re-render (new callback identity) never
  // restarts recognition mid-sentence.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const fail = useCallback((key: string) => {
    erroredRef.current = true;
    setErrorKey(ERROR_COPY[key] ? key : 'no-speech');
    setStatus('error');
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return fail('unsupported');
    if (typeof window !== 'undefined' && !window.isSecureContext) return fail('insecure');

    recognitionRef.current?.abort();
    finalRef.current = '';
    erroredRef.current = false;
    setTranscript('');
    setErrorKey(null);
    setStatus('idle');

    const rec = new Ctor();
    // Indian English by default — understands local pronunciation of names
    // like "mangalsutra" far better than en-US.
    rec.lang = navigator.language?.startsWith('en') ? 'en-IN' : navigator.language || 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setStatus('listening');
    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) finalRef.current += final;
      setTranscript(cleanTranscript(finalRef.current + interim));
    };
    rec.onerror = (event) => {
      // `aborted` fires when we stop it ourselves (closing / restarting).
      if (closedRef.current || recognitionRef.current !== rec || event.error === 'aborted') return;
      fail(event.error);
    };
    rec.onend = () => {
      // Ignore a stale instance that was replaced by a retry.
      if (closedRef.current || recognitionRef.current !== rec) return;
      const text = cleanTranscript(finalRef.current);
      if (text) {
        setStatus('done');
        setTranscript(text);
        // A short beat so the shopper sees what was understood, like YouTube.
        submitTimer.current = setTimeout(() => onResultRef.current(text), 550);
      } else if (!erroredRef.current) {
        fail('no-speech');
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      fail('no-speech');
    }
  }, [fail]);

  // Start listening as soon as the overlay opens; tear down on close.
  useEffect(() => {
    closedRef.current = false;
    start();
    return () => {
      closedRef.current = true;
      if (submitTimer.current) clearTimeout(submitTimer.current);
      recognitionRef.current?.abort();
    };
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggleMic = () => {
    if (status === 'listening') recognitionRef.current?.stop();
    else start();
  };

  const listening = status === 'listening';
  const error = status === 'error' && errorKey ? ERROR_COPY[errorKey] : null;
  const canRetry = errorKey !== 'unsupported' && errorKey !== 'insecure';

  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Voice search">
      <div className="backdrop-in absolute inset-0 bg-brand-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="dialog-in relative mt-0 w-full max-w-xl overflow-hidden bg-white shadow-[0_24px_60px_-12px_rgba(26,26,26,0.35)] sm:mt-0 sm:rounded-3xl min-h-[52vh] sm:min-h-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand-cream hover:text-brand-ink"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center px-6 pb-10 pt-14 text-center sm:px-10">
          {/* Live status / transcript */}
          <div className="min-h-[96px] w-full" aria-live="polite">
            {error ? (
              <>
                <p className="font-display text-3xl text-brand-ink">{error.title}</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-brand-muted">{error.hint}</p>
              </>
            ) : transcript ? (
              <p
                className={cn(
                  'font-display text-3xl leading-snug sm:text-4xl',
                  status === 'done' ? 'text-brand-ink' : 'text-brand-ink/70'
                )}
              >
                {transcript}
              </p>
            ) : (
              <>
                <p className="font-display text-3xl text-brand-ink">{listening ? 'Listening…' : 'Starting…'}</p>
                <p className="mt-2 text-sm text-brand-muted">
                  Try saying <span className="text-brand-maroon">“{EXAMPLES[0]}”</span> or{' '}
                  <span className="text-brand-maroon">“{EXAMPLES[1]}”</span>
                </p>
              </>
            )}
          </div>

          {/* Mic */}
          <div className="relative mt-10 grid h-28 w-28 place-items-center">
            {listening && (
              <>
                <span className="voice-ring absolute inset-0 rounded-full bg-red-500/30" aria-hidden="true" />
                <span className="voice-ring voice-ring-delay absolute inset-0 rounded-full bg-red-500/25" aria-hidden="true" />
              </>
            )}
            <button
              type="button"
              onClick={toggleMic}
              disabled={!canRetry && status === 'error'}
              aria-label={listening ? 'Stop listening' : 'Start listening'}
              className={cn(
                'relative grid h-20 w-20 place-items-center rounded-full transition-[background-color,transform,box-shadow] duration-base active:scale-95 focus-visible:outline-none focus-visible:ring-4',
                listening
                  ? 'bg-red-600 text-white shadow-[0_10px_30px_-6px_rgba(220,38,38,0.65)] focus-visible:ring-red-300'
                  : status === 'done'
                    ? 'bg-brand-maroon text-white focus-visible:ring-brand-gold/40'
                    : 'bg-white text-brand-maroon ring-1 ring-brand-line shadow-soft hover:bg-brand-cream focus-visible:ring-brand-gold/40',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {!canRetry && status === 'error' ? <MicOff size={30} /> : <Mic size={30} />}
            </button>
          </div>

          {/* Level bars while listening */}
          <div className="mt-6 flex h-6 items-center gap-1" aria-hidden="true">
            {listening &&
              [0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="voice-bar block h-6 w-1 rounded-full bg-red-500/80"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
          </div>

          <p className="mt-2 text-xs text-brand-muted">
            {listening
              ? 'Speak now — we’ll search when you pause'
              : status === 'done'
                ? 'Searching…'
                : error && canRetry
                  ? 'Tap the microphone to try again'
                  : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Trigger button ───────────── */

/**
 * Microphone button that opens the voice search overlay and reports the
 * recognised phrase through `onResult`.
 */
export default function VoiceSearchButton({
  onResult,
  className,
  size = 18,
}: {
  onResult: (text: string) => void;
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const handleResult = useCallback((text: string) => {
    setOpen(false);
    onResultRef.current(text);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search with your voice"
        title="Search with your voice"
        className={cn('btn-icon h-9 w-9 hover:bg-white', className)}
      >
        <Mic size={size} />
      </button>
      {mounted && open && createPortal(<VoiceSearchOverlay onClose={close} onResult={handleResult} />, document.body)}
    </>
  );
}
