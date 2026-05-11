"use client";

import type { LockModule } from "../types/data-lock";
import { MODULE_META } from "../types/data-lock";

interface Props {
  open: boolean;
  module: LockModule | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UnlockModal({ open, module, loading, onClose, onConfirm }: Props) {
  if (!open || !module) return null;
  const meta = MODULE_META[module];

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box--confirm" role="dialog" aria-modal aria-label="Xác nhận mở khóa">
        <div className="confirm-icon-wrap">
          <span className="confirm-big-icon">🔓</span>
        </div>
        <h2 className="confirm-title">Xác nhận mở khóa?</h2>
        <p className="confirm-desc">
          Bạn sắp mở khóa module{" "}
          <strong>{meta.icon} {meta.label}</strong>.
          <br />
          Dữ liệu sẽ có thể chỉnh sửa lại sau khi mở khóa.
        </p>
        <div className="modal-actions modal-actions--center">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button className="btn btn-unlock" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : "🔓"}
            {loading ? "Đang xử lý..." : "Mở khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
