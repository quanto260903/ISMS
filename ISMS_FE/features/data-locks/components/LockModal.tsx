"use client";

import { useEffect, useRef, useState } from "react";
import type { LockModule } from "../types/data-lock";
import { MODULE_META } from "../types/data-lock";

interface Props {
  open: boolean;
  defaultModule?: LockModule;
  loading: boolean;
  onClose: () => void;
  onSubmit: (module: LockModule, date: string, reason?: string) => void;
}

export function LockModal({ open, defaultModule, loading, onClose, onSubmit }: Props) {
  const [module, setModule] = useState<LockModule>(defaultModule ?? "INVENTORY");
  const [date, setDate]     = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr]       = useState("");
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (defaultModule) setModule(defaultModule);
      setDate("");
      setReason("");
      setErr("");
      setTimeout(() => dateRef.current?.focus(), 100);
    }
  }, [open, defaultModule]);

  const handleSubmit = () => {
    // ✅ Chỉ validate bắt buộc phải chọn ngày
    // KHÔNG giới hạn ngày quá khứ — nghiệp vụ cho phép khóa ngày đã qua
    if (!date) {
      setErr("Vui lòng chọn ngày khóa.");
      return;
    }
    onSubmit(module, date, reason.trim() || undefined);
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" role="dialog" aria-modal aria-label="Thêm khóa sổ">
        <div className="modal-header">
          <span className="modal-icon">🔒</span>
          <h2 className="modal-title">Thêm khóa sổ</h2>
        </div>

        {/* Module */}
        <div className="field-group">
          <label className="field-label">
            Module <span className="required">*</span>
          </label>
          <select
            className="field-control"
            value={module}
            onChange={(e) => setModule(e.target.value as LockModule)}
            disabled={!!defaultModule}
          >
            {(Object.keys(MODULE_META) as LockModule[]).map((m) => (
              <option key={m} value={m}>
                {MODULE_META[m].icon} {MODULE_META[m].label} ({m})
              </option>
            ))}
          </select>
        </div>

        {/* Ngày khóa — không có min, cho phép chọn ngày quá khứ */}
        <div className="field-group">
          <label className="field-label">
            Khóa đến ngày <span className="required">*</span>
          </label>
          <input
            ref={dateRef}
            type="date"
            className="field-control"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErr(""); }}
          />
          <p className="field-hint">
            Toàn bộ chứng từ có ngày ≤ ngày này sẽ bị khóa, không thể tạo/sửa/xóa.
          </p>
        </div>

        {/* Lý do */}
        <div className="field-group">
          <label className="field-label">Lý do khóa</label>
          <textarea
            className="field-control"
            rows={3}
            placeholder="Ví dụ: Chốt sổ cuối tháng 4/2025..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
        </div>

        {err && <p className="field-error">{err}</p>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn btn-lock"
            onClick={handleSubmit}
            disabled={loading || !date}
          >
            {loading ? <span className="spinner" /> : "🔒"}
            {loading ? "Đang xử lý..." : "Xác nhận khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}