/**
 * A template (unlike a layout) re-mounts on every navigation, so each page
 * fades and rises in. Header and footer live in the layout and so stay still
 * while content changes underneath them.
 *
 * This is a server component with a CSS animation (see `.page-enter` in
 * globals.css) rather than a framer-motion wrapper: the old version rendered
 * every page at opacity 0 until JavaScript hydrated, hiding server-rendered
 * HTML that had already arrived.
 */
export default function StorefrontTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
