// ============================================================
//  features/suppliers/components/SupplierManagementPage.tsx
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useSupplierManagement } from "../hooks/useSupplierManagement";
import type {
  SupplierListDto, SupplierDetailDto,
  CreateSupplierRequest, UpdateSupplierRequest,
} from "../types/supplier.types";

// ─────────────────────────────────────────────────────────────
//  PRIMITIVES
// ─────────────────────────────────────────────────────────────
function StatusBadge({ isInactive }: { isInactive: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isInactive ? "#f8fafc"  : "#f0fdf4",
      color:      isInactive ? "#94a3b8"  : "#15803d",
      border:     `1px solid ${isInactive ? "#e2e8f0" : "#bbf7d0"}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block",
        background: isInactive ? "#cbd5e1" : "#22c55e" }} />
      {isInactive ? "Ngừng hợp tác" : "Đang hợp tác"}
    </span>
  );
}

function EnterpriseBadge({ isEnterprise }: { isEnterprise: boolean }) {
  if (!isEnterprise) return null;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 700,
      background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a",
    }}>🏢 Doanh nghiệp</span>
  );
}

function Modal({ title, onClose, children, width = 520 }: {
  title: string; onClose: () => void; children: React.ReactNode; width?: number;
}) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modalBox, width }} onClick={(e) => e.stopPropagation()}>
        <div style={mHeader}>
          <span style={mTitle}>{title}</span>
          <button style={mClose} onClick={onClose}>✕</button>
        </div>
        <div style={mBody}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fLabel}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SUPPLIER FORM
// ─────────────────────────────────────────────────────────────
function SupplierForm({ initial, isEdit, loading, onClose, onSubmit }: {
  initial:  Partial<CreateSupplierRequest>;
  isEdit:   boolean;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (p: CreateSupplierRequest | UpdateSupplierRequest) => void;
}) {
  const [form, setForm] = useState({
    supplierId:   initial.supplierId   ?? "",
    supplierName: initial.supplierName ?? "",
    phone:        initial.phone        ?? "",
    taxId:        initial.taxId        ?? "",
    address:      initial.address      ?? "",
    isEnterprise: initial.isEnterprise ?? false,
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));
  const disabled = loading || !form.supplierName.trim()
    || (!isEdit && !form.supplierId.trim());

  const submit = () => {
    const payload = {
      ...(isEdit ? {} : { supplierId: form.supplierId.trim().toUpperCase() }),
      supplierName: form.supplierName.trim(),
      phone:        form.phone   || undefined,
      taxId:        form.taxId   || undefined,
      address:      form.address || undefined,
      isEnterprise: form.isEnterprise,
    };
    onSubmit(payload as CreateSupplierRequest | UpdateSupplierRequest);
  };

  return (
    <>
      {/* Loại hình */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {[
          { value: false, label: "👤 Cá nhân / Hộ KD", desc: "Nhà cung cấp cá nhân" },
          { value: true,  label: "🏢 Doanh nghiệp",    desc: "Công ty, tổ chức" },
        ].map((opt) => (
          <div key={String(opt.value)}
            style={{
              flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${form.isEnterprise === opt.value ? "#0369a1" : "#e2e8f0"}`,
              background: form.isEnterprise === opt.value ? "#f0f9ff" : "#fafbff",
              transition: "all 0.15s",
            }}
            onClick={() => set("isEnterprise", opt.value)}
          >
            <div style={{ fontWeight: 700, fontSize: 13,
              color: form.isEnterprise === opt.value ? "#0369a1" : "#1e293b" }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{opt.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        {!isEdit && (
          <Field label="Mã nhà cung cấp" required>
            <input style={inp} placeholder="VD: NCC001"
              value={form.supplierId}
              onChange={(e) => set("supplierId", e.target.value.toUpperCase())} />
          </Field>
        )}
        <div style={{ gridColumn: isEdit ? "1 / -1" : undefined }}>
          <Field label="Tên nhà cung cấp" required>
            <input style={inp} placeholder="Tên công ty hoặc cá nhân..."
              value={form.supplierName}
              onChange={(e) => set("supplierName", e.target.value)} />
          </Field>
        </div>
        <Field label="Số điện thoại">
          <input style={inp} placeholder="0901234567"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Mã số thuế">
          <input style={inp} placeholder="0123456789"
            value={form.taxId}
            onChange={(e) => set("taxId", e.target.value)} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Địa chỉ">
            <input style={inp} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
              value={form.address}
              onChange={(e) => set("address", e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={mFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button style={{ ...btnSave, opacity: disabled ? 0.5 : 1 }}
          disabled={disabled} onClick={submit}>
          {loading ? "⏳ Đang lưu..." : isEdit ? "💾 Lưu thay đổi" : "✨ Tạo nhà cung cấp"}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function SupplierManagementPage() {
  const {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    modalMode, selected, detailLoading, submitLoading,
    confirmDelete, setConfirmDel,
    openCreate, openEdit, closeModal,
    handleCreate, handleUpdate, handleToggleStatus, handleDelete,
    toast,
  } = useSupplierManagement();

  return (
    <div style={s.page}>

      {/* Toast */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.ok ? "#f0fdf4" : "#fff1f2",
          color:      toast.ok ? "#15803d" : "#b91c1c",
          border:     `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}`,
        }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.orb1} /><div style={s.orb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.eyebrow}>Danh mục</div>
          <h1 style={s.heroTitle}>Quản lý Nhà Cung Cấp</h1>
          <p style={s.heroSub}>Quản lý thông tin và trạng thái hợp tác với nhà cung cấp</p>
        </div>
        <button style={{ ...s.btnNew, position: "relative", zIndex: 1 }} onClick={openCreate}>
          + Thêm nhà cung cấp
        </button>
      </div>

      {/* Chips */}
      <div style={s.chipRow}>
        {[
          { label: "Tổng NCC",        value: total,                                       bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Đang hợp tác",    value: items.filter((i) => !i.isInactive).length,   bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
          { label: "Doanh nghiệp",    value: items.filter((i) => i.isEnterprise).length,  bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
          { label: "Ngừng hợp tác",   value: items.filter((i) => i.isInactive).length,    bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
        ].map(({ label, value, bg, color, border }) => (
          <div key={label} style={{ ...s.chip, background: bg, color, border: `1.5px solid ${border}` }}>
            <span style={s.chipNum}>{value}</span>
            <span style={s.chipLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={s.filterBar}>
        <div style={s.fg}>
          <label style={s.fl}>Tìm kiếm</label>
          <input style={{ ...s.fi, minWidth: 240 }}
            placeholder="Mã, tên, SĐT, mã số thuế..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)} />
        </div>
        <div style={s.fg}>
          <label style={s.fl}>Loại hình</label>
          <select style={s.fi} value={filters.isEnterprise}
            onChange={(e) => handleFilterChange("isEnterprise", e.target.value)}>
            <option value="">Tất cả</option>
            <option value="true">Doanh nghiệp</option>
            <option value="false">Cá nhân / Hộ KD</option>
          </select>
        </div>
        <div style={s.fg}>
          <label style={s.fl}>Trạng thái</label>
          <select style={s.fi} value={filters.isInactive}
            onChange={(e) => handleFilterChange("isInactive", e.target.value)}>
            <option value="">Tất cả</option>
            <option value="false">Đang hợp tác</option>
            <option value="true">Ngừng hợp tác</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              {[
                { h: "STT",        w: 48,  c: true  },
                { h: "Mã NCC",     w: 110, c: false },
                { h: "Tên nhà cung cấp", w: null, c: false },
                { h: "SĐT",        w: 120, c: false },
                { h: "Mã số thuế", w: 130, c: false },
                { h: "Địa chỉ",    w: 200, c: false },
                { h: "Trạng thái", w: 150, c: true  },
                { h: "Thao tác",   w: 120, c: true  },
              ].map(({ h, w, c }) => (
                <th key={h} style={{ ...s.th, width: w ?? undefined, textAlign: c ? "center" : "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={s.statusCell}>
                <div style={s.spinner} />
                <div style={{ color: "#94a3b8", marginTop: 8 }}>Đang tải...</div>
              </td></tr>
            )}
            {!loading && listError && (
              <tr><td colSpan={8} style={{ ...s.statusCell, color: "#b91c1c" }}>⚠️ {listError}</td></tr>
            )}
            {!loading && !listError && items.length === 0 && (
              <tr><td colSpan={8} style={s.statusCell}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
                <div style={{ color: "#64748b" }}>Chưa có nhà cung cấp nào</div>
                <button style={{ ...s.btnNew, marginTop: 12 }} onClick={openCreate}>
                  + Thêm nhà cung cấp đầu tiên
                </button>
              </td></tr>
            )}
            {!loading && items.map((item, i) => (
              <SupplierRow
                key={item.supplierId}
                item={item}
                index={(page - 1) * PAGE_SIZE + i + 1}
                onEdit={() => openEdit(item.supplierId)}
                onToggle={() => handleToggleStatus(item)}
                onDelete={() => setConfirmDel(item)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div style={s.footer}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Tổng: <strong>{total}</strong> nhà cung cấp
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
            </span>
            <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(1)}>⟪</button>
            <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(page - 1)}>‹</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalMode === "create" && (
        <Modal title="✨ Thêm nhà cung cấp mới" onClose={closeModal}>
          <SupplierForm
            initial={{}} isEdit={false} loading={submitLoading}
            onClose={closeModal}
            onSubmit={handleCreate as (p: CreateSupplierRequest | UpdateSupplierRequest) => void}
          />
        </Modal>
      )}

      {modalMode === "edit" && (
        <Modal title={`✏️ Chỉnh sửa — ${selected?.supplierId ?? ""}`} onClose={closeModal}>
          {detailLoading && !selected ? (
            <div style={s.statusCell}>⏳ Đang tải...</div>
          ) : (
            <SupplierForm
              initial={selected ? {
                supplierName: selected.supplierName ?? "",
                phone:        selected.phone        ?? "",
                taxId:        selected.taxId        ?? "",
                address:      selected.address      ?? "",
                isEnterprise: selected.isEnterprise,
              } : {}}
              isEdit loading={submitLoading}
              onClose={closeModal}
              onSubmit={(p) => handleUpdate(selected!.supplierId, p as UpdateSupplierRequest)}
            />
          )}
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="🗑️ Xác nhận xóa" onClose={() => setConfirmDel(null)} width={420}>
          <div style={{
            padding: "14px 16px", borderRadius: 10, marginBottom: 14,
            background: "#fff1f2", border: "1.5px solid #fca5a5",
          }}>
            <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>
              Bạn có chắc muốn xóa nhà cung cấp này?
            </div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              <strong style={{ color: "#1d4ed8" }}>{confirmDelete.supplierId}</strong>
              {" — "}{confirmDelete.supplierName}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            ⚠️ Dữ liệu liên quan (đơn hàng, lịch sử) sẽ không bị ảnh hưởng.
            Nên <strong>ngừng hợp tác</strong> thay vì xóa nếu có lịch sử giao dịch.
          </div>
          <div style={mFooter}>
            <button style={btnCancel} onClick={() => setConfirmDel(null)}>Hủy bỏ</button>
            <button
              style={{ ...btnSave, background: "linear-gradient(135deg,#b91c1c,#dc2626)", opacity: submitLoading ? 0.6 : 1 }}
              disabled={submitLoading} onClick={() => handleDelete(confirmDelete)}>
              {submitLoading ? "⏳ Đang xóa..." : "🗑️ Xóa nhà cung cấp"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  TABLE ROW
// ─────────────────────────────────────────────────────────────
function SupplierRow({ item, index, onEdit, onToggle, onDelete }: {
  item: SupplierListDto; index: number;
  onEdit: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      style={{ background: hover ? "#f0f4ff" : index % 2 === 0 ? "#fff" : "#fafbff",
        transition: "background 0.1s", opacity: item.isInactive ? 0.65 : 1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ ...s.td, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>{index}</td>
      <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8", fontSize: 12 }}>
        {item.supplierId}
      </td>
      <td style={s.td}>
        <div style={{ fontWeight: 600 }}>{item.supplierName ?? "—"}</div>
        {item.isEnterprise && (
          <div style={{ marginTop: 3 }}><EnterpriseBadge isEnterprise /></div>
        )}
      </td>
      <td style={{ ...s.td, fontSize: 13 }}>{item.phone ?? <span style={{ color: "#cbd5e1" }}>—</span>}</td>
      <td style={{ ...s.td, fontSize: 12, fontFamily: "monospace" }}>
        {item.taxId ?? <span style={{ color: "#cbd5e1" }}>—</span>}
      </td>
      <td style={{ ...s.td, fontSize: 12, color: "#64748b", maxWidth: 200 }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.address ?? <span style={{ color: "#cbd5e1" }}>—</span>}
        </div>
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <StatusBadge isInactive={item.isInactive} />
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
          <button style={s.act} onClick={onEdit} title="Chỉnh sửa">✏️</button>
          <button style={{
            ...s.act,
            background: item.isInactive ? "#f0fdf4" : "#fff7ed",
            border: `1px solid ${item.isInactive ? "#bbf7d0" : "#fed7aa"}`,
          }} onClick={onToggle} title={item.isInactive ? "Kích hoạt" : "Ngừng hợp tác"}>
            {item.isInactive ? "🟢" : "🔴"}
          </button>
          <button style={{ ...s.act, background: "#fff1f2", border: "1px solid #fca5a5" }}
            onClick={onDelete} title="Xóa">🗑️</button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:     { padding: "24px 28px", minHeight: "100vh", background: "#f8f9ff", fontFamily: "sans-serif", fontSize: 14 },
  toast:    { position: "fixed", top: 20, right: 24, zIndex: 99999, padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
  hero:     { position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#0c4a6e 0%,#075985 60%,#0369a1 100%)", borderRadius: 14, padding: "22px 28px", marginBottom: 16, boxShadow: "0 8px 24px rgba(7,89,133,0.28)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  orb1:     { position: "absolute", top: -40, right: 160, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" },
  orb2:     { position: "absolute", bottom: -30, left: 60, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.04)" },
  eyebrow:  { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  heroTitle:{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" },
  heroSub:  { fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 },
  btnNew:   { height: 38, padding: "0 22px", borderRadius: 9, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  chipRow:  { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" as const },
  chip:     { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, padding: "12px 20px", borderRadius: 10, minWidth: 120 },
  chipNum:  { fontSize: 22, fontWeight: 800 },
  chipLabel:{ fontSize: 11, fontWeight: 600 },
  filterBar:{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap" as const, background: "#fff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  fg:       { display: "flex", flexDirection: "column" as const, gap: 4 },
  fl:       { fontSize: 11, color: "#64748b", fontWeight: 600 },
  fi:       { height: 36, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, background: "#fff", minWidth: 150, outline: "none" },
  tableCard:{ overflowX: "auto" as const, background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 14 },
  table:    { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th:       { padding: "11px 14px", background: "linear-gradient(180deg,#0c4a6e,#075985)", color: "#fff", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" as const, letterSpacing: "0.04em", borderBottom: "2px solid #0c4a6e" },
  td:       { padding: "10px 14px", borderBottom: "1px solid #f1f5f9" },
  statusCell:{ padding: "56px 0", textAlign: "center" as const, color: "#94a3b8" },
  spinner:  { width: 28, height: 28, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #0369a1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  footer:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0" },
  pageBtn:  { width: 30, height: 30, border: "1.5px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14 },
  act:      { width: 32, height: 32, border: "1px solid #e2e8f0", borderRadius: 7, background: "#f8fafc", cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center" },
};

const overlay: React.CSSProperties  = { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const modalBox: React.CSSProperties = { background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" };
const mHeader: React.CSSProperties  = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 0" };
const mTitle: React.CSSProperties   = { fontSize: 16, fontWeight: 700, color: "#1e293b" };
const mClose: React.CSSProperties   = { width: 28, height: 28, border: "none", background: "#f1f5f9", color: "#64748b", borderRadius: 7, cursor: "pointer", fontSize: 12 };
const mBody: React.CSSProperties    = { padding: "16px 24px 24px" };
const mFooter: React.CSSProperties  = { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, marginTop: 8, borderTop: "1px solid #f1f5f9" };
const inp: React.CSSProperties      = { width: "100%", height: 36, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" };
const fLabel: React.CSSProperties   = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 };
const btnCancel: React.CSSProperties= { height: 36, padding: "0 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const btnSave: React.CSSProperties  = { height: 36, padding: "0 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0c4a6e,#0369a1)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };