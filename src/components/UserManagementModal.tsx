import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  Mail,
  Phone,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useMaintenance } from '../context/MaintenanceContext';
import { UserMember, UserRole } from '../types';
import { ConfirmModal } from './ConfirmModal';

const AVATAR_COLORS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#0d9488', // Teal
  '#d97706', // Amber
  '#dc2626', // Red
  '#059669', // Emerald
  '#475569', // Slate
  '#db2777', // Pink
];

export const UserManagementModal: React.FC = () => {
  const {
    isUserManagementModalOpen,
    closeUserManagementModal,
    editingMemberForModal,
    addMember,
    addMembersBatch,
    updateMember,
    deleteMember,
    categories,
    members,
    firebaseUser,
    canEditServices,
    isAdmin,
  } = useMaintenance();

  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'import'>('single');

  // Single form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('RESPONSÁVEL');
  const [avatarColor, setAvatarColor] = useState('#2563eb');
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Batch paste state
  const [batchText, setBatchText] = useState('');
  const [batchRole, setBatchRole] = useState<UserRole>('EXECUTOR');
  const [batchCategories, setBatchCategories] = useState<string[]>([]);
  const [batchSuccessCount, setBatchSuccessCount] = useState<number | null>(null);

  // Excel / CSV File state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedPreview, setImportedPreview] = useState<Omit<UserMember, 'id'>[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (editingMemberForModal) {
      setActiveTab('single');
      setName(editingMemberForModal.name || '');
      setEmail(editingMemberForModal.email || '');
      setPhone(editingMemberForModal.phone || '');
      const memberRole = editingMemberForModal.role || 'RESPONSÁVEL';
      setRole(memberRole);
      setAvatarColor(editingMemberForModal.avatarColor || '#2563eb');
      setAssignedCategories(editingMemberForModal.assignedCategories || []);
      setActive(editingMemberForModal.active !== false);
      const isMemberAdmin = memberRole === 'ADMINISTRADOR' || editingMemberForModal.email === 'belchior87@gmail.com';
      setCanEdit(isMemberAdmin ? true : (editingMemberForModal.canEdit ?? false));
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('RESPONSÁVEL');
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setAssignedCategories([]);
      setActive(true);
      setCanEdit(false);
    }
    setError(null);
    setBatchSuccessCount(null);
    setImportedPreview([]);
    setImportStatus(null);
  }, [editingMemberForModal, isUserManagementModalOpen]);

  if (!isUserManagementModalOpen) return null;

  const toggleCategory = (catName: string) => {
    if (assignedCategories.includes(catName)) {
      setAssignedCategories(assignedCategories.filter((c) => c !== catName));
    } else {
      setAssignedCategories([...assignedCategories, catName]);
    }
  };

  const toggleBatchCategory = (catName: string) => {
    if (batchCategories.includes(catName)) {
      setBatchCategories(batchCategories.filter((c) => c !== catName));
    } else {
      setBatchCategories([...batchCategories, catName]);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMINISTRADOR') {
      setCanEdit(true);
    }
  };

  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da pessoa.');
      return;
    }

    const safeEmail =
      email.trim().toLowerCase() ||
      `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${Date.now().toString().slice(-4)}@interno.app`;
    const isMemberAdmin = role === 'ADMINISTRADOR' || safeEmail === 'belchior87@gmail.com';
    const finalCanEdit = isMemberAdmin ? true : canEdit;

    setIsSaving(true);
    setError(null);

    try {
      if (editingMemberForModal) {
        await updateMember(editingMemberForModal.id, {
          name: name.trim(),
          email: safeEmail,
          phone: phone.trim(),
          role,
          avatarColor,
          assignedCategories,
          active,
          canEdit: finalCanEdit,
        });
      } else {
        await addMember({
          name: name.trim(),
          email: safeEmail,
          phone: phone.trim(),
          role,
          avatarColor,
          assignedCategories,
          active,
          canEdit: finalCanEdit,
        });
      }
      setIsSaving(false);
      closeUserManagementModal();
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Erro ao salvar informações do usuário.');
    }
  };

  // Parse batch text lines
  const parseBatchLines = () => {
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: Omit<UserMember, 'id'>[] = [];

    for (const line of lines) {
      // Check if line contains comma or semicolon: "Nome, Telefone, Função"
      const parts = line.includes(';') ? line.split(';') : line.split(',');
      const rawName = parts[0].trim();
      if (!rawName) continue;

      let rawPhone = parts[1] ? parts[1].trim() : '';
      let rawRole: UserRole = batchRole;

      if (parts[2]) {
        const potentialRole = parts[2].trim().toUpperCase();
        if (['ADMINISTRADOR', 'COORDENADOR', 'SUPERVISOR', 'RESPONSÁVEL', 'EXECUTOR', 'COLABORADOR'].includes(potentialRole)) {
          rawRole = potentialRole as UserRole;
        }
      }

      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const safeEmail = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${Math.floor(1000 + Math.random() * 9000)}@interno.app`;

      parsed.push({
        name: rawName,
        email: safeEmail,
        phone: rawPhone,
        role: rawRole,
        avatarColor: randomColor,
        assignedCategories: batchCategories,
        active: true,
        canEdit: rawRole === 'ADMINISTRADOR',
      });
    }

    return parsed;
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedList = parseBatchLines();
    if (parsedList.length === 0) {
      setError('Por favor, digite ou cole pelo menos um nome para cadastrar.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const insertedCount = await addMembersBatch(parsedList);
      setBatchSuccessCount(insertedCount);
      setBatchText('');
      setIsSaving(false);
      setTimeout(() => {
        closeUserManagementModal();
      }, 1500);
    } catch (err: any) {
      setIsSaving(false);
      setError(err.message || 'Erro ao cadastrar usuários em lote.');
    }
  };

  // Handle Excel/CSV file upload for members
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Lendo arquivo de planilha...');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length === 0) {
          setImportStatus('A planilha está vazia.');
          return;
        }

        // Find header row or process rows directly
        const membersParsed: Omit<UserMember, 'id'>[] = [];
        let nameIdx = 0;
        let phoneIdx = -1;
        let roleIdx = -1;
        let startRow = 0;

        const firstRow = rows[0];
        if (Array.isArray(firstRow)) {
          firstRow.forEach((cell: any, idx: number) => {
            const cellStr = String(cell || '').toLowerCase();
            if (cellStr.includes('nome') || cellStr.includes('name') || cellStr.includes('irmão') || cellStr.includes('volunt')) {
              nameIdx = idx;
              startRow = 1;
            }
            if (cellStr.includes('tel') || cellStr.includes('fone') || cellStr.includes('celular') || cellStr.includes('whats')) {
              phoneIdx = idx;
              startRow = 1;
            }
            if (cellStr.includes('função') || cellStr.includes('cargo') || cellStr.includes('role') || cellStr.includes('papel')) {
              roleIdx = idx;
              startRow = 1;
            }
          });
        }

        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[nameIdx]) continue;
          const rawName = String(row[nameIdx]).trim();
          if (!rawName || rawName.length < 2) continue;

          const rawPhone = phoneIdx >= 0 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
          let memberRole: UserRole = 'EXECUTOR';

          if (roleIdx >= 0 && row[roleIdx]) {
            const rText = String(row[roleIdx]).trim().toUpperCase();
            if (['ADMINISTRADOR', 'COORDENADOR', 'SUPERVISOR', 'RESPONSÁVEL', 'EXECUTOR', 'COLABORADOR'].includes(rText)) {
              memberRole = rText as UserRole;
            }
          }

          const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
          const safeEmail = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${Math.floor(1000 + Math.random() * 9000)}@interno.app`;

          membersParsed.push({
            name: rawName,
            email: safeEmail,
            phone: rawPhone,
            role: memberRole,
            avatarColor: randomColor,
            assignedCategories: [],
            active: true,
            canEdit: memberRole === 'ADMINISTRADOR',
          });
        }

        if (membersParsed.length === 0) {
          setImportStatus('Nenhum nome válido encontrado na planilha.');
        } else {
          setImportedPreview(membersParsed);
          setImportStatus(`Planilha processada com sucesso: ${membersParsed.length} pessoas encontradas.`);
        }
      } catch (err: any) {
        console.error('Error parsing member file:', err);
        setImportStatus('Erro ao ler planilha: ' + (err.message || 'formato inválido'));
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (importedPreview.length === 0) return;
    setIsImporting(true);
    try {
      const count = await addMembersBatch(importedPreview);
      setImportStatus(`${count} pessoas cadastradas no controle interno com sucesso!`);
      setImportedPreview([]);
      setIsImporting(false);
      setTimeout(() => {
        closeUserManagementModal();
      }, 1500);
    } catch (err: any) {
      setIsImporting(false);
      setImportStatus('Erro ao salvar no Firebase: ' + (err.message || 'erro'));
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingMemberForModal) return;
    setIsDeleting(true);
    try {
      await deleteMember(editingMemberForModal.id);
      setIsConfirmDeleteOpen(false);
      closeUserManagementModal();
    } catch (err) {
      console.error('Error deleting member:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const parsedBatchCount = parseBatchLines().length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          id="user-management-modal-dialog"
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                {editingMemberForModal ? (
                  <UserCheck className="w-5 h-5 text-blue-400" />
                ) : (
                  <Users className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {editingMemberForModal
                    ? `Editar Usuário: ${editingMemberForModal.name}`
                    : `Gestão e Cadastro de Usuários (${members.length} cadastrados)`}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Controle interno de voluntários, supervisores e executores para manutenção do Salão do Reino
                </p>
              </div>
            </div>

            <button
              onClick={closeUserManagementModal}
              className="p-1.5 rounded-lg hover:bg-white/20 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs (Only when not editing an existing member) */}
          {!editingMemberForModal && (
            <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 pt-2 gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'single'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastro Individual</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'batch'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Cadastro em Lote (200+ Nomes)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'import'
                    ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar Planilha Excel / CSV</span>
              </button>
            </div>
          )}

          {/* Tab 1: Single User Form */}
          {activeTab === 'single' && (
            <form onSubmit={handleSaveSingle} className="p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Mendes"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    E-mail (Opcional - apenas para quem fará login)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@exemplo.com (ou deixe vazio para controle)"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99876-5432"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Função no Controle Interno *
                  </label>
                  <div className="relative">
                    <Shield className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                    >
                      <option value="EXECUTOR">Executor (Execução de Serviços)</option>
                      <option value="RESPONSÁVEL">Responsável (Gestão de Área)</option>
                      <option value="SUPERVISOR">Supervisor (Supervisão Técnica)</option>
                      <option value="COLABORADOR">Colaborador / Apoio Voluntário</option>
                      <option value="COORDENADOR">Coordenador de Manutenção</option>
                      <option value="ADMINISTRADOR">Administrador (Com Login e Acesso Total)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notice explaining internal control vs login */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Controle Interno para centenas de membros:</span>
                </div>
                <p>
                  Usuários cadastrados para controle interno ficam gravados no banco de dados e disponíveis imediatamente para designação de serviços, Kanban, relatórios e supervisão, <strong>sem necessidade de login ou senha</strong> e sem consumir limite de acessos simultâneos.
                </p>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                  Cor do Avatar Identificador
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        avatarColor === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {avatarColor === c && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialty Categories */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Categorias & Especialidades Designadas
                </label>
                <p className="text-[10px] text-gray-500 mb-2">
                  Selecione as áreas pelas quais este irmão costuma ser designado:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {categories.map((cat) => {
                    const isSelected = assignedCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-2xs'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{cat.name.replace(/_/g, ' ')}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Status Ativo</span>
                  <span className="text-[10px] text-gray-500">
                    Aparece nos seletores de responsáveis, executores e supervisores
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {editingMemberForModal && firebaseUser && (isAdmin || canEditServices) ? (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer border border-transparent hover:border-red-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Usuário</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeUserManagementModal}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Salvando...' : 'Salvar Pessoa'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Batch Paste Names Form */}
          {activeTab === 'batch' && (
            <form onSubmit={handleSaveBatch} className="p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {batchSuccessCount !== null && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{batchSuccessCount} pessoas cadastradas com sucesso para controle interno!</span>
                </div>
              )}

              <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-1 text-xs text-indigo-950">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Cadastro Rápido de 200+ Pessoas para Controle Interno</span>
                </div>
                <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                  Cole uma lista de nomes (um por linha) copiada do WhatsApp, Word, bloco de notas ou planilha. Você pode colar 10, 50, 100 ou 200+ nomes de uma só vez!
                </p>
                <p className="text-[10px] text-indigo-600 font-mono">
                  Dica: Você também pode usar o formato "Nome, Telefone" (ex: Carlos Mendes, 11998765432)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    Cole a Lista de Nomes (1 nome por linha) *
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                    {parsedBatchCount} {parsedBatchCount === 1 ? 'pessoa identificada' : 'pessoas identificadas'}
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="Exemplo:&#10;Carlos Mendes&#10;Marcos Vinicius&#10;Paulo Henrique&#10;Lucas Ferreira&#10;Antônio Silva&#10;Daniel Oliveira&#10;Roberto Santos..."
                  className="w-full p-3 text-xs rounded-xl border border-gray-300 font-sans focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Default Role Selection for Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Função Padrão dos Nomes Colados
                  </label>
                  <select
                    value={batchRole}
                    onChange={(e) => setBatchRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white font-medium"
                  >
                    <option value="EXECUTOR">Executor (Execução de Manutenção)</option>
                    <option value="RESPONSÁVEL">Responsável (Gestão de Área)</option>
                    <option value="SUPERVISOR">Supervisor (Supervisão)</option>
                    <option value="COLABORADOR">Colaborador / Voluntário</option>
                    <option value="COORDENADOR">Coordenador</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 self-end">
                  <div className="text-[11px] text-gray-600">
                    <span className="font-bold text-gray-900 block">Identificação Automática</span>
                    Avatares coloridos e IDs internos únicos gerados no Firebase.
                  </div>
                </div>
              </div>

              {/* Specialty Categories for Batch */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Especialidades Padrão (Opcional)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {categories.map((cat) => {
                    const isSelected = batchCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleBatchCategory(cat.name)}
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white font-bold'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{cat.name.replace(/_/g, ' ')}</span>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">
                  {parsedBatchCount > 0
                    ? `Pronto para cadastrar ${parsedBatchCount} pessoas no banco de dados`
                    : 'Cole a lista acima para prosseguir'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeUserManagementModal}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || parsedBatchCount === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isSaving
                        ? 'Gravando no Firebase...'
                        : `Cadastrar ${parsedBatchCount > 0 ? parsedBatchCount : ''} Pessoas em Lote`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 3: Import Excel / CSV Spreadsheet */}
          {activeTab === 'import' && (
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl space-y-1.5 text-xs text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Importar Lista de Membros da Planilha Excel (.xlsx / .csv)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Selecione um arquivo Excel contendo uma coluna com os nomes dos irmãos/voluntários. O sistema detectará automaticamente a coluna de nomes e importará todos para o controle interno.
                </p>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50/40 p-6 rounded-xl text-center transition cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="members-excel-file-input"
                />
                <label htmlFor="members-excel-file-input" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    Clique aqui para selecionar a planilha Excel (.xlsx / .csv)
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Formatos suportados: Excel (.xlsx, .xls) ou Valores Separados por Vírgula (.csv)
                  </p>
                </label>
              </div>

              {importStatus && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {/* Preview Table */}
              {importedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                    <span>Pré-visualização dos Nomes ({importedPreview.length} pessoas)</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      Pronto para importar
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100">
                    {importedPreview.slice(0, 50).map((m, idx) => (
                      <div key={idx} className="p-2 text-xs flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                            style={{ backgroundColor: m.avatarColor }}
                          >
                            {m.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-800 truncate">{m.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                          {m.role}
                        </span>
                      </div>
                    ))}
                    {importedPreview.length > 50 && (
                      <div className="p-2 text-center text-[11px] text-gray-500 font-medium bg-gray-50">
                        ... e mais {importedPreview.length - 50} pessoas na planilha.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={handleConfirmImport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isImporting
                          ? 'Importando para o Firebase...'
                          : `Confirmar Importação de ${importedPreview.length} Pessoas`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for User Deletion */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Remover Usuário"
        message={`Tem certeza que deseja remover o usuário "${editingMemberForModal?.name}"? As manutenções associadas não serão apagadas.`}
        confirmLabel="Sim, Remover Usuário"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};
