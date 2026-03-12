// ============================================================
//  shared/components/supplier/SupplierSearchInput.tsx
//  Chỉ render ô input mã NCC + nút +
//  Dropdown portal do form cha render (xem SupplierDropdown)
// ============================================================

"use client";

import React from "react";

interface Props {
  value:        string;
  loading?:     boolean;
  inputRef:     React.RefObject<HTMLInputElement>;
  onChange:     (value: string) => void;
  onFocus:      (e: React.FocusEvent<HTMLInputElement>) => void;
  onAddNew:     () => void;
  disabled?:    boolean;
  placeholder?: string;
}

export default function SupplierSearchInput({
  value, loading, inputRef,
  onChange, onFocus, onAddNew,
  disabled, placeholder = "Nhập mã NCC để tìm kiếm...",
}: Props) {
  return (
    <div style={s.row}>
      <div style={s.inputWrap}>
        <input
          ref={inputRef}
          style={{
            ...s.input,
            background:   disabled ? "#f5f5f5" : "#fff",
            color:        disabled ? "#555"    : "#1e293b",
            paddingRight: loading  ? 32        : 12,
          }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && <span style={s.spinner}>⏳</span>}
      </div>

      <button
        type="button"
        style={s.addBtn}
        onClick={onAddNew}
        title="Tạo mới nhà cung cấp"
      >
        +
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  row:      { display: "flex", alignItems: "center", gap: 8 },
  inputWrap:{ position: "relative", flex: 1 },
  input: {
    width: "100%", height: 38, padding: "0 12px",
    border: "1.5px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  spinner: {
    position: "absolute", right: 8, top: "50%",
    transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none",
  },
  addBtn: {
    width: 38, height: 38, flexShrink: 0,
    border: "1.5px solid #6d28d9", borderRadius: 8,
    background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
    color: "#fff", fontSize: 20, fontWeight: 700,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};