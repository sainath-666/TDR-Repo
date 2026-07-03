'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

interface CertificateQrProps {
  verifyPath: string;
  size?: number;
  className?: string;
}

export function CertificateQr({ verifyPath, size = 72, className }: CertificateQrProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = verifyPath.startsWith('http') ? verifyPath : `${origin}${verifyPath}`;
    void QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#1B5E20', light: '#FFFFFF' },
    })
      .then(setSrc)
      .catch(() => setSrc(''));
  }, [verifyPath, size]);

  if (!src) {
    return (
      <div
        className={cn('animate-pulse bg-slate-100', className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={src}
      alt="Certificate verification QR code"
      width={size}
      height={size}
      unoptimized
      className={cn('block border border-slate-300 bg-white', className)}
    />
  );
}
