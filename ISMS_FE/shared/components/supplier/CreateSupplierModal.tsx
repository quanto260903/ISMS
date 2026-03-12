// ============================================================
//  shared/components/supplier/CreateSupplierModal.tsx
//  Modal inline tạo mới nhà cung cấp
// ============================================================

"use client";

import React, { useState } from "react";
import { createSupplier } from "@/shared/api/supplier.api";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

interface Props {
  initialId?: string;   // Pre-fill mã từ ô tìm kiếm
  onClose:    () => void;
  onCreated:  (supplier: SupplierSearchResult) => void;
}

export default function CreateSupplierModal({ initialId = "", onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    supplierId:   initialId,
    supplierName: "",
    taxId:        "",
    address:      "",
    phone:        "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const setField = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.supplierId.trim()) { setError("Mã nhà cung cấp không được rỗng"); return; }
    if (!form.supplierName.trim()) { setError("Tên nhà cung cấp không được rỗng"); return; }

    setLoading(true);
    try {
      const res = await createSupplier(form);
      if (res.isSuccess && res.data) {
        onCreated(res.data);
        onClose();
      } else {
        setError(res.message || "Có lỗi xảy ra");
      }
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.eyebrow}>Nhà cung cấp</div>
            <div style={s.title}>➕ Tạo mới nhà cung cấp</div>
          </div>
          <button style={s.closeBtn} onClick={onClose} title="Đóng">✕</button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {[
            { label: "Mã nhà cung cấp *", key: "supplierId"   as const, placeholder: "VD: NCC001" },
            { label: "Tên nhà cung cấp *", key: "supplierName" as const, placeholder: "Nhập tên đầy đủ" },
            { label: "Mã số thuế",         key: "taxId"        as const, placeholder: "Nhập MST" },
            { label: "Địa chỉ",            key: "address"      as const, placeholder: "Nhập địa chỉ" },
            { label: "Số điện thoại",      key: "phone"        as const, placeholder: "Nhập SĐT" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={s.fieldGroup}>
              <label style={s.label}>{label}</label>
              <input
                style={{
                  ...s.input,
                  borderColor: error && (key === "supplierId" || key === "supplierName")
                    && !form[key] ? "#f87171" : "#e2e8f0",
                }}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus={key === "supplierId"}
              />
            </div>
          ))}

          {error && (
            <div style={s.errorBox}>⚠️ {error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button style={s.btnCancel} onClick={onClose}>Hủy</button>
          <button style={{ ...s.btnSave, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? "⏳ Đang lưu..." : "💾 Lưu nhà cung cấp"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 99999,
    background: "rgba(15,23,42,0.45)",
    backdropFilter: "blur(2px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", borderRadius: 14,
    width: "min(96vw, 480px)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
    overflow: "hidden",
    animation: "fadeIn 0.15s ease",
  },
  header: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "20px 24px 16px",
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
  },
  eyebrow: {
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2,
  },
  title: { fontSize: 17, fontWeight: 800, color: "#fff" },
  closeBtn: {
    background: "rgba(255,255,255,0.15)", border: "none",
    color: "#fff", width: 30, height: 30, borderRadius: "50%",
    cursor: "pointer", fontSize: 13, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  body: { padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: "#475569" },
  input: {
    height: 38, padding: "0 12px",
    border: "1.5px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, color: "#1e293b", outline: "none",
    transition: "border-color 0.15s",
  },
  errorBox: {
    padding: "10px 14px", background: "#fff1f2",
    border: "1.5px solid #fca5a5", borderRadius: 8,
    color: "#b91c1c", fontSize: 13, fontWeight: 600,
  },
  footer: {
    display: "flex", gap: 10, justifyContent: "flex-end",
    padding: "16px 24px",
    borderTop: "1px solid #f1f5f9", background: "#fafafa",
  },
  btnCancel: {
    height: 38, padding: "0 20px", borderRadius: 8,
    border: "1.5px solid #e2e8f0", background: "#fff",
    color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  btnSave: {
    height: 38, padding: "0 20px", borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
};