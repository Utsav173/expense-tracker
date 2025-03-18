import { useEffect, useState } from 'react';
import { isAuthorized } from '../auth';

export function useIsAuthorized(cb?: () => void, isError?: boolean) {
  const [authorized, setAuthorized] = useState<boolean | undefined>();

  useEffect(() => {
    async function auth() {
      const result = await isAuthorized();
      setAuthorized(result);
    }
    auth();
    if (authorized && typeof cb === 'function') {
      cb();
    }
  }, [isError, authorized]);

  return authorized;
}
