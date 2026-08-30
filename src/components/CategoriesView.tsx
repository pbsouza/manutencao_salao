import React from 'react';
import {
  Activity,
  Armchair,
  Bath,
  Building,
  CheckCircle2,
  ChevronsUp,
  Clock,
  DoorOpen,
  Droplets,
  Fence,
  Flame,
  Grid,
  Home,
  Layers,
  Lightbulb,
  Paintbrush,
  Plus,
  Refrigerator,
  ShieldAlert,
  Tag,
  Trees,
  User,
  Volume2,
  Wind,
  Zap,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';

// Icon mapper for categories
const ICON_MAP: Record<string, React.ElementType> = {
  ShieldAlert,
  Volume2,
  Armchair,
  Zap,
  Refrigerator,
  ChevronsUp,
  Droplets,
  Lightbulb,
  Layers,
  Bath,
  Fence,
  Trees,
  Paintbrush,
  Grid,
  DoorOpen,
  Activity,
  Flame,
  Home,
  Wind,
};

export const CategoriesView: React.FC = () => {
  const {
    categories,
    services,
    problemTemplates,
    setActiveTab,
    setFilterState,
    openNewServiceModal,
    openProblemTemplatesModal,
  } = useMaintenance();

  const handleCategoryClick = (categoryName: string) => {
    setFilterState((prev) => ({ ...prev, category: categoryName }));
    setActiveTab('kanban');
  };

  return (
    <div id="categories-view-container" className="p-4 lg:p-6 pb-32 sm:pb-36 md:pb-12 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Categorias do Salão do Reino (19 Oficiais)
          </h2>
          <p className="text-[11px] text-gray-500">
            Estrutura baseada na planilha oficial com 36 soluções técnicas recomendadas pré-fixadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openProblemTemplatesModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded transition-all cursor-pointer shadow-2xs"
          >
            <span>Ver Problemas & Soluções Pré-fixadas ({problemTemplates.length})</span>
          </button>

          <button
            onClick={() => openNewServiceModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Problema</span>
          </button>
        </div>
      </div>

      {/* 19 Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.category === cat.name);
          const totalCount = catServices.length;
          const highCount = catServices.filter(
            (s) => s.priority === 'Alta' && s.status !== 'CONCLUÍDO' && s.status !== 'CANCELADO'
          ).length;
          const inProgressCount = catServices.filter((s) => s.status === 'EM ANDAMENTO').length;
          const completedCount = catServices.filter((s) => s.status === 'CONCLUÍDO').length;

          const IconComponent = ICON_MAP[cat.iconName] || Tag;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-white hover:bg-gray-50/90 p-3.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              {/* Category Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: cat.color || '#2563eb' }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {totalCount} {totalCount === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-xs group-hover:text-blue-700 transition-colors">
                  {cat.name.replace(/_/g, ' ')}
                </h3>

                {cat.description && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Stats Breakdown */}
              <div className="pt-2.5 mt-3 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Alta prioridade
                  </span>
                  <span className="font-bold text-red-700">{highCount}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Em andamento
                  </span>
                  <span className="font-bold text-amber-700">{inProgressCount}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Concluídos
                  </span>
                  <span className="font-bold text-emerald-700">{completedCount}</span>
                </div>

                {/* Default Responsible */}
                <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Resp. Padrão:</span>
                  <span className="font-bold text-gray-800">{cat.defaultResponsibleName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
