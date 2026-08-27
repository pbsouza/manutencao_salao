import React, { useEffect, useState } from 'react';
import { Cpu, Plus, Sparkles, Wrench, X } from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { EquipmentItem, EquipmentStatus } from '../types';

interface EquipmentFormModalProps {
  isOpen: boolean;
  editingEquipment: EquipmentItem | null;
  onClose: () => void;
  onSave: (equipment: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'maintenanceHistory'>) => Promise<void>;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  editingEquipment,
  onClose,
  onSave,
}) => {
  const { categories, locations, members } = useMaintenance();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [voltage, setVoltage] = useState<EquipmentItem['voltage']>('220V');
  const [powerRating, setPowerRating] = useState('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>('OPERACIONAL');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [responsibleName, setResponsibleName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingEquipment) {
      setCode(editingEquipment.code);
      setName(editingEquipment.name);
      setCategory(editingEquipment.category || categories[0]?.name || '');
      setLocation(editingEquipment.location || locations[0]?.name || '');
      setBrand(editingEquipment.brand || '');
      setModel(editingEquipment.model || '');
      setSerialNumber(editingEquipment.serialNumber || '');
      setVoltage(editingEquipment.voltage || '220V');
      setPowerRating(editingEquipment.powerRating || '');
      setInstallDate(editingEquipment.installDate || new Date().toISOString().split('T')[0]);
      setWarrantyExpiry(editingEquipment.warrantyExpiry || '');
      setStatus(editingEquipment.status || 'OPERACIONAL');
      setEstimatedValue(editingEquipment.estimatedValue ? String(editingEquipment.estimatedValue) : '');
      setResponsibleName(editingEquipment.responsibleName || '');
      setNotes(editingEquipment.notes || '');
    } else {
      // Auto generate next code prefix
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setCode(`EQ-${randomSuffix}`);
      setName('');
      setCategory(categories[0]?.name || 'Ar-Condicionado');
      setLocation(locations[0]?.name || 'Auditório');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setVoltage('220V');
      setPowerRating('');
      setInstallDate(new Date().toISOString().split('T')[0]);
      setWarrantyExpiry('');
      setStatus('OPERACIONAL');
      setEstimatedValue('');
      setResponsibleName(members[0]?.name || '');
      setNotes('');
    }
    setErrorMsg('');
  }, [editingEquipment, isOpen, categories, locations, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome ou descrição do equipamento.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Por favor, defina um código para o patrimônio.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: category || 'Geral',
        location: location || 'Salão Principal',
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim() || undefined,
        voltage,
        powerRating: powerRating.trim() || undefined,
        installDate,
        warrantyExpiry: warrantyExpiry || undefined,
        status,
        estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
        responsibleName: responsibleName || undefined,
        notes: notes.trim() || undefined,
        qrCodeData: `EQUIPMENT:${code.trim().toUpperCase()}`,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar equipamento:', err);
      setErrorMsg('Erro ao gravar dados no sistema.');
    } finally {
      setIsSubmitting(false);
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
              <h3 className="font-bold text-base">
                {editingEquipment ? 'Editar Equipamento / Patrimônio' : 'Novo Equipamento do Salão'}
              </h3>
              <p className="text-xs text-slate-400">Cadastro e ficha técnica do patrimônio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Código do Patrimônio *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: EQ-AC-01"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-bold text-slate-900"
                required
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Equipamento *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ar-Condicionado Auditório 1"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Local / Ambiente *</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status Operacional *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              >
                <option value="OPERACIONAL">OPERACIONAL</option>
                <option value="EM MANUTENÇÃO">EM MANUTENÇÃO</option>
                <option value="REQUER INSPEÇÃO">REQUER INSPEÇÃO</option>
                <option value="DESATIVADO">DESATIVADO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marca / Fabricante</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Carrier, Behringer, IBBL"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Modelo / Versão</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Inverter 36.000 BTU"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Serial */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Número de Série</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Ex: SN-9988214"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Voltage */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Alimentação Elétrica</label>
              <select
                value={voltage}
                onChange={(e) => setVoltage(e.target.value as EquipmentItem['voltage'])}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="220V">220V</option>
                <option value="110V">110V</option>
                <option value="Bivolt">Bivolt</option>
                <option value="Trifásico">Trifásico</option>
                <option value="Bateria / Pilha">Bateria / Pilha</option>
                <option value="Manual / Não elétrico">Manual / Não elétrico</option>
              </select>
            </div>

            {/* Power Rating */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Potência / Capacidade</label>
              <input
                type="text"
                value={powerRating}
                onChange={(e) => setPowerRating(e.target.value)}
                placeholder="Ex: 2.800W, 1 CV, 40L/h"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Valor Estimado (R$)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Install Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Data de Instalação</label>
              <input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Warranty Expiry */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Garantia até</label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Responsible */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Responsável / Encarregado</label>
              <select
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Selecione um encarregado...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notas Técnicas / Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Ligado no disjuntor 14 do QGD. Requer troca semestral de refil..."
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Gravando...' : editingEquipment ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
