import React, { useState } from 'react';
import { Camera, CameraOff, Check, QrCode, Search, Sparkles, X } from 'lucide-react';
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
  const [isCameraActive, setIsCameraActive] = useState(false);

  if (!isOpen) return null;

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const query = manualCode.trim().toLowerCase();
    if (!query) return;

    // Try finding by exact code or partial code/name/serial
    const found = equipments.find(
      (eq) =>
        eq.code.toLowerCase() === query ||
        eq.name.toLowerCase().includes(query) ||
        (eq.serialNumber && eq.serialNumber.toLowerCase() === query)
    );

    if (found) {
      onSelectEquipment(found);
      onClose();
    } else {
      setErrorMsg(`Nenhum equipamento encontrado com o código ou nome "${manualCode}".`);
    }
  };

  const handleQuickSelect = (eq: EquipmentItem) => {
    onSelectEquipment(eq);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Leitor de QR Code & Patrimônio</h3>
              <p className="text-[11px] text-slate-400">Identifique o aparelho instantaneamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Camera Scanner Mock / Simulation Box */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-700 text-center p-4 text-white">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 animate-pulse">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200">Aponte a câmera para a etiqueta QR do aparelho</p>
            <p className="text-[10px] text-slate-400 max-w-xs mt-1">
              O leitor óptico reconhece o código do patrimônio e abre a ficha de histórico imediatamente.
            </p>

            {/* Corner Scan Marks */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>
          </div>

          {/* Form for manual input */}
          <form onSubmit={handleManualSearch} className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">Ou digite o Código / Nº de Série do Equipamento:</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: EQ-AC-01, EQ-SOM-01..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </div>
            {errorMsg && <p className="text-xs text-red-600 font-medium">{errorMsg}</p>}
          </form>

          {/* Quick suggestions from list */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Equipamentos Cadastrados</p>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {equipments.slice(0, 6).map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => handleQuickSelect(eq)}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div>
                    <span className="font-bold text-slate-900 group-hover:text-blue-700">{eq.code}</span>
                    <span className="text-gray-600 ml-2">{eq.name}</span>
                    <span className="text-[10px] text-gray-400 block">{eq.location} • {eq.category}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md group-hover:bg-blue-600 group-hover:text-white transition">
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
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
