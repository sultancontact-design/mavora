'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setRouterInstance } from '@/stores/navigation';

/**
 * Hook to initialize the Next.js router instance in the navigation store.
 * This should be called once in the root layout or a high-level component.
 */
export function useNavigationInit() {
  const router = useRouter();

  useEffect(() => {
    // Set the router instance for the navigation store
    setRouterInstance(router);
    
    // Cleanup on unmount (though this is unlikely to happen in practice)
    return () => {
      setRouterInstance(null as any);
    };
  }, [router]);
}

export default useNavigationInit;
