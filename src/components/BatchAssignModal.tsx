import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { ServiceStatus } from '../types';

export const BatchAssignModal: React.FC = () => {
  const {
    isBatchAssignModalOpen,
    closeBatchAssignModal,
    batchAssignTargetIds,
    services,
    members,
    batchAssignServices,
  } = useMaintenance();

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(batchAssignTargetIds);
  const [executorName, setExecutorName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [newStatus, setNewStatus] = useState<ServiceStatus | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (batchAssignTargetIds.length > 0) {
      setSelectedServiceIds(batchAssignTargetIds);
    } else {
      setSelectedServiceIds([]);
    }
  }, [batchAssignTargetIds, isBatchAssignModalOpen]);

  if (!isBatchAssignModalOpen) return null;

  const toggleSelectService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((s) => s !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedServiceIds.length === services.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(services.map((s) => s.id));
    }
  };

  const handleBatchAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceIds.length === 0) return;

    setIsSubmitting(true);
    const matchedSupervisor = members.find((m) => m.name === supervisorName);

    await batchAssignServices({
      serviceIds: selectedServiceIds,
      executorName: executorName || undefined,
      supervisorName: supervisorName || undefined,
      supervisorId: matchedSupervisor?.id || undefined,
      status: (newStatus as ServiceStatus) || undefined,
      dueDate: dueDate || undefined,
    });

    setIsSubmitting(false);
    setSuccessMsg(`${selectedServiceIds.length} serviços atualizados com sucesso!`);
    setTimeout(() => {
      setSuccessMsg(null);
      closeBatchAssignModal();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="batch-assign-modal-dialog"
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-xs">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Designação & Atualização em Massa
              </h3>
              <p className="text-[11px] text-indigo-100">
                Atribua múltiplos problemas simultaneamente para um Executor ou Supervisor
              </p>
            </div>
          </div>

          <button
            onClick={closeBatchAssignModal}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleBatchAssign} className="p-5 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Options */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <span className="text-xs font-bold text-gray-900 block border-b border-gray-200 pb-1.5">
              Definir Responsáveis e Parâmetros:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Executor */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Designar Executor (Quem Realiza)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <select
                    value={executorName}
                    onChange={(e) => setExecutorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="">Manter executor atual</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supervisor */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Designar Supervisor (Quem Acompanha)
                </label>
                <div className="relative">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <select
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="">Manter supervisor atual</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* New Status */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Alterar Status Operacional
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ServiceStatus)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                >
                  <option value="">Manter status atual</option>
                  <option value="NOVOS PROBLEMAS">NOVOS PROBLEMAS</option>
                  <option value="A AVALIAR">A AVALIAR</option>
                  <option value="PLANEJADO">PLANEJADO</option>
                  <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                  <option value="AGUARDANDO MATERIAL">AGUARDANDO MATERIAL</option>
                  <option value="AGUARDANDO TERCEIRO">AGUARDANDO TERCEIRO</option>
                  <option value="CONCLUÍDO">CONCLUÍDO</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nova Data Limite
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Selection List of Services */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-services-bulk"
                  checked={selectedServiceIds.length > 0 && selectedServiceIds.length === services.length}
                  onChange={selectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="select-all-services-bulk" className="cursor-pointer font-bold">
                  Selecionar Todos ({services.length})
                </label>
              </div>

              <span className="font-bold text-indigo-700">
                {selectedServiceIds.length} selecionados
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
              {services.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum serviço cadastrado.</p>
              ) : (
                services.map((item) => {
                  const isChecked = selectedServiceIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelectService(item.id)}
                      className={`p-2 rounded border flex items-center justify-between cursor-pointer transition text-xs ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300'
                          : 'bg-white border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container
                          className="rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0"
                        />
                        <span className="font-mono text-[10px] text-gray-500 font-bold">{item.code}</span>
                        <span className="font-bold text-gray-900 truncate">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-gray-500 shrink-0">
                        <span>{item.category}</span>
                        <span className="px-1.5 py-0.2 bg-gray-100 rounded text-gray-700 font-bold border border-gray-200">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={closeBatchAssignModal}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={selectedServiceIds.length === 0 || isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Aplicando...'
                  : `Aplicar a ${selectedServiceIds.length} Serviços`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
