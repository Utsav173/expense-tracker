import { useLayoutEffect, useState } from 'react';

export function useHasScrollbar(
  direction: 'vertical' | 'horizontal' = 'vertical',
  className: string = 'has-scrollbar'
) {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useLayoutEffect(() => {
    const el = document.documentElement;

    const checkScrollbar = () => {
      const condition =
        direction === 'vertical'
          ? el.scrollHeight > el.clientHeight
          : el.scrollWidth > el.clientWidth;

      setHasScrollbar(condition);

      if (condition) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    };

    checkScrollbar();

    // Observe resizing of document body
    const resizeObserver = new ResizeObserver(checkScrollbar);
    resizeObserver.observe(document.body);

    window.addEventListener('resize', checkScrollbar);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScrollbar);
      el.classList.remove(className);
    };
  }, [direction, className]);

  return hasScrollbar;
}
