import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Edit,
  ExternalLink,
  Plus,
  Printer,
  QrCode,
  Sparkles,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { EquipmentItem, EquipmentMaintenanceLog } from '../types';

interface EquipmentDetailModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
  onEdit: (equipment: EquipmentItem) => void;
  onOpenQR: (equipment: EquipmentItem) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  onClose,
  onEdit,
  onOpenQR,
}) => {
  const {
    services,
    selectService,
    openNewServiceModal,
    addEquipmentMaintenanceLog,
    deleteEquipment,
    currentUser,
    hasRestrictedAccess,
  } = useMaintenance();

  const [isAddingLog, setIsAddingLog] = useState(false);
  const [logType, setLogType] = useState<EquipmentMaintenanceLog['type']>('PREVENTIVA');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logDescription, setLogDescription] = useState('');
  const [logCost, setLogCost] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  if (!equipment) return null;

  const linkedServices = services.filter(
    (s) =>
      s.equipmentId === equipment.id ||
      (s.equipmentCode && s.equipmentCode.toUpperCase() === equipment.code.toUpperCase()) ||
      (s.title && s.title.toLowerCase().includes(equipment.code.toLowerCase()))
  );

  const getStatusBadge = (status: EquipmentItem['status']) => {
    switch (status) {
      case 'OPERACIONAL':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">OPERACIONAL</span>;
      case 'EM MANUTENÇÃO':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">EM MANUTENÇÃO</span>;
      case 'REQUER INSPEÇÃO':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-lg text-xs">REQUER INSPEÇÃO</span>;
      case 'DESATIVADO':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs">DESATIVADO</span>;
    }
  };

  const handleOpenKanbanCard = () => {
    // Open new service modal prefilled
    openNewServiceModal(equipment.category);
    onClose();
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDescription.trim()) return;

    setIsSubmittingLog(true);
    try {
      await addEquipmentMaintenanceLog(equipment.id, {
        date: logDate,
        type: logType,
        description: logDescription.trim(),
        performedBy: currentUser.name,
        cost: logCost ? Number(logCost) : 0,
      });
      setLogDescription('');
      setLogCost('');
      setIsAddingLog(false);
    } catch (err) {
      console.error('Erro ao adicionar registro:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o equipamento ${equipment.code} - ${equipment.name}?`)) {
      await deleteEquipment(equipment.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/30">
                  {equipment.code}
                </span>
                <h3 className="font-bold text-base leading-tight">{equipment.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {equipment.location} • {equipment.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {getStatusBadge(equipment.status)}
            {equipment.voltage && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-800 font-semibold rounded-md flex items-center gap-1 text-[11px]">
                <Zap className="w-3 h-3 text-amber-500" />
                {equipment.voltage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQR(equipment)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Etiqueta QR</span>
            </button>

            {hasRestrictedAccess && (
              <>
                <button
                  onClick={() => onEdit(equipment)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Excluir equipamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ficha Técnica Grid */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Ficha Técnica & Especificações</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-400 block text-[10px]">Marca / Fabricante</span>
                <span className="font-bold text-gray-800">{equipment.brand || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Modelo / Versão</span>
                <span className="font-bold text-gray-800">{equipment.model || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Nº de Série</span>
                <span className="font-mono font-bold text-gray-800">{equipment.serialNumber || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Potência / Capacidade</span>
                <span className="font-bold text-gray-800">{equipment.powerRating || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Data de Instalação</span>
                <span className="font-bold text-gray-800">
                  {equipment.installDate ? new Date(equipment.installDate).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Garantia Válida até</span>
                <span className="font-bold text-gray-800">
                  {equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry).toLocaleDateString('pt-BR') : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Encarregado / Responsável</span>
                <span className="font-bold text-blue-700">{equipment.responsibleName || 'Não atribuído'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Valor Patrimonial</span>
                <span className="font-bold text-emerald-700">
                  {equipment.estimatedValue
                    ? `R$ ${equipment.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Última Manutenção</span>
                <span className="font-bold text-gray-800">
                  {equipment.lastMaintenanceDate
                    ? new Date(equipment.lastMaintenanceDate).toLocaleDateString('pt-BR')
                    : 'Nenhuma registrada'}
                </span>
              </div>
            </div>

            {equipment.notes && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Observações:</strong> {equipment.notes}
              </div>
            )}
          </div>

          {/* Quick Action: Open Ticket in Kanban */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-xs text-blue-900">Precisa de manutenção neste aparelho?</h5>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Abra um chamado no Kanban com as informações deste equipamento já vinculadas.
              </p>
            </div>
            <button
              onClick={handleOpenKanbanCard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Abrir Chamado no Kanban</span>
            </button>
          </div>

          {/* Maintenance History Logs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                Histórico de Manutenções ({equipment.maintenanceHistory?.length || 0})
              </h4>
              {!isAddingLog && hasRestrictedAccess && (
                <button
                  onClick={() => setIsAddingLog(true)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Manutenção</span>
                </button>
              )}
            </div>

            {/* Add Log Form */}
            {isAddingLog && (
              <form onSubmit={handleSaveLog} className="p-4 bg-gray-50 border border-gray-300 rounded-xl mb-4 space-y-3">
                <h5 className="font-bold text-xs text-gray-900">Novo Registro de Manutenção</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Tipo</label>
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as EquipmentMaintenanceLog['type'])}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                    >
                      <option value="PREVENTIVA">PREVENTIVA</option>
                      <option value="CORRETIVA">CORRETIVA</option>
                      <option value="INSPEÇÃO">INSPEÇÃO</option>
                      <option value="INSTALAÇÃO">INSTALAÇÃO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Data</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Custo (R$)</label>
                    <input
                      type="number"
                      value={logCost}
                      onChange={(e) => setLogCost(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Descrição do Serviço Realizado</label>
                  <textarea
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    placeholder="Ex: Troca do capacitor de partida e limpeza química da serpentina."
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLog(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLog}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    {isSubmittingLog ? 'Gravando...' : 'Salvar Registro'}
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {(!equipment.maintenanceHistory || equipment.maintenanceHistory.length === 0) ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs">
                Nenhum registro histórico de manutenção para este equipamento ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {equipment.maintenanceHistory.map((item) => (
                  <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-900">
                          {item.type} • {item.performedBy}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-0.5 leading-relaxed">{item.description}</p>
                      {item.cost ? (
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">
                          Custo: R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Kanban Cards */}
          {linkedServices.length > 0 && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">
                Ordens de Serviço Relacionadas ({linkedServices.length})
              </h4>
              <div className="space-y-1.5">
                {linkedServices.map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => {
                      selectService(svc);
                      onClose();
                    }}
                    className="p-3 bg-gray-50 hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 rounded-xl transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{svc.title}</span>
                      <span className="text-gray-500 block text-[11px]">
                        Status: <strong>{svc.status}</strong> • Prioridade: {svc.priority}
                      </span>
                    </div>
                    <span className="text-blue-600 font-bold text-[11px] flex items-center gap-1">
                      <span>Ver Card</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
