// ============================================================
//  features/goods-category/components/GoodsCategoryPage.tsx
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useGoodsCategory } from "../hooks/useGoodsCategory";
import type {
  GoodsCategoryListDto,
  CreateGoodsCategoryRequest,
  UpdateGoodsCategoryRequest,
} from "../types/goodsCategory.types";

// ─────────────────────────────────────────────────────────────
//  SHARED UI PRIMITIVES
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
      <span style={{
        width: 6, height: 6, borderRadius: "50%", display: "inline-block",
        background: isInactive ? "#cbd5e1" : "#22c55e",
      }} />
      {isInactive ? "Ngừng hoạt động" : "Đang hoạt động"}
    </span>
  );
}

function GoodsCountBadge({ count }: { count: number }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: count > 0 ? "#eff6ff" : "#f8fafc",
      color:      count > 0 ? "#1d4ed8" : "#94a3b8",
      border:     `1px solid ${count > 0 ? "#bfdbfe" : "#e2e8f0"}`,
    }}>
      {count} hàng hóa
    </span>
  );
}

function Modal({ title, onClose, children, width = 480 }: {
  title:    string;
  onClose:  () => void;
  children: React.ReactNode;
  width?:   number;
}) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modalBox, width }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <span style={modalTitle}>{title}</span>
          <button style={modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={modalBody}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label:    string;
  required?: boolean;
  hint?:    string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={fieldLabel}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function GoodsCategoryPage() {
  const {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    modalMode, selected, detailLoading, submitLoading,
    confirmDelete, setConfirmDel,
    openCreate, openEdit, closeModal,
    handleCreate, handleUpdate, handleToggleStatus, handleDelete,
    toast,
  } = useGoodsCategory();

  const activeCount   = items.filter((i) => !i.isInactive).length;
  const inactiveCount = items.filter((i) =>  i.isInactive).length;

  return (
    <div style={s.page}>

      {/* ── Toast ── */}
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

      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Danh mục</div>
          <h1 style={s.heroTitle}>Nhóm Hàng Hóa</h1>
          <p style={s.heroSub}>Phân loại và quản lý danh mục hàng hóa trong kho</p>
        </div>
        <button
          style={{ ...s.btnNew, position: "relative", zIndex: 1 }}
          onClick={openCreate}
        >
          + Thêm nhóm hàng
        </button>
      </div>

      {/* ── Summary chips ── */}
      <div style={s.chipRow}>
        {[
          { label: "Tổng nhóm hàng",    value: total,        bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Đang hoạt động",     value: activeCount,  bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
          { label: "Ngừng hoạt động",    value: inactiveCount,bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
        ].map(({ label, value, bg, color, border }) => (
          <div key={label} style={{ ...s.chip, background: bg, color, border: `1.5px solid ${border}` }}>
            <span style={s.chipNum}>{value}</span>
            <span style={s.chipLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={s.filterBar}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Tìm kiếm</label>
          <input
            style={{ ...s.filterInput, minWidth: 240 }}
            placeholder="Mã nhóm, tên nhóm hàng..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
          />
        </div>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Trạng thái</label>
          <select
            style={s.filterInput}
            value={filters.isInactive}
            onChange={(e) => handleFilterChange("isInactive", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="false">Đang hoạt động</option>
            <option value="true">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              {[
                { label: "STT",           w: 52,  center: true  },
                { label: "Mã nhóm",       w: 130, center: false },
                { label: "Tên nhóm hàng", w: null,center: false },
                { label: "Số hàng hóa",   w: 130, center: true  },
                { label: "Trạng thái",    w: 160, center: true  },
                { label: "Thao tác",      w: 140, center: true  },
              ].map(({ label, w, center }) => (
                <th key={label} style={{
                  ...s.th,
                  width:     w ?? undefined,
                  textAlign: center ? "center" : "left",
                }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={s.statusCell}>
                <div style={s.spinner} />
                <div style={{ marginTop: 8, color: "#94a3b8" }}>Đang tải...</div>
              </td></tr>
            )}
            {!loading && listError && (
              <tr><td colSpan={6} style={{ ...s.statusCell, color: "#b91c1c" }}>
                ⚠️ {listError}
              </td></tr>
            )}
            {!loading && !listError && items.length === 0 && (
              <tr><td colSpan={6} style={s.statusCell}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <div style={{ color: "#64748b" }}>Chưa có nhóm hàng nào</div>
                <button style={{ ...s.btnNew, marginTop: 12 }} onClick={openCreate}>
                  + Thêm nhóm hàng đầu tiên
                </button>
              </td></tr>
            )}
            {!loading && items.map((item, i) => (
              <CategoryRow
                key={item.goodsGroupId}
                item={item}
                index={(page - 1) * PAGE_SIZE + i + 1}
                onEdit={() => openEdit(item.goodsGroupId)}
                onToggle={() => handleToggleStatus(item)}
                onDelete={() => setConfirmDel(item)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {total > 0 && (
        <div style={s.footer}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Tổng: <strong>{total}</strong> nhóm hàng
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

      {/* ── Modals ── */}
      {modalMode === "create" && (
        <CreateModal
          loading={submitLoading}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}
      {modalMode === "edit" && (
        <EditModal
          item={selected}
          loading={detailLoading || submitLoading}
          onClose={closeModal}
          onSubmit={(payload) => handleUpdate(selected!.goodsGroupId, payload)}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteModal
          item={confirmDelete}
          loading={submitLoading}
          onClose={() => setConfirmDel(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  TABLE ROW
// ─────────────────────────────────────────────────────────────
function CategoryRow({ item, index, onEdit, onToggle, onDelete }: {
  item:     GoodsCategoryListDto;
  index:    number;
  onEdit:   () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      style={{
        background: hover ? "#f0f4ff" : index % 2 === 0 ? "#fff" : "#fafbff",
        transition: "background 0.1s",
        opacity:    item.isInactive ? 0.65 : 1,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ ...s.td, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
        {index}
      </td>
      <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8", fontSize: 13 }}>
        {item.goodsGroupId}
      </td>
      <td style={{ ...s.td, fontWeight: 600, color: "#1e293b" }}>
        {item.goodsGroupName}
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <GoodsCountBadge count={item.goodsCount} />
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <StatusBadge isInactive={item.isInactive} />
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <button style={s.btnAction} onClick={onEdit} title="Chỉnh sửa">✏️</button>
          <button
            style={{
              ...s.btnAction,
              background: item.isInactive ? "#f0fdf4" : "#fff1f2",
              color:      item.isInactive ? "#15803d" : "#b91c1c",
              border:     `1px solid ${item.isInactive ? "#bbf7d0" : "#fca5a5"}`,
            }}
            onClick={onToggle}
            title={item.isInactive ? "Kích hoạt" : "Vô hiệu hóa"}
          >
            {item.isInactive ? "🟢" : "🔴"}
          </button>
          <button
            style={{
              ...s.btnAction,
              background: "#fff1f2", color: "#b91c1c", border: "1px solid #fca5a5",
              opacity: item.goodsCount > 0 ? 0.4 : 1,
              cursor:  item.goodsCount > 0 ? "not-allowed" : "pointer",
            }}
            onClick={item.goodsCount > 0 ? undefined : onDelete}
            title={item.goodsCount > 0 ? "Không thể xóa khi còn hàng hóa" : "Xóa"}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
//  CREATE MODAL
// ─────────────────────────────────────────────────────────────
function CreateModal({ loading, onClose, onSubmit }: {
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (p: CreateGoodsCategoryRequest) => void;
}) {
  const [form, setForm] = useState<CreateGoodsCategoryRequest>({
    goodsGroupId:   "",
    goodsGroupName: "",
  });

  return (
    <Modal title="📦 Thêm nhóm hàng mới" onClose={onClose}>
      <Field label="Mã nhóm hàng" required hint="Mã sẽ được tự động viết hoa. Ví dụ: THUCPHAM, DOGIA">
        <input
          style={inp}
          placeholder="VD: THUCPHAM"
          value={form.goodsGroupId}
          onChange={(e) => setForm((p) => ({
            ...p, goodsGroupId: e.target.value.toUpperCase()
          }))}
        />
      </Field>
      <Field label="Tên nhóm hàng" required>
        <input
          style={inp}
          placeholder="VD: Thực phẩm tươi sống"
          value={form.goodsGroupName}
          onChange={(e) => setForm((p) => ({ ...p, goodsGroupName: e.target.value }))}
        />
      </Field>
      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button
          style={{
            ...btnSave,
            opacity: (loading || !form.goodsGroupId || !form.goodsGroupName) ? 0.5 : 1,
          }}
          disabled={loading || !form.goodsGroupId || !form.goodsGroupName}
          onClick={() => onSubmit(form)}
        >
          {loading ? "⏳ Đang tạo..." : "📦 Tạo nhóm hàng"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  EDIT MODAL
// ─────────────────────────────────────────────────────────────
function EditModal({ item, loading, onClose, onSubmit }: {
  item:     import("../types/goodsCategory.types").GoodsCategoryDetailDto | null;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (p: UpdateGoodsCategoryRequest) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => { if (item) setName(item.goodsGroupName); }, [item]);

  if (loading && !item) return (
    <Modal title="Chỉnh sửa nhóm hàng" onClose={onClose}>
      <div style={s.statusCell}>⏳ Đang tải...</div>
    </Modal>
  );

  return (
    <Modal title={`✏️ Chỉnh sửa — ${item?.goodsGroupId}`} onClose={onClose}>
      {/* Mã nhóm — chỉ hiển thị, không cho sửa */}
      <div style={{
        padding: "10px 14px", borderRadius: 8, marginBottom: 16,
        background: "#f8fafc", border: "1.5px solid #e2e8f0",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Mã nhóm:</span>
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
          {item?.goodsGroupId}
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>
          (không thể thay đổi)
        </span>
      </div>

      <Field label="Tên nhóm hàng" required>
        <input
          style={inp}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>

      {/* Thống kê */}
      {item && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 16,
          background: "#eff6ff", border: "1.5px solid #bfdbfe",
          display: "flex", alignItems: "center", gap: 8, fontSize: 13,
        }}>
          <span>📊</span>
          <span style={{ color: "#1d4ed8" }}>
            Nhóm này đang có <strong>{item.goodsCount}</strong> hàng hóa
          </span>
        </div>
      )}

      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button
          style={{ ...btnSave, opacity: (loading || !name.trim()) ? 0.5 : 1 }}
          disabled={loading || !name.trim()}
          onClick={() => onSubmit({ goodsGroupName: name })}
        >
          {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  CONFIRM DELETE MODAL
// ─────────────────────────────────────────────────────────────
function ConfirmDeleteModal({ item, loading, onClose, onConfirm }: {
  item:      GoodsCategoryListDto;
  loading:   boolean;
  onClose:   () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="🗑️ Xác nhận xóa" onClose={onClose} width={420}>
      <div style={{
        padding: "16px", borderRadius: 10,
        background: "#fff1f2", border: "1.5px solid #fca5a5",
        marginBottom: 16,
      }}>
        <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>
          Bạn có chắc chắn muốn xóa nhóm hàng này?
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          <strong style={{ color: "#1d4ed8" }}>{item.goodsGroupId}</strong>
          {" — "}{item.goodsGroupName}
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        ⚠️ Hành động này <strong>không thể hoàn tác</strong>.
        Chỉ xóa được khi nhóm hàng không có hàng hóa nào.
      </div>
      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy bỏ</button>
        <button
          style={{
            ...btnSave,
            background: "linear-gradient(135deg,#b91c1c,#dc2626)",
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
          onClick={onConfirm}
        >
          {loading ? "⏳ Đang xóa..." : "🗑️ Xóa nhóm hàng"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px 28px", minHeight: "100vh",
    background: "#f8f9ff", fontFamily: "sans-serif", fontSize: 14,
  },
  toast: {
    position: "fixed", top: 20, right: 24, zIndex: 99999,
    padding: "12px 20px", borderRadius: 10,
    fontWeight: 600, fontSize: 13,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  },
  hero: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#059669 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 16,
    boxShadow: "0 8px 24px rgba(6,78,59,0.28)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  heroOrb1: {
    position: "absolute", top: -40, right: 160,
    width: 160, height: 160, borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
  },
  heroOrb2: {
    position: "absolute", bottom: -30, left: 60,
    width: 110, height: 110, borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
  },
  heroEyebrow: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" },
  heroSub:   { fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 },
  btnNew: {
    height: 38, padding: "0 22px", borderRadius: 9,
    border: "2px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.15)",
    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  chipRow:  { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" as const },
  chip:     { display: "flex", flexDirection: "column" as const, alignItems: "center",
    gap: 3, padding: "12px 20px", borderRadius: 10, minWidth: 120 },
  chipNum:  { fontSize: 22, fontWeight: 800 },
  chipLabel:{ fontSize: 11, fontWeight: 600 },
  filterBar:{
    display: "flex", gap: 12, alignItems: "flex-end",
    marginBottom: 14, flexWrap: "wrap" as const,
    background: "#fff", padding: "14px 16px",
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  filterGroup: { display: "flex", flexDirection: "column" as const, gap: 4 },
  filterLabel: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  filterInput: {
    height: 36, padding: "0 10px",
    border: "1.5px solid #e2e8f0", borderRadius: 7,
    fontSize: 13, background: "#fff", minWidth: 160, outline: "none",
  },
  tableCard: {
    overflowX: "auto" as const, background: "#fff",
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 14,
  },
  table:  { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    padding: "11px 14px",
    background: "linear-gradient(180deg,#064e3b,#065f46)",
    color: "#fff", fontWeight: 600, fontSize: 11,
    whiteSpace: "nowrap" as const, letterSpacing: "0.04em",
    borderBottom: "2px solid #064e3b",
  },
  td:         { padding: "10px 14px", borderBottom: "1px solid #f1f5f9" },
  statusCell: {
    padding: "56px 0", textAlign: "center" as const,
    color: "#94a3b8",
  },
  spinner: {
    width: 28, height: 28, margin: "0 auto",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #059669",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", background: "#fff",
    borderRadius: 10, border: "1px solid #e2e8f0",
  },
  pageBtn: {
    width: 30, height: 30, border: "1.5px solid #e2e8f0",
    borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14,
  },
  btnAction: {
    width: 32, height: 32, border: "1px solid #e2e8f0",
    borderRadius: 7, background: "#f8fafc", cursor: "pointer",
    fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
};

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const modalBox: React.CSSProperties = {
  background: "#fff", borderRadius: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  maxHeight: "90vh", overflowY: "auto",
};
const modalHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "18px 24px 0",
};
const modalTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#1e293b" };
const modalClose: React.CSSProperties = {
  width: 28, height: 28, border: "none",
  background: "#f1f5f9", color: "#64748b",
  borderRadius: 7, cursor: "pointer", fontSize: 12,
};
const modalBody: React.CSSProperties  = { padding: "16px 24px 24px" };
const modalFooter: React.CSSProperties= {
  display: "flex", justifyContent: "flex-end", gap: 10,
  paddingTop: 16, marginTop: 8, borderTop: "1px solid #f1f5f9",
};
const inp: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 7,
  fontSize: 13, outline: "none", boxSizing: "border-box",
};
const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#475569", marginBottom: 6,
};
const btnCancel: React.CSSProperties = {
  height: 36, padding: "0 20px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const btnSave: React.CSSProperties = {
  height: 36, padding: "0 24px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg,#064e3b,#059669)",
  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
};