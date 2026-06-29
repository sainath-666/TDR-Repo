'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=85',
    alt: 'Capital region development',
  },
  {
    src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=85',
    alt: 'Urban development',
  },
] as const;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-800"
      style={{ height: 'clamp(280px, 42vw, 480px)' }}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000',
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0',
          )}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />

      <div className="absolute inset-0 z-30 flex items-center">
        <div className="max-w-[1140px] mx-auto w-full px-6 sm:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
            Andhra Pradesh Capital Region Development Authority
          </p>
          <h1 className="max-w-2xl text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Transferable Development Rights
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">
            Offline TDR bond validation and migration for Amaravati landowners under the Land
            Pooling Scheme.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/farmer-login"
              className="inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[var(--portal-purple)] shadow-md transition hover:bg-slate-50"
            >
              Apply for TDR
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center rounded-lg border-2 border-white/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Verify Certificate
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-3 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-3 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60',
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
