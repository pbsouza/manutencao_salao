import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Info,
  ShieldAlert,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Smartphone,
  Copy,
  RefreshCw,
  Send,
  Key,
  Flame,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { AppNotification } from '../types';
import {
  getStoredFCMToken,
  requestFCMToken,
  getStoredVapidKey,
  setStoredVapidKey,
  sendFCMTestPushNotification,
  getAllRegisteredFCMTokens,
  type FCMTokenRecord,
} from '../utils/fcm';

interface NotificationCenterModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    notifications,
    unreadNotificationsCount,
    notificationSettings,
    updateNotificationSettings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    sendTestNotification,
    requestPushPermission,
    setActiveTab,
    selectService,
    services,
  } = useMaintenance();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isNotificationCenterOpen;
  const onClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setIsNotificationCenterOpen(false);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'fcm' | 'settings'>('notifications');
  const [testSuccess, setTestSuccess] = useState(false);
  const [fcmTestSuccess, setFcmTestSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isGeneratingFCM, setIsGeneratingFCM] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(() => getStoredFCMToken());
  const [vapidKey, setVapidKey] = useState<string>(() => getStoredVapidKey());
  const [fcmError, setFcmError] = useState<string | null>(null);
  const [registeredTokens, setRegisteredTokens] = useState<FCMTokenRecord[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (isOpen) {
      setFcmToken(getStoredFCMToken());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
      getAllRegisteredFCMTokens()
        .then(setRegisteredTokens)
        .catch(console.warn);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestPushPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
    if (granted) {
      updateNotificationSettings({ enablePush: true });
      handleGenerateFCMToken();
    }
    return granted;
  };

  const handleGenerateFCMToken = async () => {
    setIsGeneratingFCM(true);
    setFcmError(null);
    try {
      const res = await requestFCMToken(vapidKey);
      if (res.success && res.token) {
        setFcmToken(res.token);
        const list = await getAllRegisteredFCMTokens();
        setRegisteredTokens(list);
      } else if (res.error) {
        setFcmError(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFcmError(msg);
    } finally {
      setIsGeneratingFCM(false);
    }
  };

  const handleSaveVapidKey = (newKey: string) => {
    setVapidKey(newKey);
    setStoredVapidKey(newKey);
  };

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleSendFCMTest = async () => {
    setIsGeneratingFCM(true);
    setFcmError(null);
    try {
      const res = await sendFCMTestPushNotification(
        'Salão do Reino • Teste Push FCM Android 🔔',
        'Notificação Push real do Firebase Cloud Messaging recebida com sucesso no seu dispositivo Android!'
      );
      if (res.success) {
        setFcmTestSuccess(true);
        setTimeout(() => setFcmTestSuccess(false), 4000);
      } else {
        setFcmError(res.error || 'Falha ao disparar push');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFcmError(msg);
    } finally {
      setIsGeneratingFCM(false);
    }
  };

  const handleSendTest = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      await handleRequestPermission();
    }
    await sendTestNotification();
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 3500);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.serviceId) {
      const found = services.find((s) => s.id === notif.serviceId);
      if (found) {
        selectService(found);
      }
    }
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
    }
    onClose();
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'GUT_ALERT':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'ASSIGNMENT':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'PREVENTIVE':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'DUE_DATE':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-emerald-500" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
      if (diffMin < 1) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Central de Notificações & FCM</h3>
              <p className="text-xs text-slate-400">Firebase Cloud Messaging • Alertas Android e PWA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notificações</span>
            {unreadNotificationsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('fcm')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'fcm'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Push Real FCM (Android)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preferências</span>
          </button>

          {activeSubTab === 'notifications' && notifications.length > 0 && (
            <div className="ml-auto flex items-center gap-2 pb-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Ler todas</span>
              </button>
              <button
                onClick={clearNotifications}
                className="text-[11px] text-gray-400 hover:text-red-600 font-medium flex items-center gap-1 cursor-pointer"
                title="Limpar histórico"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {activeSubTab === 'notifications' ? (
            <div>
              {/* Permission Banner if not granted */}
              {permissionStatus !== 'granted' && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-blue-900">Ativar Notificações no Dispositivo</p>
                    <p className="text-blue-700 mt-0.5">
                      Receba avisos imediatos no celular ou desktop sobre manutenções urgentes e preventivas.
                    </p>
                    <button
                      onClick={handleRequestPermission}
                      className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      Permitir Notificações Web Push
                    </button>
                  </div>
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-300">
                    <BellOff className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Nenhuma notificação no momento</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Você será avisado quando novas manutenções forem cadastradas ou quando houver tarefas de alta prioridade.
                  </p>
                  <button
                    onClick={handleSendTest}
                    className={`mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs ${
                      testSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {testSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Notificação Disparada! 🔔</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                        <span>Disparar Notificação de Teste</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 relative ${
                        notif.read
                          ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          : 'bg-blue-50/70 border-blue-200 text-gray-900 font-medium hover:bg-blue-100/60 shadow-xs'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white shadow-xs border border-gray-100">
                        {getNotifIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold truncate text-gray-900">{notif.title}</h4>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTime(notif.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">{notif.body}</p>

                        {(notif.linkTab || notif.serviceId) && (
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <span>Ver detalhes</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-4 right-3"></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeSubTab === 'fcm' ? (
            /* FCM Dedicated Configuration & Diagnostics */
            <div className="space-y-4 text-xs">
              {/* Header Status Card */}
              <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border border-orange-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Firebase Cloud Messaging (FCM)</h4>
                      <p className="text-[11px] text-gray-600">Envio de push direto para o SO Android do celular</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
                      fcmToken
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {fcmToken ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>FCM Ativo</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Token Pendente</span>
                      </>
                    )}
                  </span>
                </div>

                {fcmError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Aviso FCM:</p>
                      <p className="break-words">{fcmError}</p>
                    </div>
                  </div>
                )}

                {/* Token Box */}
                {fcmToken ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                        <span>Token de Registro FCM do Dispositivo:</span>
                      </span>
                      <button
                        onClick={handleCopyToken}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Token</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2.5 bg-white border border-orange-200 rounded-lg font-mono text-[10px] text-gray-700 break-all select-all max-h-20 overflow-y-auto leading-relaxed shadow-xs">
                      {fcmToken}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-600 bg-white/80 p-3 rounded-lg border border-orange-200/80">
                    <p>
                      Gere o token FCM deste aparelho para registrar seu smartphone Android no banco de dados Firestore e receber notificações push remotas.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleGenerateFCMToken}
                    disabled={isGeneratingFCM}
                    className="flex-1 py-2 px-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingFCM ? 'animate-spin' : ''}`} />
                    <span>{fcmToken ? 'Renovar / Sincronizar Token' : 'Gerar Token FCM no Android'}</span>
                  </button>

                  <button
                    onClick={handleSendFCMTest}
                    disabled={isGeneratingFCM}
                    className={`py-2 px-3 font-bold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 text-white ${
                      fcmTestSuccess ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    {fcmTestSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Push Enviado! 📱</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Testar Push Real</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* VAPID Public Key Setting (Optional) */}
              <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-700" />
                  <h4 className="font-bold text-gray-900">Chave VAPID Web Push (Par de Chaves do FCM)</h4>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Disponível no Firebase Console &gt; Configurações do Projeto &gt; Cloud Messaging &gt; Web Push Certificates.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vapidKey}
                    onChange={(e) => handleSaveVapidKey(e.target.value)}
                    placeholder="Cole a chave pública VAPID (ex: BN8x...)"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-[11px] focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  {vapidKey && (
                    <button
                      onClick={() => handleSaveVapidKey('')}
                      className="px-2.5 py-1 text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Registered Devices in Firestore */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Aparelhos Registrados na Coleção `fcmTokens`</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                    {registeredTokens.length} dispositivo(s)
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Tokens salvos no Firestore que receberão push notifications quando houver chamados urgentes.
                </p>

                {registeredTokens.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {registeredTokens.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-[11px]"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-gray-800 truncate">
                            {t.platform} {t.isAndroid ? '🤖' : '🌐'}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {t.userEmail || 'Usuário Local'} • {new Date(t.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="font-mono text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {t.token.substring(0, 10)}...
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">Nenhum aparelho registrado ainda. Clique em "Gerar Token FCM no Android" acima.</p>
                )}
              </div>

              {/* Backend Integration Code Snippet */}
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Como disparar do seu Backend (Node.js / Firebase Admin):</span>
                </div>
                <pre className="text-[10px] font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto leading-relaxed">
{`// Envio via Firebase Admin SDK
admin.messaging().send({
  token: '${fcmToken ? fcmToken.substring(0, 20) + '...' : 'TOKEN_FCM_DO_ANDROID'}',
  notification: {
    title: 'Urgente: Reparo no Salão do Reino 🛠️',
    body: 'GUT Alta detectada no Ar-Condicionado.'
  },
  data: { linkTab: 'kanban', serviceId: '123' },
  android: { priority: 'high' }
});`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Native Push Status on Android / Device */}
              <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📱</span>
                      <h4 className="font-bold text-gray-900">Notificações no Aparelho (Android / PWA)</h4>
                    </div>
                    <p className="text-gray-600 text-[11px] mt-0.5 leading-snug">
                      Exibe alertas com som, vibração e banner na barra de status do seu celular Android.
                    </p>
                  </div>
                  <div className="shrink-0">
                    {permissionStatus !== 'granted' ? (
                      <button
                        onClick={handleRequestPermission}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Permitir no Android</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ativo no Aparelho</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200/60 text-[11px] text-gray-600 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dica para Android:</strong> Instale o app na tela inicial através do menu do Chrome/Samsung Internet ("Instalar aplicativo" ou "Adicionar à tela de início") para receber alertas em tela cheia e barra de notificações do sistema.
                  </span>
                </div>
              </div>

              {/* Preferences list */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">Preferências de Alerta</h4>

                <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      {notificationSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Sinal Sonoro & Vibração</p>
                      <p className="text-[11px] text-gray-500">Tocar som harmônico ao receber novos avisos</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) => updateNotificationSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Alertas de Novos Problemas</p>
                      <p className="text-[11px] text-gray-500">Notificar imediatamente quando novos problemas forem cadastrados no Salão</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.alertNewProblems ?? true}
                    onChange={(e) => updateNotificationSettings({ alertNewProblems: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Alertas de Gravidade / GUT Alta</p>
                      <p className="text-[11px] text-gray-500">Notificar quando surgir serviço com GUT &gt; 15 ou Risco A</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.alertHighGUT}
                    onChange={(e) => updateNotificationSettings({ alertHighGUT: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Atribuições e Tarefas</p>
                      <p className="text-[11px] text-gray-500">Notificar quando uma tarefa for atribuída ao seu nome</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.alertAssignments}
                    onChange={(e) => updateNotificationSettings({ alertAssignments: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Programa de Manutenção Preventiva</p>
                      <p className="text-[11px] text-gray-500">Alertas das Fichas de Trabalho (Pré-Celebração e Pós-Congresso)</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.alertPreventiveProgram}
                    onChange={(e) => updateNotificationSettings({ alertPreventiveProgram: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Test Button */}
              <div className="pt-2">
                <button
                  onClick={handleSendTest}
                  className={`w-full py-2.5 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                    testSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {testSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Notificação Enviada com Sucesso! 🔔</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-4 h-4" />
                      <span>Enviar Notificação de Teste Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            onClick={activeSubTab === 'fcm' ? handleSendFCMTest : handleSendTest}
            className={`px-3.5 py-1.5 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              (activeSubTab === 'fcm' ? fcmTestSuccess : testSuccess)
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {(activeSubTab === 'fcm' ? fcmTestSuccess : testSuccess) ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enviado! 🔔</span>
              </>
            ) : (
              <>
                <BellRing className="w-3.5 h-3.5" />
                <span>Testar Notificação Agora</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
