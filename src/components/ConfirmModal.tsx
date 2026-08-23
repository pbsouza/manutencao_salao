import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-2xs';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-2xs';
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xs';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="confirm-modal-dialog"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-red-100 text-red-600'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {confirmVariant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${getButtonStyles()}`}
          >
            {isLoading ? (
              <span>Processando...</span>
            ) : (
              <>
                {confirmVariant === 'danger' && <Trash2 className="w-3.5 h-3.5" />}
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
