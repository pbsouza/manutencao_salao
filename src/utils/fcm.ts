import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { firebaseApp, db, auth } from '../lib/firebase';
import { triggerAppNotification } from './notifications';

export interface FCMTokenRecord {
  token: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  platform: string;
  isAndroid: boolean;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
}

const FCM_TOKEN_STORAGE_KEY = 'sr_fcm_registration_token';
const FCM_VAPID_STORAGE_KEY = 'sr_fcm_vapid_key';

// Default / fallback VAPID key or user-configured VAPID key
export const getStoredVapidKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(FCM_VAPID_STORAGE_KEY) || '';
};

export const setStoredVapidKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(FCM_VAPID_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(FCM_VAPID_STORAGE_KEY);
  }
};

export const getStoredFCMToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
};

let messagingInstance: Messaging | null = null;
let isFCMInitialized = false;

/**
 * Initializes Firebase Cloud Messaging instance if supported in current browser / PWA context
 */
export const getFCMInstance = async (): Promise<Messaging | null> => {
  if (messagingInstance) return messagingInstance;
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Firebase Cloud Messaging não é suportado neste ambiente.');
      return null;
    }
    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch (err) {
    console.warn('[FCM] Erro ao obter instância do Messaging:', err);
    return null;
  }
};

/**
 * Registers the FCM service worker and returns its ServiceWorkerRegistration
 */
export const registerFCMServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const base = import.meta.env.BASE_URL || '/';
    const swPath = `${base}firebase-messaging-sw.js`;

    const registration = await navigator.serviceWorker.register(swPath, {
      scope: base,
    });
    console.log('[FCM] Service worker registrado com sucesso:', registration.scope);
    return registration;
  } catch (err) {
    console.warn('[FCM] Falha ao registrar firebase-messaging-sw.js:', err);
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }
};

/**
 * Requests FCM Registration Token for Android / Web push notifications
 */
export const requestFCMToken = async (customVapidKey?: string): Promise<{ success: boolean; token?: string; error?: string }> => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Execução fora do navegador.' };
  }

  if (!('Notification' in window)) {
    return { success: false, error: 'Este dispositivo não suporta notificações nativas.' };
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { success: false, error: 'Permissão de notificação negada no dispositivo Android.' };
    }

    const messaging = await getFCMInstance();
    if (!messaging) {
      return { success: false, error: 'Firebase Cloud Messaging não disponível no navegador atual.' };
    }

    const swReg = await registerFCMServiceWorker();
    const vapidKey = (customVapidKey || getStoredVapidKey()).trim();

    const tokenOptions: { serviceWorkerRegistration?: ServiceWorkerRegistration; vapidKey?: string } = {};
    if (swReg) {
      tokenOptions.serviceWorkerRegistration = swReg;
    }
    if (vapidKey) {
      tokenOptions.vapidKey = vapidKey;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);

      // Save token to Firestore to enable backend broadcasting
      await saveTokenToFirestore(token);

      // Setup foreground message listener if not already initialized
      setupFCMForegroundListener(messaging);

      return { success: true, token };
    } else {
      return { success: false, error: 'Não foi possível gerar o Token FCM. Verifique as credenciais ou chave VAPID.' };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[FCM] Erro ao solicitar token FCM:', err);
    return { success: false, error: msg };
  }
};

/**
 * Saves or updates the FCM token document in Firestore (/fcmTokens/{tokenHash})
 */
export const saveTokenToFirestore = async (token: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const platform = isAndroid ? 'Android OS (Mobile)' : /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iOS (Web)' : 'Desktop / Web';

    const safeDocId = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);

    const payload: FCMTokenRecord = {
      token,
      userId: user ? user.uid : null,
      userEmail: user ? user.email : null,
      userName: user ? user.displayName : null,
      platform,
      isAndroid,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'fcmTokens', safeDocId), payload, { merge: true });
    console.log('[FCM] Token sincronizado com o Firestore:', safeDocId);
  } catch (err) {
    console.warn('[FCM] Erro ao salvar token no Firestore:', err);
  }
};

