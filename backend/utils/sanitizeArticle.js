const sanitizeHtml = require('sanitize-html');

/**
 * Cleans HTML produced by the admin article editor before it is stored.
 *
 * The editor is trusted-admin input, but the output is rendered to every
 * visitor, so it is reduced to a fixed set of formatting tags: no scripts,
 * no inline event handlers, no styles, no iframes. `javascript:` URLs are
 * dropped by the scheme allowlist.
 *
 * - <h1> becomes <h2>: the article title is the page's only H1.
 * - External links open safely (rel="noopener noreferrer").
 * - Relative links (/shop/silver, /product/x) are kept relative so they
 *   follow the storefront to whatever domain it is served on.
 */
const OPTIONS = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
    'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    h1: 'h2',
    b: 'strong',
    i: 'em',
    a: (tagName, attribs) => {
      const href = (attribs.href || '').trim();
      const external = /^https?:\/\//i.test(href);
      const out = { href };
      if (attribs.title) out.title = attribs.title;
      if (external) {
        out.target = '_blank';
        out.rel = 'noopener noreferrer';
      }
      return { tagName: 'a', attribs: out };
    },
    img: (tagName, attribs) => ({
      tagName: 'img',
      attribs: { ...attribs, loading: 'lazy', alt: attribs.alt || '' },
    }),
  },
  // Empty paragraphs left behind by the editor.
  exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren?.length,
};

const sanitizeArticle = (html) => sanitizeHtml(String(html || ''), OPTIONS).trim();

/**
 * Plain-text fields (title, excerpt, SEO) — drop any markup. Not entity
 * encoded: these are rendered as text by React, which escapes them itself,
 * so "Rings & Care" must stay "Rings & Care" rather than "Rings &amp; Care".
 */
const stripTags = (value) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value);

module.exports = { sanitizeArticle, stripTags };
