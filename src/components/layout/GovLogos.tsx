import { cn } from '@/lib/utils';

export const AP_GOV_LOGO = '/images/APGOV-logo.png';
export const APCRDA_LOGO = '/images/APCRDA.png';

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
    // eslint-disable-next-line @next/next/no-img-element -- local static asset
    <img
      src={APCRDA_LOGO}
      alt="APCRDA — Amaravati The People's Capital"
      width={120}
      height={72}
      className={cn('object-contain', className)}
      decoding="async"
    />
  );
}