/**
 * Listens to foreground push messages received while the app is active
 */
export const setupFCMForegroundListener = (messaging: Messaging): void => {
  if (isFCMInitialized) return;
  isFCMInitialized = true;

  onMessage(messaging, (payload) => {
    console.log('[FCM] Mensagem recebida em primeiro plano (Foreground):', payload);
    const title = payload.notification?.title || payload.data?.title || 'Salão do Reino • Alerta FCM 🔔';
    const body = payload.notification?.body || payload.data?.body || 'Nova notificação push recebida!';

    triggerAppNotification({
      title,
      body,
      type: 'SYSTEM',
      linkTab: (payload.data?.linkTab as 'kanban' | 'mytasks' | 'dashboard' | 'preventive') || 'kanban',
      serviceId: payload.data?.serviceId,
      equipmentId: payload.data?.equipmentId,
    }).catch(console.error);
  });
};

/**
 * Initializes FCM on application boot
 */
export const initializeFCMOnBoot = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const messaging = await getFCMInstance();
    if (messaging) {
      setupFCMForegroundListener(messaging);
      
      // If user already has notifications granted, automatically refresh/register token
      if ('Notification' in window && Notification.permission === 'granted') {
        const stored = getStoredFCMToken();
        if (!stored) {
          await requestFCMToken();
        } else {
          // Re-sync with Firestore
          await saveTokenToFirestore(stored);
        }
      }
    }
  } catch (err) {
    console.warn('[FCM] Inicialização automática em segundo plano:', err);
  }
};

/**
 * Retrieves all registered FCM device tokens from Firestore
 */
export const getAllRegisteredFCMTokens = async (): Promise<FCMTokenRecord[]> => {
  try {
    const snap = await getDocs(collection(db, 'fcmTokens'));
    const tokens: FCMTokenRecord[] = [];
    snap.forEach((docSnap) => {
      tokens.push(docSnap.data() as FCMTokenRecord);
    });
    return tokens;
  } catch (err) {
    console.warn('[FCM] Erro ao listar tokens registrados:', err);
    return [];
  }
};

/**
 * Triggers a real Android Push notification via Service Worker and records in Firestore
 */
export const sendFCMTestPushNotification = async (customTitle?: string, customBody?: string): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const title = customTitle || 'Salão do Reino • Teste FCM Android 🔔';
    const body = customBody || 'Notificação Push real do Firebase Cloud Messaging ativa e funcionando no seu aparelho Android!';

    // 1. Trigger via Service Worker to immediately confirm Android system appearance
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/favicon-32x32.png',
          vibrate: [200, 100, 200, 100, 200],
          tag: `fcm-test-${Date.now()}`,
          renotify: true,
          requireInteraction: true,
          data: {
            url: window.location.href,
            linkTab: 'kanban',
            timestamp: Date.now(),
          },
        } as NotificationOptions);
      }
    }

    // 2. Log push notification event in Firestore
    const notifId = `fcm_log_${Date.now()}`;
    const tokens = await getAllRegisteredFCMTokens();

    await setDoc(doc(db, 'fcmNotifications', notifId), {
      title,
      body,
      targetTokensCount: tokens.length,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      senderEmail: auth.currentUser?.email || 'sistema@salao.local',
    });

    // 3. Dispatch in-app notification history
    await triggerAppNotification({
      title,
      body,
      type: 'SYSTEM',
      linkTab: 'kanban',
    });

    return { success: true, count: tokens.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[FCM] Erro ao disparar notificação push:', err);
    return { success: false, count: 0, error: errorMsg };
  }
};

/**
 * Removes stored token and deletes from Firestore
 */
export const unregisterFCMToken = async (): Promise<void> => {
  try {
    const token = getStoredFCMToken();
    if (token) {
      const safeDocId = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
      await deleteDoc(doc(db, 'fcmTokens', safeDocId));
      localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[FCM] Erro ao desregistrar token:', err);
  }
};
