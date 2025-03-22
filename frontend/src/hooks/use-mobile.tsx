import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const DEBOUNCE_DELAY = 250;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const controller = new AbortController();
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Debounced update function
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, DEBOUNCE_DELAY);
    };

    // Handle media query changes
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Handle resize events
    const onResize = () => {
      debouncedUpdate();
    };

    // Set initial value
    setIsMobile(mql.matches);

    // Add event listeners
    mql.addEventListener('change', onChange, { signal: controller.signal });
    window.addEventListener('resize', onResize, { signal: controller.signal });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return isMobile;
}
