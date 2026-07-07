'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/locale-context';

export function HeroCarousel() {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=85',
        alt: t.hero.slideAlt1,
      },
      {
        src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=85',
        alt: t.hero.slideAlt2,
      },
    ],
    [t.hero.slideAlt1, t.hero.slideAlt2],
  );

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-800"
      style={{ height: 'clamp(280px, 42vw, 480px)' }}
    >
      {slides.map((slide, i) => (
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

      <div className="absolute inset-0 z-20 bg-gradient-to-r from-indigo-950/85 via-purple-900/60 to-sky-900/30" />

      <div className="absolute inset-0 z-30 flex items-center">
        <div className="max-w-[1140px] mx-auto w-full px-6 sm:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90 sm:text-sm">
            {t.hero.orgName}
          </p>
          <h1 className="max-w-2xl text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
            {t.hero.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-sky-100/95 sm:text-base">{t.hero.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/farmer-login"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 px-5 py-2.5 text-sm font-bold text-indigo-950 shadow-lg transition hover:brightness-110"
            >
              {t.hero.applyForTdr}
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center rounded-xl border-2 border-white/90 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {t.hero.verifyCertificate}
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-3 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
        aria-label={t.hero.previousSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-3 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
        aria-label={t.hero.nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60',
            )}
            aria-label={`${t.hero.goToSlide} ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
