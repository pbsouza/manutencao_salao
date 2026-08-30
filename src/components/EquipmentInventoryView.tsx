import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  Download,
  Filter,
  Plus,
  Printer,
  QrCode,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useMaintenance } from '../context/MaintenanceContext';
import { EquipmentItem, EquipmentStatus } from '../types';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EquipmentQRModal } from './EquipmentQRModal';
import { EquipmentScanModal } from './EquipmentScanModal';

export const EquipmentInventoryView: React.FC = () => {
  const {
    equipments,
    categories,
    locations,
    addEquipment,
    updateEquipment,
    clearAllEquipments,
    hasRestrictedAccess,
  } = useMaintenance();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [selectedDetailEquipment, setSelectedDetailEquipment] = useState<EquipmentItem | null>(null);
  const [qrEquipment, setQrEquipment] = useState<EquipmentItem | null>(null);
  const [isScanOpen, setIsScanOpen] = useState(false);

  // Filtered equipments
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesCode = eq.code.toLowerCase().includes(query);
        const matchesName = eq.name.toLowerCase().includes(query);
        const matchesBrand = eq.brand?.toLowerCase().includes(query) || false;
        const matchesModel = eq.model?.toLowerCase().includes(query) || false;
        const matchesSerial = eq.serialNumber?.toLowerCase().includes(query) || false;
        if (!matchesCode && !matchesName && !matchesBrand && !matchesModel && !matchesSerial) {
          return false;
        }
      }

      if (selectedCategory && eq.category !== selectedCategory) {
        return false;
      }

      if (selectedLocation && eq.location !== selectedLocation) {
        return false;
      }

      if (selectedStatus && eq.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [equipments, search, selectedCategory, selectedLocation, selectedStatus]);

  // Key KPI stats
  const totalEquipments = equipments.length;
  const operationalCount = equipments.filter((e) => e.status === 'OPERACIONAL').length;
  const maintenanceCount = equipments.filter((e) => e.status === 'EM MANUTENÇÃO').length;
  const inspectionCount = equipments.filter((e) => e.status === 'REQUER INSPEÇÃO').length;
  const totalValue = equipments.reduce((sum, e) => sum + (e.estimatedValue || 0), 0);
  const operationalPercent = totalEquipments > 0 ? Math.round((operationalCount / totalEquipments) * 100) : 100;

  const handleCreateNew = () => {
    setEditingEquipment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (eq: EquipmentItem) => {
    setEditingEquipment(eq);
    setIsFormOpen(true);
  };

  const handleSaveEquipment = async (data: Omit<EquipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'maintenanceHistory'>) => {
    if (editingEquipment) {
      await updateEquipment(editingEquipment.id, data);
    } else {
      await addEquipment(data);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os equipamentos do inventário para recadastrar do zero?')) {
      await clearAllEquipments();
    }
  };

  const handleExportExcel = () => {
    const exportRows = filteredEquipments.map((eq) => ({
      'Código': eq.code,
      'Nome': eq.name,
      'Categoria': eq.category,
      'Local': eq.location,
      'Status': eq.status,
      'Marca': eq.brand || '',
      'Modelo': eq.model || '',
      'Nº de Série': eq.serialNumber || '',
      'Voltagem': eq.voltage || '',
      'Potência': eq.powerRating || '',
      'Data Instalação': eq.installDate || '',
      'Garantia até': eq.warrantyExpiry || '',
      'Responsável': eq.responsibleName || '',
      'Valor Estimado (R$)': eq.estimatedValue || 0,
      'Última Manutenção': eq.lastMaintenanceDate || '',
      'Observações': eq.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventário Patrimônio');
    XLSX.writeFile(wb, `inventario_patrimonio_salao_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'OPERACIONAL':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">OPERACIONAL</span>;
      case 'EM MANUTENÇÃO':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">EM MANUTENÇÃO</span>;
      case 'REQUER INSPEÇÃO':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">REQUER INSPEÇÃO</span>;
      case 'DESATIVADO':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md">DESATIVADO</span>;
    }
  };

  return (
    <div id="equipment-inventory-view" className="p-4 sm:p-6 pb-32 sm:pb-36 md:pb-12 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Inventário de Equipamentos & Patrimônio
            </h1>
            <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {totalEquipments} Ativos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestão de aparelhos do Salão do Reino, etiquetas com QR Code, voltagem e histórico preventivo
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScanOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Ler QR Code</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Exportar Excel</span>
          </button>

          {hasRestrictedAccess && totalEquipments > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Apagar todos os equipamentos para iniciar do zero"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Limpar Todos</span>
            </button>
          )}

          {hasRestrictedAccess && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Equipamento</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total & Operacional */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Operacional</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-gray-900">{operationalCount}</span>
              <span className="text-xs font-bold text-emerald-600">({operationalPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Em Manutenção */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Em Manutenção</span>
            <span className="text-xl font-black text-amber-700">{maintenanceCount}</span>
          </div>
        </div>

        {/* Requer Inspeção */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Requer Inspeção</span>
            <span className="text-xl font-black text-purple-700">{inspectionCount}</span>
          </div>
        </div>

        {/* Valor Total do Patrimônio */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Patrimônio Total</span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, nome, marca..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos os Locais</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos os Status</option>
              <option value="OPERACIONAL">OPERACIONAL</option>
              <option value="EM MANUTENÇÃO">EM MANUTENÇÃO</option>
              <option value="REQUER INSPEÇÃO">REQUER INSPEÇÃO</option>
              <option value="DESATIVADO">DESATIVADO</option>
            </select>
          </div>
        </div>

        {(search || selectedCategory || selectedLocation || selectedStatus) && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Exibindo <strong>{filteredEquipments.length}</strong> de {totalEquipments} equipamentos
            </span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedLocation('');
                setSelectedStatus('');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Equipment Cards Grid */}
      {filteredEquipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          <Cpu className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-700">Nenhum equipamento encontrado</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Ajuste os filtros de busca ou cadastre um novo equipamento para o Salão do Reino.
          </p>
          {hasRestrictedAccess && (
            <button
              onClick={handleCreateNew}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Equipamento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipments.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-900 text-white rounded-md tracking-wider">
                    {eq.code}
                  </span>
                  {getStatusBadge(eq.status)}
                </div>

                <h3
                  onClick={() => setSelectedDetailEquipment(eq)}
                  className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition cursor-pointer line-clamp-1"
                  title={eq.name}
                >
                  {eq.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {eq.location} • {eq.category}
                </p>
              </div>

              {/* Card Specs */}
              <div className="p-4 text-xs space-y-2 bg-gray-50/50 flex-1">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Marca / Modelo</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {eq.brand || eq.model ? `${eq.brand || ''} ${eq.model || ''}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Voltagem / Potência</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      {eq.voltage && <Zap className="w-3 h-3 text-amber-500 shrink-0" />}
                      {eq.voltage || eq.powerRating ? `${eq.voltage || ''} ${eq.powerRating || ''}` : '—'}
                    </span>
                  </div>
                </div>

                {eq.responsibleName && (
                  <div className="text-[11px] pt-1">
                    <span className="text-gray-400 block text-[10px]">Responsável</span>
                    <span className="font-bold text-blue-700">{eq.responsibleName}</span>
                  </div>
                )}

                {eq.nextPreventiveDate && (
                  <div className="text-[11px] pt-1 flex items-center justify-between text-gray-600">
                    <span className="text-[10px] text-gray-400">Próx. Preventiva:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(eq.nextPreventiveDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setQrEquipment(eq)}
                  className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer text-[11px]"
                  title="Gerar etiqueta QR para colar no aparelho"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>QR Code</span>
                </button>

                <button
                  onClick={() => setSelectedDetailEquipment(eq)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-[11px] cursor-pointer shadow-xs"
                >
                  Ver Ficha Completa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <EquipmentFormModal
        isOpen={isFormOpen}
        editingEquipment={editingEquipment}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEquipment(null);
        }}
        onSave={handleSaveEquipment}
      />

      <EquipmentDetailModal
        equipment={selectedDetailEquipment}
        onClose={() => setSelectedDetailEquipment(null)}
        onEdit={(eq) => {
          setSelectedDetailEquipment(null);
          handleEdit(eq);
        }}
        onOpenQR={(eq) => {
          setQrEquipment(eq);
        }}
      />

      <EquipmentQRModal equipment={qrEquipment} onClose={() => setQrEquipment(null)} />

      <EquipmentScanModal
        isOpen={isScanOpen}
        equipments={equipments}
        onClose={() => setIsScanOpen(false)}
        onSelectEquipment={(eq) => setSelectedDetailEquipment(eq)}
      />
    </div>
  );
};
