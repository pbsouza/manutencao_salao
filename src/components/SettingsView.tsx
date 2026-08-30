import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  HardDrive,
  Info,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Share,
  Shield,
  Smartphone,
  Sparkles,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { usePWAInstall } from '../pwa';
import { exportServicesToExcel } from '../utils/export';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    firebaseUser,
    logout,
    setIsAuthModalOpen,
    openUserManagementModal,
    openProblemTemplatesModal,
    openBatchAssignModal,
    seedPreFixedData,
    members,
    categories,
    locations,
    services,
    problemTemplates,
    exportDatabaseJSON,
    importDatabaseJSON,
    clearDatabase,
    importSpreadsheetFile,
  } = useMaintenance();

  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [jsonStatus, setJsonStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const filteredMembers = sortedMembers.filter(
    (m) =>
      !userSearch ||
      m.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleUserSwitch = (userId: string) => {
    const found = members.find((m) => m.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Processando planilha Excel...');
    const success = await importSpreadsheetFile(file);

    if (success) {
      setImportStatus('Planilha importada com sucesso para o banco de dados!');
    } else {
      setImportStatus('Erro na importação da planilha.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleJSONRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonStatus('Lendo arquivo de backup JSON...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const success = await importDatabaseJSON(text);
        if (success) {
          setJsonStatus('Backup JSON restaurado com sucesso no Firebase!');
        } else {
          setJsonStatus('Erro: Formato JSON inválido ou incompatível.');
        }
      } catch (err) {
        setJsonStatus('Falha ao processar arquivo de backup.');
      }
      setTimeout(() => setJsonStatus(null), 5000);
    };
    reader.readAsText(file);

    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    await seedPreFixedData(true);
    setIsSeeding(false);
    setSeedSuccess('Base oficial com 36 problemas e 19 categorias gravada no Firebase com sucesso!');
    setTimeout(() => setSeedSuccess(null), 4000);
  };

  const handleConfirmClear = async () => {
    setIsResetting(true);
    try {
      await clearDatabase();
      await seedPreFixedData(false);
      setIsConfirmClearOpen(false);
    } catch (err) {
      console.error('Error clearing database:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div id="settings-view-container" className="p-4 lg:p-6 pb-32 sm:pb-36 md:pb-12 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">
          Configurações & Gestão de Dados
        </h2>
        <p className="text-[11px] text-gray-500">
          Autenticação Google / E-mail, cadastro de usuários, problemas pré-fixados e sincronização de dados
        </p>
      </div>

      {/* Authentication & User Account Card */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-tight">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Autenticação & Acesso ao Sistema</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openUserManagementModal()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Gerenciar Usuários ({members.length})</span>
            </button>

            {firebaseUser ? (
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Fazer Login (Google / Senha)</span>
              </button>
            )}
          </div>
        </div>

        {firebaseUser ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                {(firebaseUser.displayName || firebaseUser.email || 'U').charAt(0)}
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Conectado como: {firebaseUser.displayName || firebaseUser.email}
                </span>
                <span className="text-[10px] text-emerald-700">
                  {firebaseUser.email} • Autenticado via Firebase Auth
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded font-bold text-[10px]">
              Sessão Segura Ativa
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Você está navegando em modo local. Faça login com sua Conta Google ou com Usuário/Senha cadastrado para sincronização em nuvem e permissões por perfil.
          </p>
        )}
      </div>

      {/* Progressive Web App (PWA) Card */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-tight">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Aplicativo Web Progressivo (PWA) & Instalação</span>
          </div>

          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
            isInstalled
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isInstalled ? 'App Instalado' : 'Pronto para Instalar'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <p className="text-xs text-gray-600">
              O <strong>Manutenção Salão do Reino</strong> é um PWA completo. Você pode instalá-lo diretamente no Google Chrome, Edge, celulares Android e iPhone para abrir como aplicativo nativo, com tela cheia, ícone personalizado e carregamento instantâneo.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ícone 512px HD
              </span>
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cache Offline
              </span>
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Modo Standalone
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2.5">
            <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span>Como Instalar no seu Dispositivo:</span>
              <span className="text-[10px] text-gray-500 font-normal">Google Chrome / Safari</span>
            </div>

            {canInstall ? (
              <button
                type="button"
                onClick={() => promptInstall()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora no Google Chrome</span>
              </button>
            ) : isInstalled ? (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aplicativo já está instalado e rodando em modo nativo!</span>
              </div>
            ) : isIOS ? (
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800 flex items-center gap-1">
                  <Share className="w-3.5 h-3.5 text-blue-600" /> No iPhone/iPad (Safari):
                </p>
                <p className="text-[11px]">
                  Toque no botão de <strong>Compartilhar</strong> e selecione <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>
            ) : (
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">
                  No Google Chrome (Computador ou Android):
                </p>
                <p className="text-[11px]">
                  Clique nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou no ícone de monitor na barra de endereço.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-fixed Problem Templates & Bulk Assignment Card */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-tight">
            <BookOpen className="w-4 h-4" />
            <span>Problemas e Soluções Pré-fixadas ({problemTemplates.length} disponíveis)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openProblemTemplatesModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Abrir Catálogo de Problemas</span>
            </button>

            <button
              onClick={() => openBatchAssignModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Designação em Massa</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          O sistema já possui 36 problemas típicos pré-configurados com suas 19 categorias correspondentes, soluções técnicas sugeridas, classificação GUT e pontuações de risco.
        </p>

        {seedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{seedSuccess}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Gravando no Firebase...' : 'Sincronizar Base Oficial no Firebase'}</span>
          </button>
        </div>
      </div>

      {/* User Switcher Section */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-tight">
            <User className="w-3.5 h-3.5" />
            <span>Perfil Operacional Ativo ({members.length} no banco de dados)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openUserManagementModal()}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Cadastrar (Individual / Lote)</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-600">
          Selecione qual irmão está operando o sistema para visualizar "Minhas Tarefas", gerenciar serviços sob supervisão e assinar auditorias:
        </p>

        {members.length > 9 && (
          <div>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar entre os usuários cadastrados..."
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 max-h-72 overflow-y-auto pr-1">
          {filteredMembers.slice(0, 60).map((m) => {
            const isCurrent = m.id === currentUser.id;
            return (
              <div
                key={m.id}
                onClick={() => handleUserSwitch(m.id)}
                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-blue-50/70 border-blue-400 shadow-2xs ring-1 ring-blue-400'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-[11px] shadow-2xs shrink-0"
                    style={{ backgroundColor: m.avatarColor || '#2563eb' }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-gray-900 block leading-tight truncate">{m.name}</span>
                    <span className="text-[10px] text-gray-500 truncate">{m.role}</span>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                    Ativo
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {filteredMembers.length > 60 && (
          <p className="text-[10px] text-gray-500 text-center italic">
            Mostrando 60 de {filteredMembers.length} pessoas. Digite na busca acima para filtrar mais especificamente.
          </p>
        )}
      </div>

      {/* Database Management & Excel Sync */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100 text-xs font-bold text-emerald-700 uppercase tracking-tight">
          <Database className="w-3.5 h-3.5" />
          <span>Sincronização & Importação da Planilha Excel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Excel Import Box */}
          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Importar "Planejamento para consertos no Salao do Reino.xlsx"</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Faça upload de uma versão atualizada da planilha para adicionar ou atualizar os problemas no sistema.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-file-importer"
            />

            <label
              htmlFor="excel-file-importer"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded cursor-pointer transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Selecionar Arquivo .XLSX</span>
            </label>

            {importStatus && (
              <div className="p-2.5 bg-blue-50 rounded text-[11px] font-bold text-blue-800 border border-blue-200 animate-in fade-in">
                {importStatus}
              </div>
            )}
          </div>

          {/* Backup and Restore */}
          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-lg space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>Backup e Restauração em JSON</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Exporte ou restaure todos os serviços, fotos, notas, categorias e orçamentos em formato JSON.
              </p>
            </div>

            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleJSONRestore}
              className="hidden"
              id="json-backup-importer"
            />

            {jsonStatus && (
              <div className="p-2 bg-emerald-50 rounded text-[11px] font-bold text-emerald-800 border border-emerald-200 animate-in fade-in">
                {jsonStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={exportDatabaseJSON}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Fazer Backup (JSON)</span>
              </button>

              <label
                htmlFor="json-backup-importer"
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded transition-colors cursor-pointer shadow-2xs text-center"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar JSON</span>
              </label>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-medium">Manutenção do Quadro</span>
              <button
                onClick={() => setIsConfirmClearOpen(true)}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Limpar Problemas do Quadro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Database Clear Modal */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Limpar Problemas do Quadro"
        message="Tem certeza que deseja limpar os problemas cadastrados no quadro? (As categorias e configurações serão mantidas)."
        confirmLabel="Sim, Limpar Problemas"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        isLoading={isResetting}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
