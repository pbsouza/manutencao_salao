import React, { useState } from 'react';
import {
  Accessibility,
  Bath,
  BookOpen,
  Briefcase,
  Building,
  Car,
  Coffee,
  Compass,
  DoorClosed,
  Home,
  MapPin,
  Mic,
  Plus,
  Trees,
  Users,
  Wrench,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';

const LOCATION_ICONS: Record<string, React.ElementType> = {
  Users,
  DoorClosed,
  Mic,
  Bath,
  Accessibility,
  Coffee,
  Compass,
  BookOpen,
  Wrench,
  Briefcase,
  Building,
  Car,
  Trees,
  Home,
};

export const LocationsView: React.FC = () => {
  const { locations, services, addLocation, deleteLocation, setActiveTab, setFilterState } =
    useMaintenance();

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');

  const handleLocationClick = (locName: string) => {
    setFilterState((prev) => ({ ...prev, location: locName }));
    setActiveTab('kanban');
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    addLocation({
      name: newLocName.trim(),
      description: newLocDesc.trim(),
      iconName: 'MapPin',
    });

    setNewLocName('');
    setNewLocDesc('');
    setIsAddingLocation(false);
  };

  return (
    <div id="locations-view-container" className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Locais e Ambientes do Salão do Reino
          </h2>
          <p className="text-[11px] text-gray-500">
            Acompanhe ocorrências, problemas e serviços divididos por espaço físico
          </p>
        </div>

        <button
          onClick={() => setIsAddingLocation(!isAddingLocation)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Novo Local</span>
        </button>
      </div>

      {/* Add Location Form */}
      {isAddingLocation && (
        <form
          onSubmit={handleCreateLocation}
          className="bg-white border border-gray-200 p-4 rounded-lg space-y-3 shadow-2xs"
        >
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight">
            Adicionar Novo Ambiente / Local
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Nome do Local *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Salão Anexo / Garagem"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 text-xs rounded px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Descrição / Finalidade
              </label>
              <input
                type="text"
                placeholder="Ex: Espaço lateral para guarda de materiais"
                value={newLocDesc}
                onChange={(e) => setNewLocDesc(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 text-xs rounded px-3 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingLocation(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded hover:bg-gray-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 cursor-pointer shadow-2xs"
            >
              Salvar Local
            </button>
          </div>
        </form>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {locations.map((loc) => {
          const locServices = services.filter((s) => s.location === loc.name);
          const activeCount = locServices.filter(
            (s) => s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
          ).length;
          const completedCount = locServices.filter((s) => s.status === 'CONCLUÍDO').length;
          const Icon = (loc.iconName && LOCATION_ICONS[loc.iconName]) || MapPin;

          return (
            <div
              key={loc.id}
              onClick={() => handleLocationClick(loc.name)}
              className="bg-white hover:bg-gray-50/90 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      activeCount > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {activeCount} {activeCount === 1 ? 'pendente' : 'pendentes'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-xs group-hover:text-blue-700 transition-colors">
                  {loc.name}
                </h3>
                {loc.description && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">{loc.description}</p>
                )}
              </div>

              <div className="pt-2.5 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Total: {locServices.length}</span>
                <span className="text-emerald-700 font-bold">{completedCount} concluídos</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
