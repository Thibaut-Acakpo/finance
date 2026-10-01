import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { Button } from './Field';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer l’action',
  message,
  confirmLabel = 'Confirmer',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-coral-500/15 text-coral-400">
          <AlertTriangle size={18} />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-white/70">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
