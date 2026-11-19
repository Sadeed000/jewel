'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, Link2Off,
  ImagePlus, Pilcrow, Code2, Undo2, Redo2, Minus, RemoveFormatting,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Lightweight WYSIWYG editor for blog articles — no extra dependency.
 *
 * Produces plain semantic HTML (h2/h3, p, lists, blockquote, links, images).
 * The API sanitises whatever arrives against a fixed allowlist, so this
 * editor is a convenience, not the security boundary.
 *
 * - Paste is inserted as plain text, so formatting copied from Word or
 *   Google Docs can't drag in fonts, colours or junk markup.
 * - Links to this site are stored as relative paths ("/rings"), so they keep
 *   working if the storefront moves to another domain.
 * - An HTML view is available for tables or fine-tuning.
 */

/** Turns https://this-site/x into /x; leaves other URLs alone. */
export function toSiteRelative(url: string): string {
  const value = url.trim();
  if (typeof window === 'undefined') return value;
  try {
    const u = new URL(value, window.location.origin);
    if (u.origin === window.location.origin) return `${u.pathname}${u.search}${u.hash}` || '/';
  } catch {
    /* keep as typed */
  }
  return value;
}

/** Also relativise links already present in pasted / HTML-mode content. */
function relativiseLinks(html: string): string {
  if (typeof window === 'undefined') return html;
  const origin = window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`href="${origin}(/[^"]*)?"`, 'g'), (_m, p) => `href="${p || '/'}"`);
}

