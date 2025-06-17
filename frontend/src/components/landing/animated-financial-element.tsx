'use client';
import React, { useRef, useLayoutEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface AnimatedFinancialElementProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  scale?: number;
  blur?: number;
  duration?: number;
  staggerAmount?: number;
  as?: React.ElementType;
}

export const AnimatedFinancialElement: React.FC<AnimatedFinancialElementProps> = ({
  children,
  delay = 0,
  className = '',
  y = 30,
  scale = 1,
  blur = 0,
  duration = 0.8,
  staggerAmount = 0,
  as: Component = 'div',
  ...rest
}) => {
  const elRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (el) {
      const targets = staggerAmount > 0 && el.children.length > 0 ? Array.from(el.children) : el;

      gsap.fromTo(
        targets,
        { opacity: 0, y: y, scale: scale, filter: `blur(${blur}px)` },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: duration,
          delay: delay,
          stagger: staggerAmount,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }, [delay, y, scale, blur, duration, staggerAmount]);

  return (
    <Component ref={elRef} className={cn(className)} {...rest}>
      {children}
    </Component>
  );
};
