'use client';

/**
 * PWA Registration Component
 * Registers the service worker and handles PWA updates
 * 
 * @components/PWARegistrar
 */

import { useEffect, useState } from 'react';

interface PWAStatus {
  isSupported: boolean;
  isRegistered: boolean;
  hasUpdate: boolean;
  isOffline: boolean;
  installPrompt: any | null;
}

export default function PWARegistrar() {
  const [status, setStatus] = useState<PWAStatus>({
    isSupported: false,
    isRegistered: false,
    hasUpdate: false,
    isOffline: !navigator.onLine,
    installPrompt: null,
  });

  useEffect(() => {
    // Check if PWA is supported
    const isSupported = 'serviceWorker' in navigator;
    
    setStatus(prev => ({
      ...prev,
      isSupported,
    }));

    if (!isSupported) {
      console.log('[PWA] Service workers not supported');
      return;
    }

    // Register service worker
    async function registerSW() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service worker registered:', registration.scope);

        setStatus(prev => ({
          ...prev,
          isRegistered: true,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available');
                setStatus(prev => ({
                  ...prev,
                  hasUpdate: true,
                }));
              }
            });
          }
        });

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    }

    registerSW();

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOffline: false }));
      console.log('[PWA] Back online');
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOffline: true }));
      console.log('[PWA] Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt (for "Add to Home Screen")
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setStatus(prev => ({
        ...prev,
        installPrompt: e,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle update
  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
    }
    
    window.location.reload();
  };

  // Handle install
  const handleInstall = async () => {
    if (!status.installPrompt) return;

    status.installPrompt.prompt();
    const { outcome } = await status.installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] App installed');
    }
    
    setStatus(prev => ({
      ...prev,
      installPrompt: null,
    }));
  };

  // This component doesn't render anything visible by default
  // It can be extended to show update/install prompts
  
  return null;
  
  /* 
  // Uncomment to show UI elements:
  return (
    <>
      {status.hasUpdate && (
        <button onClick={handleUpdate}>
          تحديث التطبيق
        </button>
      )}
      
      {status.installPrompt && (
        <button onClick={handleInstall}>
          تثبيت التطبيق
        </button>
      )}
      
      {status.isOffline && (
        <div>أنت غير متصل</div>
      )}
    </>
  );
  */
}