type Prompt = { kind: 'link' | 'image'; url: string; alt: string } | null;

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [empty, setEmpty] = useState(!value);

  // Sync external value (loading a post) without clobbering the caret while typing.
  useEffect(() => {
    const el = ref.current;
    if (el && !htmlMode && el.innerHTML !== value) {
      el.innerHTML = value || '';
      setEmpty(!el.textContent?.trim() && !el.querySelector('img'));
    }
  }, [value, htmlMode]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    setEmpty(!el.textContent?.trim() && !el.querySelector('img'));
    onChange(relativiseLinks(el.innerHTML));
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0);
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    ref.current?.focus();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const applyPrompt = () => {
    if (!prompt) return;
    const url = prompt.kind === 'link' ? toSiteRelative(prompt.url) : prompt.url.trim();
    if (!url) return setPrompt(null);
    restoreSelection();
    if (prompt.kind === 'link') {
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        // No text selected: insert the URL itself as the link text.
        document.execCommand('insertHTML', false, `<a href="${url.replace(/"/g, '&quot;')}">${url.replace(/</g, '&lt;')}</a>`);
      } else {
        document.execCommand('createLink', false, url);
      }
    } else {
      const alt = prompt.alt.replace(/"/g, '&quot;').replace(/</g, '&lt;');
      document.execCommand('insertHTML', false, `<img src="${url.replace(/"/g, '&quot;')}" alt="${alt}">`);
    }
    setPrompt(null);
    emit();
  };

  const tools: { icon: typeof Bold; label: string; run: () => void }[] = [
    { icon: Pilcrow, label: 'Paragraph', run: () => exec('formatBlock', '<p>') },
    { icon: Heading2, label: 'Heading', run: () => exec('formatBlock', '<h2>') },
    { icon: Heading3, label: 'Sub-heading', run: () => exec('formatBlock', '<h3>') },
    { icon: Bold, label: 'Bold', run: () => exec('bold') },
    { icon: Italic, label: 'Italic', run: () => exec('italic') },
    { icon: List, label: 'Bulleted list', run: () => exec('insertUnorderedList') },
    { icon: ListOrdered, label: 'Numbered list', run: () => exec('insertOrderedList') },
    { icon: Quote, label: 'Quote', run: () => exec('formatBlock', '<blockquote>') },
    { icon: Minus, label: 'Divider', run: () => exec('insertHorizontalRule') },
    {
      icon: Link2,
      label: 'Add link',
      run: () => {
        saveSelection();
        setPrompt({ kind: 'link', url: '', alt: '' });
      },
    },
    { icon: Link2Off, label: 'Remove link', run: () => exec('unlink') },
    {
      icon: ImagePlus,
      label: 'Insert image',
      run: () => {
        saveSelection();
        setPrompt({ kind: 'image', url: '', alt: '' });
      },
    },
    { icon: RemoveFormatting, label: 'Clear formatting', run: () => exec('removeFormat') },
    { icon: Undo2, label: 'Undo', run: () => exec('undo') },
    { icon: Redo2, label: 'Redo', run: () => exec('redo') },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-admin-line bg-admin-surface shadow-[0_1px_2px_rgba(122,82,40,0.05)] focus-within:border-admin-gold focus-within:ring-4 focus-within:ring-admin-gold/15">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-admin-line bg-admin-subtle px-2 py-1.5" role="toolbar" aria-label="Formatting">
        {tools.map(({ icon: Icon, label, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            disabled={htmlMode}
            // Keep the editor's selection when clicking the toolbar.
            onMouseDown={(e) => e.preventDefault()}
            onClick={run}
            className="grid h-8 w-8 place-items-center rounded-lg text-admin-body transition-colors hover:bg-admin-gold-soft hover:text-admin-maroon disabled:opacity-40"
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setHtmlMode((m) => !m)}
          className={cn(
            'ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors',
            htmlMode ? 'bg-admin-maroon text-white' : 'text-admin-body hover:bg-admin-gold-soft'
          )}
          aria-pressed={htmlMode}
        >
          <Code2 size={14} /> HTML
        </button>
      </div>

      {prompt && (
        <div className="flex flex-wrap items-center gap-2 border-b border-admin-line bg-admin-gold-soft/50 px-3 py-2">
          <input
            autoFocus
            value={prompt.url}
            onChange={(e) => setPrompt({ ...prompt, url: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyPrompt(); }
              if (e.key === 'Escape') setPrompt(null);
            }}
            placeholder={prompt.kind === 'link' ? 'Paste a link, or a site path like /rings' : 'Image URL (https://…)'}
            className="h-9 min-w-[220px] flex-1 rounded-lg border border-admin-line bg-white px-3 text-sm outline-none focus:border-admin-gold"
          />
          {prompt.kind === 'image' && (
            <input
              value={prompt.alt}
              onChange={(e) => setPrompt({ ...prompt, alt: e.target.value })}
              placeholder="Describe the image (alt text)"
              className="h-9 min-w-[200px] flex-1 rounded-lg border border-admin-line bg-white px-3 text-sm outline-none focus:border-admin-gold"
            />
          )}
          <button type="button" onClick={applyPrompt} className="h-9 rounded-lg bg-admin-maroon px-3 text-xs font-semibold text-white">
            {prompt.kind === 'link' ? 'Add link' : 'Insert'}
          </button>
          <button type="button" onClick={() => setPrompt(null)} className="h-9 rounded-lg px-3 text-xs font-semibold text-admin-body hover:bg-white">
            Cancel
          </button>
        </div>
      )}

      {htmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(relativiseLinks(e.target.value))}
          spellCheck={false}
          aria-label="Article HTML"
          className="block min-h-[420px] w-full resize-y bg-white p-4 font-mono text-[13px] leading-relaxed text-admin-ink outline-none"
        />
      ) : (
        <div className="relative">
          {empty && (
            <p className="pointer-events-none absolute left-5 top-4 text-[15px] text-admin-muted/70">{placeholder}</p>
          )}
          <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Article body"
            onInput={emit}
            onBlur={emit}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text/plain');
              document.execCommand('insertText', false, text);
            }}
            className="article-body admin-article min-h-[420px] px-5 py-4 text-[15px] outline-none"
          />
        </div>
      )}
    </div>
  );
}
