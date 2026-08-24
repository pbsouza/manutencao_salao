import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
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
    updateMember,
    deleteMember,
    categories,
    firebaseUser,
    canEditServices,
    isAdmin,
  } = useMaintenance();

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

  useEffect(() => {
    if (editingMemberForModal) {
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
  }, [editingMemberForModal, isUserManagementModalOpen]);

  if (!isUserManagementModalOpen) return null;

  const toggleCategory = (catName: string) => {
    if (assignedCategories.includes(catName)) {
      setAssignedCategories(assignedCategories.filter((c) => c !== catName));
    } else {
      setAssignedCategories([...assignedCategories, catName]);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMINISTRADOR') {
      setCanEdit(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da pessoa.');
      return;
    }

    const safeEmail = email.trim().toLowerCase() || `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString().slice(-4)}@interno.app`;
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="user-management-modal-dialog"
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              {editingMemberForModal ? (
                <UserCheck className="w-5 h-5 text-blue-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {editingMemberForModal ? 'Editar Perfil de Usuário' : 'Cadastrar Novo Usuário'}
              </h3>
              <p className="text-[11px] text-gray-400">
                Gestão de permissões, especialidades e designações do Salão do Reino
              </p>
            </div>
          </div>

          <button
            onClick={closeUserManagementModal}
            className="p-1 rounded-lg hover:bg-white/20 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
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
                E-mail (Opcional para controle interno)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@exemplo.com (ou vazio)"
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
                Função / Papel no Controle Interno *
              </label>
              <div className="relative">
                <Shield className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="SUPERVISOR">Supervisor (Supervisão de Serviços)</option>
                  <option value="RESPONSÁVEL">Responsável (Gestão de Área)</option>
                  <option value="EXECUTOR">Executor (Execução de Manutenção)</option>
                  <option value="COLABORADOR">Colaborador (Apoio e Voluntário)</option>
                  <option value="COORDENADOR">Coordenador de Manutenção</option>
                  <option value="ADMINISTRADOR">Administrador (Acesso com Login)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Permissão de Edição de Dados do Sistema */}
          <div className={`p-3.5 rounded-lg border transition ${canEdit || role === 'ADMINISTRADOR' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-200'}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-4 h-4 ${canEdit || role === 'ADMINISTRADOR' ? 'text-emerald-700' : 'text-amber-700'}`} />
                  <span className="text-xs font-bold text-gray-900">
                    Permissão de Edição no Sistema
                  </span>
                  {role === 'ADMINISTRADOR' ? (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-blue-600 text-white rounded">
                      Admin Total
                    </span>
                  ) : (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${canEdit ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                      {canEdit ? 'Edição Liberada' : 'Somente Leitura'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 leading-snug">
                  {role === 'ADMINISTRADOR'
                    ? 'Administradores têm acesso total de edição e gestão no sistema.'
                    : canEdit
                    ? 'Este usuário conectado tem permissão do Administrador para criar, editar e excluir manutenções.'
                    : 'Acesso Somente Leitura. O usuário visualiza o sistema mas não pode editar dados sem autorização do administrador.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={canEdit || role === 'ADMINISTRADOR'}
                  disabled={role === 'ADMINISTRADOR'}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-60"></div>
              </label>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-900 leading-relaxed">
            ℹ️ <strong>Controle Interno:</strong> Pessoas cadastradas como Supervisores, Responsáveis, Executores e Colaboradores ficam disponíveis para designação em todos os serviços sem necessidade de criar login.
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
              Selecione as categorias de manutenção pelas quais este irmão é responsável ou supervisor frequente:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
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
              <span className="text-xs font-bold text-gray-900 block">Status do Usuário</span>
              <span className="text-[10px] text-gray-500">
                Usuários ativos aparecem nos seletores de executor e supervisor
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
                <span>{isSaving ? 'Salvando...' : 'Salvar Usuário'}</span>
              </button>
            </div>
          </div>
        </form>
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
