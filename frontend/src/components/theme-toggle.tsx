'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsToggling(true);
    setTimeout(() => setIsToggling(false), 600);
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'group relative h-8 w-8 overflow-hidden rounded-xl border-2 transition-all duration-300',
        'hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95',
        isDark
          ? 'border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 focus:ring-purple-400'
          : 'border-orange-300/50 bg-gradient-to-br from-amber-200 via-orange-300 to-yellow-200 focus:ring-orange-400',
        'shadow-lg transition-shadow duration-300 hover:shadow-xl',
        isToggling && 'animate-pulse',
        className
      )}
      aria-label='Toggle theme'
    >
      {/* Animated Background Blob */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-700 ease-in-out',
          isDark
            ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-20'
            : 'bg-gradient-to-br from-yellow-300 via-orange-400 to-red-400 opacity-30'
        )}
        style={{
          transform: isDark ? 'rotate(180deg) scale(1.2)' : 'rotate(0deg) scale(1)',
          borderRadius: isDark ? '60% 40% 30% 70%' : '50% 50% 50% 50%'
        }}
      />

      {/* Main SVG Container */}
      <div className='relative z-10 flex h-full w-full items-center justify-center'>
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          className='transition-transform duration-500 ease-in-out'
          style={{ transform: isToggling ? 'rotate(360deg)' : 'rotate(0deg)' }}
        >
          {/* Sun Morphing to Moon */}
          <defs>
            <mask id='moonMask'>
              <rect width='24' height='24' fill='white' />
              <circle
                cx={isDark ? '25' : '30'}
                cy={isDark ? '5' : '2'}
                r='8'
                fill='black'
                className='transition-all duration-700 ease-in-out'
              />
            </mask>
          </defs>

          {/* Main Circle (Sun/Moon body) */}
          <circle
            cx='12'
            cy='12'
            r={isDark ? '6' : '5'}
            mask={isDark ? 'url(#moonMask)' : undefined}
            className={cn(
              'transition-all duration-700 ease-in-out',
              isDark ? 'fill-slate-200' : 'fill-yellow-400'
            )}
          />

          {/* Sun Rays */}
          <g
            className={cn(
              'origin-center transition-all duration-500 ease-in-out',
              isDark ? 'scale-0 rotate-180 opacity-0' : 'scale-100 rotate-0 opacity-100'
            )}
          >
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1='12'
                y1='2'
                x2='12'
                y2='4'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                className='text-orange-400'
                transform={`rotate(${angle} 12 12)`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: isDark ? 0 : 1,
                  transition: `opacity 0.3s ease ${i * 0.05}s`
                }}
              />
            ))}
          </g>

          {/* Moon Craters */}
          <g
            className={cn(
              'transition-all duration-500 ease-in-out',
              isDark ? 'scale-100 opacity-60' : 'scale-0 opacity-0'
            )}
          >
            <circle cx='10' cy='10' r='0.8' fill='currentColor' className='text-slate-400' />
            <circle cx='14' cy='13' r='0.5' fill='currentColor' className='text-slate-400' />
            <circle cx='11' cy='14' r='0.3' fill='currentColor' className='text-slate-400' />
          </g>

          {/* Twinkling Stars */}
          <g
            className={cn(
              'transition-all duration-700 ease-in-out',
              isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
          >
            {[
              { cx: 6, cy: 6, delay: '0s' },
              { cx: 18, cy: 8, delay: '0.2s' },
              { cx: 5, cy: 18, delay: '0.4s' },
              { cx: 19, cy: 16, delay: '0.6s' }
            ].map((star, i) => (
              <g key={i}>
                <circle
                  cx={star.cx}
                  cy={star.cy}
                  r='0.5'
                  fill='currentColor'
                  className='animate-pulse text-white'
                  style={{
                    animationDelay: star.delay,
                    animationDuration: '2s'
                  }}
                />
                <path
                  d={`M${star.cx},${star.cy - 1.5}L${star.cx + 0.3},${star.cy - 0.3}L${star.cx + 1.5},${star.cy}L${star.cx + 0.3},${star.cy + 0.3}L${star.cx},${star.cy + 1.5}L${star.cx - 0.3},${star.cy + 0.3}L${star.cx - 1.5},${star.cy}L${star.cx - 0.3},${star.cy - 0.3}Z`}
                  fill='currentColor'
                  className={cn(
                    'text-white transition-all duration-300',
                    'animate-pulse opacity-0'
                  )}
                  style={{
                    animationDelay: star.delay,
                    animationDuration: '3s',
                    opacity: Math.random() > 0.5 ? 0.8 : 0.3
                  }}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Floating Particles */}
      <div className='pointer-events-none absolute inset-0'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'absolute h-1 w-1 rounded-full transition-all duration-1000',
              isDark ? 'bg-purple-300' : 'bg-orange-300',
              isToggling ? 'animate-ping' : ''
            )}
            style={{
              left: `${20 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.2}s`,
              opacity: isToggling ? 1 : 0
            }}
          />
        ))}
      </div>

      {/* Ripple Effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl transition-all duration-300',
          'scale-0 bg-white/20 group-active:scale-100 group-active:opacity-30',
          'opacity-0'
        )}
      />
    </button>
  );
}
