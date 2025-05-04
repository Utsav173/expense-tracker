import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const DEBOUNCE_DELAY = 250;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const controller = new AbortController();
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, DEBOUNCE_DELAY);
    };

    const onChange = () => {
      setIsMobile(mql.matches);
    };

    const onResize = () => {
      debouncedUpdate();
    };

    setIsMobile(mql.matches);

    mql.addEventListener('change', onChange, { signal: controller.signal });
    window.addEventListener('resize', onResize, { signal: controller.signal });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return isMobile;
}
