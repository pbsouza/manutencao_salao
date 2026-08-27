import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, QrCode, X } from 'lucide-react';
import { EquipmentItem } from '../types';

interface EquipmentQRModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
}

export const EquipmentQRModal: React.FC<EquipmentQRModalProps> = ({ equipment, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!equipment) return;
    const payload = JSON.stringify({
      code: equipment.code,
      name: equipment.name,
      category: equipment.category,
      location: equipment.location,
      id: equipment.id,
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR code:', err));
  }, [equipment]);

  if (!equipment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `etiqueta-qr-${equipment.code}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Etiqueta de Patrimônio</h3>
              <p className="text-[11px] text-slate-400">{equipment.code} • {equipment.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Preview Box */}
        <div className="p-6 flex flex-col items-center justify-center bg-gray-100">
          <div
            id="printable-equipment-label"
            className="bg-white p-5 rounded-xl border-2 border-dashed border-gray-300 shadow-md w-full max-w-xs text-center flex flex-col items-center"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
              Salão do Reino • Patrimônio
            </div>

            <h4 className="font-black text-slate-900 text-sm mt-1">{equipment.code}</h4>
            <p className="text-xs font-semibold text-gray-700 leading-tight mt-0.5">{equipment.name}</p>

            {/* QR Code image */}
            <div className="my-3 p-2 bg-white rounded-lg border border-gray-200 shadow-xs">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Code ${equipment.code}`} className="w-44 h-44 object-contain mx-auto" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-gray-400 text-xs">Gerando QR Code...</div>
              )}
            </div>

            {/* Meta details */}
            <div className="w-full text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-left space-y-0.5">
              <p><strong>Categoria:</strong> {equipment.category}</p>
              <p><strong>Local:</strong> {equipment.location}</p>
              {equipment.voltage && <p><strong>Voltagem:</strong> {equipment.voltage}</p>}
              {equipment.brand && <p><strong>Marca:</strong> {equipment.brand} {equipment.model}</p>}
              {equipment.serialNumber && <p><strong>Nº Série:</strong> {equipment.serialNumber}</p>}
            </div>

            <p className="text-[9px] text-gray-400 mt-2">
              Aponte a câmera do aplicativo para abrir a ficha de manutenção
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PNG</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
