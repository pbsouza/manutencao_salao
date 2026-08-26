import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  HelpCircle,
  Info,
  Layers,
  Monitor,
  Share,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../pwa';

export const PWAInstallBanner: React.FC = () => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installResult, setInstallResult] = useState<string | null>(null);

  // If already installed or dismissed, do not show floating banner
  if (isInstalled || dismissed) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (canInstall) {
      const res = await promptInstall();
      if (res === 'accepted') {
        setInstallResult('Instalação aceita com sucesso!');
        setTimeout(() => setInstallResult(null), 4000);
      }
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <div
        id="pwa-install-toast"
        className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-full bg-slate-900/95 text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3"
      >
        {/* App Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md border border-blue-400/40 overflow-hidden">
          <img
            src={`${import.meta.env.BASE_URL}icon-192.png`}
            alt="Logo"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Instalar Manutenção SR</span>
              <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-bold uppercase">
                PWA
              </span>
            </h4>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
              title="Dispensar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
            Instale no seu celular ou computador para acesso rápido direto da tela inicial com suporte offline.
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{canInstall ? 'Instalar Aplicativo' : isIOS ? 'Como Instalar no iPhone' : 'Instalar no Chrome'}</span>
            </button>

            <button
              onClick={() => setDismissed(true)}
              className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              Depois
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal for iOS or manual Chrome install */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}icon-192.png`}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Instalar como App no Celular ou Computador
                  </h3>
                  <p className="text-xs text-slate-500">
                    Siga as instruções rápidas abaixo:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              {/* Chrome / Android / PC */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>No Google Chrome (Android / PC / Mac):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                  <li>Toque no menu de <strong>três pontos (⋮)</strong> no canto superior direito do Chrome.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme em <strong>"Instalar"</strong> para ter o app com ícone próprio na sua tela inicial.</li>
                </ol>
              </div>

              {/* iOS / Safari */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Share className="w-4 h-4 text-blue-600" />
                  <span>No Safari (iPhone / iPad):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</li>
                  <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
