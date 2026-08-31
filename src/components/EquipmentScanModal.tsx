import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Check, QrCode, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { EquipmentItem } from '../types';

interface EquipmentScanModalProps {
  isOpen: boolean;
  equipments: EquipmentItem[];
  onClose: () => void;
  onSelectEquipment: (equipment: EquipmentItem) => void;
}

export const EquipmentScanModal: React.FC<EquipmentScanModalProps> = ({
  isOpen,
  equipments,
  onClose,
  onSelectEquipment,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-camera-scanner-view';

  // Process decoded QR text or JSON
  const handleDecodedText = (decodedText: string) => {
    let targetCode = decodedText.trim();

    // If it's a JSON payload from EquipmentQRModal
    try {
      if (targetCode.startsWith('{') && targetCode.endsWith('}')) {
        const parsed = JSON.parse(targetCode);
        if (parsed.code) targetCode = parsed.code;
        else if (parsed.id) {
          const byId = equipments.find((e) => e.id === parsed.id);
          if (byId) {
            stopScanner();
            onSelectEquipment(byId);
            onClose();
            return;
          }
        }
      }
    } catch {
      // Continue with string matching
    }

    const query = targetCode.toLowerCase();
    const found = equipments.find(
      (eq) =>
        eq.code.toLowerCase() === query ||
        eq.name.toLowerCase().includes(query) ||
        (eq.serialNumber && eq.serialNumber.toLowerCase() === query) ||
        eq.id.toLowerCase() === query
    );

    if (found) {
      stopScanner();
      onSelectEquipment(found);
      onClose();
    } else {
      setErrorMsg(`QR lido: "${targetCode}", mas nenhum equipamento foi encontrado.`);
    }
  };

  const startScanner = async () => {
    setCameraError('');
    setErrorMsg('');
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Ignore transient frame scan misses
        }
      );

      setCameraActive(true);
      setIsScanning(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Erro ao abrir câmera para leitura de QR:', msg);
      setCameraError('Permissão da câmera negada ou dispositivo sem suporte. Digite o código abaixo.');
      setCameraActive(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        })
        .catch(() => {});
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Auto-start camera if available
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const query = manualCode.trim().toLowerCase();
    if (!query) return;

    const found = equipments.find(
      (eq) =>
        eq.code.toLowerCase() === query ||
        eq.name.toLowerCase().includes(query) ||
        (eq.serialNumber && eq.serialNumber.toLowerCase() === query)
    );

    if (found) {
      stopScanner();
      onSelectEquipment(found);
      onClose();
    } else {
      setErrorMsg(`Nenhum equipamento encontrado com "${manualCode}".`);
    }
  };

  const handleQuickSelect = (eq: EquipmentItem) => {
    stopScanner();
    onSelectEquipment(eq);
    onClose();
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Leitor de QR Code & Patrimônio</h3>
              <p className="text-[11px] text-slate-400">Aponte para a etiqueta colada no aparelho</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Camera Scanner Viewport */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center border-2 border-slate-700 text-center p-2 text-white">
            <div id={scannerContainerId} className="w-full h-full overflow-hidden rounded-xl" />

            {!cameraActive && (
              <div className="p-4 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 animate-pulse">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  {cameraError || 'Iniciando câmera traseira para leitura ótica...'}
                </p>
                {cameraError && (
                  <button
                    onClick={startScanner}
                    className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar Câmera Novamente</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Form for manual input */}
          <form onSubmit={handleManualSearch} className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Ou digite o Código / Nº de Série / Nome:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: EQ-AC-001, Som, Projetor..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </div>
            {errorMsg && <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg">{errorMsg}</p>}
          </form>

          {/* Quick suggestions list */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Equipamentos no Salão ({equipments.length})
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {equipments.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => handleQuickSelect(eq)}
                  className="w-full text-left p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 group-hover:text-blue-700">{eq.code}</span>
                    <span className="text-gray-600 ml-2 truncate inline-block max-w-[140px] align-bottom">
                      {eq.name}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {eq.location} • {eq.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                    Abrir
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
