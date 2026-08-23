import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, HardHat, ShieldCheck, X } from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { ServiceItem } from '../types';

interface SafetyConfirmationModalContentProps {
  service: ServiceItem;
  onClose: () => void;
}

const SafetyConfirmationModalContent: React.FC<SafetyConfirmationModalContentProps> = ({
  service,
  onClose,
}) => {
  const { confirmSafetyAndStart, currentUser } = useMaintenance();

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);
  const [check4, setCheck4] = useState(false);

  const allChecked = check1 && check2 && check3 && check4;

  const handleConfirm = () => {
    if (!allChecked) {
      alert('Por favor, confirme todos os 4 itens de segurança para prosseguir.');
      return;
    }
    confirmSafetyAndStart(service.id);
  };

  return (
    <div className="fixed inset-0 z-60 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-safety-checklist"
        className="bg-white border border-gray-200 rounded-lg w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with warning */}
        <div className="p-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded border border-amber-300">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 tracking-tight">
                Validação Obrigatória de Segurança
              </h3>
              <p className="text-[11px] text-amber-800 font-medium">Trabalho de Alto Risco identificado</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-amber-100/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 space-y-3.5">
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">Serviço:</span>
            <h4 className="text-xs font-bold text-gray-900">{service.title}</h4>
            <span className="text-[11px] text-blue-700 font-medium">
              {service.category} • Responsável: {service.responsibleName}
            </span>
          </div>

          <p className="text-[11px] text-gray-600">
            Para mover este serviço para <strong>"EM ANDAMENTO"</strong>, confirme que as seguintes normas de segurança e EPIs foram cumpridas pelos voluntários:
          </p>

          {/* Checklist Items */}
          <div className="space-y-2">
            <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100/70 rounded border border-gray-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={check1}
                onChange={(e) => setCheck1(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-gray-700 leading-tight">
                <strong className="text-gray-900">Uso de EPIs adequados:</strong> Capacete com jugular, luvas de proteção, botas com biqueira e óculos de segurança.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100/70 rounded border border-gray-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={check2}
                onChange={(e) => setCheck2(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-gray-700 leading-tight">
                <strong className="text-gray-900">Trabalho em Dupla:</strong> Trabalho realizado no mínimo por 2 irmãos qualificados (um observador no solo o tempo todo).
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100/70 rounded border border-gray-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={check3}
                onChange={(e) => setCheck3(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-gray-700 leading-tight">
                <strong className="text-gray-900">Isolamento da Área:</strong> Fita zebrada/cones instalados impedindo a passagem de pessoas sob o local da manutenção.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100/70 rounded border border-gray-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={check4}
                onChange={(e) => setCheck4(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-gray-700 leading-tight">
                <strong className="text-gray-900">Desenergização / Bloqueio:</strong> Disjuntores elétricos desligados e travados antes de qualquer intervenção em fiações.
              </span>
            </label>
          </div>

          <div className="text-[10px] text-gray-500 bg-gray-100 p-2 rounded flex items-center justify-between font-medium">
            <span>Validador: {currentUser.name} ({currentUser.role})</span>
            <span>{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!allChecked}
            onClick={handleConfirm}
            className={`px-4 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              allChecked
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validar e Iniciar Serviço</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SafetyConfirmationModal: React.FC = () => {
  const { safetyModalService, closeSafetyModal } = useMaintenance();

  if (!safetyModalService) return null;

  return (
    <SafetyConfirmationModalContent
      key={safetyModalService.id}
      service={safetyModalService}
      onClose={closeSafetyModal}
    />
  );
};
