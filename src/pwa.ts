import { useEffect, useState } from 'react';

// Interface for BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Use relative sw.js URL based on current page path for GitHub Pages / subpaths
      const swUrl = new URL('sw.js', window.location.href).href;

      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          // Check for updates periodically
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nova versão do PWA disponível.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('Erro ao registrar Service Worker do PWA:', err);
        });
    });

    // Capture beforeinstallprompt event for Chrome / Edge / Android
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      installListeners.forEach((listener) => listener(true));
    });

    // Capture appinstalled event
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      installListeners.forEach((listener) => listener(false));
      console.log('PWA instalado com sucesso!');
    });
  }
}

export function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!deferredInstallPrompt) {
    return 'unsupported';
  }

  try {
    await deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      deferredInstallPrompt = null;
      installListeners.forEach((listener) => listener(false));
    }
    return choiceResult.outcome;
  } catch (err) {
    console.error('Erro ao acionar prompt de instalação do PWA:', err);
    return 'unsupported';
  }
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(Boolean(deferredInstallPrompt));
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    setIsInstalled(isPWAStandalone());
    setIsIOS(isIOSDevice());
    setCanInstall(Boolean(deferredInstallPrompt));

    const listener = (installable: boolean) => {
      setCanInstall(installable);
      setIsInstalled(isPWAStandalone());
    };

    installListeners.add(listener);
    return () => {
      installListeners.delete(listener);
    };
  }, []);

  return {
    canInstall,
    isInstalled,
    isIOS,
    promptInstall: promptPWAInstall,
  };
}
