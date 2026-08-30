import { AppNotification, NotificationSettings } from '../types';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enablePush: true,
  alertNewProblems: true,
  alertHighGUT: true,
  alertAssignments: true,
  alertDueDate: true,
  alertPreventiveProgram: true,
  soundEnabled: true,
};

const SETTINGS_KEY = 'sr_notification_settings_v1';
const HISTORY_KEY = 'sr_notification_history_v1';

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore error
  }
};

export const getNotificationHistory = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveNotificationHistory = (history: AppNotification[]) => {
  try {
    // Keep max 50 recent notifications
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // Ignore error
  }
};

// Play a pleasant chime using the Web Audio API
export const playNotificationSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic bell chime: 523.25 Hz (C5) and 659.25 Hz (E5) and 783.99 Hz (G5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now);
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // Silent fail if AudioContext is not permitted
  }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
};

export const triggerAppNotification = async (
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): Promise<AppNotification> => {
  const settings = getNotificationSettings();
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // 1. Save to in-app history
  const history = getNotificationHistory();
  const updatedHistory = [newNotif, ...history];
  saveNotificationHistory(updatedHistory);

  // 2. Play sound if enabled
  if (settings.soundEnabled) {
    playNotificationSound();
  }

  // 3. Dispatch in-app window event so Toast UI component immediately appears
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('sr-notification-event', {
          detail: newNotif,
        })
      );
    } catch {
      // ignore
    }
  }

  // 4. Trigger Browser Web Notification if allowed
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted' &&
    settings.enablePush
  ) {
    try {
      const base = import.meta.env.BASE_URL || '/';
      const iconUrl = `${base}icon-192.png`;

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(newNotif.title, {
          body: newNotif.body,
          icon: iconUrl,
          badge: `${base}favicon-32x32.png`,
          vibrate: [200, 100, 200],
          tag: newNotif.id,
          data: {
            linkTab: newNotif.linkTab,
            serviceId: newNotif.serviceId,
            equipmentId: newNotif.equipmentId,
          },
        } as unknown as NotificationOptions);
      } else {
        new Notification(newNotif.title, {
          body: newNotif.body,
          icon: iconUrl,
        });
      }
    } catch (err) {
      console.warn('Erro ao disparar notificação push nativa:', err);
    }
  }

  return newNotif;
};
