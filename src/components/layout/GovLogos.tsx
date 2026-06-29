import { cn } from '@/lib/utils';

export const AP_GOV_LOGO = '/images/APGOV-logo.png';

/**
 * Andhra Pradesh Government emblem.
 * File: public/images/APGOV-logo.png (resized from APGOV.png for web)
 */
export function ApStateEmblem({ className = 'h-[72px] w-[72px]' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static asset; avoids next/image fail on large PNG
    <img
      src={AP_GOV_LOGO}
      alt="Government of Andhra Pradesh"
      width={72}
      height={72}
      className={cn('object-contain', className)}
      decoding="async"
    />
  );
}

export function AmaravatiLogo({ className = 'h-[72px] w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-label="Amaravati The People's Capital">
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="72" rx="40" ry="10" fill="#D4AF37" opacity="0.25" />
      <path d="M60 15 L75 58 L45 58 Z" fill="url(#gold)" stroke="#8B6914" strokeWidth="1" />
      <rect
        x="52"
        y="58"
        width="16"
        height="18"
        fill="url(#gold)"
        stroke="#8B6914"
        strokeWidth="0.5"
      />
      <ellipse cx="60" cy="15" rx="10" ry="5" fill="url(#gold)" />
      <text
        x="60"
        y="84"
        textAnchor="middle"
        fontSize="7"
        fill="#5c1a2e"
        fontWeight="bold"
        fontFamily="Arial"
      >
        AMARAVATI
      </text>
      <text x="60" y="89" textAnchor="middle" fontSize="5" fill="#666" fontFamily="Arial">
        THE PEOPLE&apos;S CAPITAL
      </text>
    </svg>
  );
}
