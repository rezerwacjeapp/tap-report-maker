import { useId } from "react";

/** The RaportON document-with-a-bolt icon (vector redraw of the original app icon). */
export function BrandMark({ className = "h-8 w-auto", title }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const body = `rb${uid}`, band = `rw${uid}`, shade = `rs${uid}`;
  return (
    <svg viewBox="118 62 266 348" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id={body} x1="280" y1="260" x2="380" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#012e57" />
          <stop offset="1" stopColor="#01726f" />
        </linearGradient>
        <linearGradient id={band} x1="250" y1="0" x2="345" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1fcfe" />
        </linearGradient>
        <linearGradient id={shade} x1="276.7" y1="266.3" x2="292" y2="291" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a4d5e" stopOpacity=".32" />
          <stop offset=".45" stopColor="#2a4d5e" stopOpacity=".1" />
          <stop offset="1" stopColor="#2a4d5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M147 66H289L379 156V381A24 24 0 0 1 355 405H147A24 24 0 0 1 123 381V90A24 24 0 0 1 147 66Z" fill={`url(#${body})`} />
      <path d="M289 66V139A12 12 0 0 0 301 151H374Z" fill="#03b989" />
      <path d="M252 202H379V282.5H250.4L174 330.6L240 250H208Z" fill={`url(#${band})`} />
      <path d="M303 250L250.4 282.5H345L370 250Z" fill={`url(#${shade})`} />
      <path d="M303 250L250.4 282.5L174 330.6L240 250Z" fill="#fefefe" />
    </svg>
  );
}

/** Icon + "RaportON" wordmark. */
export function BrandLockup({ className = "", markClassName = "h-8 w-auto", textClassName = "text-2xl" }: {
  className?: string; markClassName?: string; textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className={markClassName} />
      <span className={`font-display font-bold tracking-tight text-foreground ${textClassName}`}>
        Raport<span className="text-accent">ON</span>
      </span>
    </span>
  );
}
