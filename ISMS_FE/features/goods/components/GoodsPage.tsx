// ============================================================
//  features/goods/components/GoodsPage.tsx
// ============================================================

"use client";

import React, { useState, useEffect } from "react";
import { useGoods } from "../hooks/useGoods";
import {
  VAT_OPTIONS, UNIT_SUGGESTIONS,
  type GoodsListDto, type CreateGoodsRequest, type UpdateGoodsRequest,
} from "../types/goods.types";
import type { GoodsCategoryListDto } from "@/features/goods-category/types/goodsCategory.types";
import type { GoodsDetailDto } from "../types/goods.types";

// ─────────────────────────────────────────────────────────────
//  PRIMITIVES
// ─────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("vi-VN") + "₫";

function Badge({ label, bg, color, border }: {
  label: string; bg: string; color: string; border: string;
}) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: bg, color,
      border: `1px solid ${border}`, whiteSpace: "nowrap" as const,
    }}>{label}</span>
  );
}

function Modal({ title, onClose, children, width = 600 }: {
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

function Field({ label, required, span, children }: {
  label: string; required?: boolean; span?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14, gridColumn: span ? "1 / -1" : undefined }}>
      <label style={fLabel}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  GOODS FORM (shared by Create & Edit)
// ─────────────────────────────────────────────────────────────
function GoodsForm({
  initial, isEdit, categories, loading, onClose, onSubmit,
}: {
  initial:    Partial<CreateGoodsRequest & { goodsId?: string }>;
  isEdit:     boolean;
  categories: GoodsCategoryListDto[];
  loading:    boolean;
  onClose:    () => void;
  onSubmit:   (payload: CreateGoodsRequest | UpdateGoodsRequest) => void;
}) {
  const [form, setForm] = useState({
    goodsId:            initial.goodsId            ?? "",
    goodsName:          initial.goodsName          ?? "",
    goodsGroupId:       initial.goodsGroupId        ?? "",
    unit:               initial.unit               ?? "",
    minimumStock:       initial.minimumStock        ?? "",
    fixedPurchasePrice: initial.fixedPurchasePrice  ?? "",
    salePrice:          initial.salePrice           ?? "",
    vatrate:            initial.vatrate             ?? "0%",
    isIncludeVat:       initial.isIncludeVat        ?? false,
    isPromotion:        initial.isPromotion         ?? false,
  });

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const disabled = loading || !form.goodsName.trim() || !form.unit.trim()
    || (!isEdit && !form.goodsId.trim());

  const submit = () => {
    const payload = {
      ...(isEdit ? {} : { goodsId: form.goodsId.trim().toUpperCase() }),
      goodsName:          form.goodsName.trim(),
      goodsGroupId:       form.goodsGroupId || undefined,
      unit:               form.unit.trim(),
      minimumStock:       form.minimumStock !== "" ? Number(form.minimumStock) : undefined,
      fixedPurchasePrice: form.fixedPurchasePrice !== "" ? Number(form.fixedPurchasePrice) : undefined,
      salePrice:          form.salePrice !== "" ? Number(form.salePrice) : undefined,
      vatrate:            form.vatrate,
      isIncludeVat:       form.isIncludeVat,
      isPromotion:        form.isPromotion,
    };
    onSubmit(payload as CreateGoodsRequest | UpdateGoodsRequest);
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        {!isEdit && (
          <Field label="Mã hàng hóa" required>
            <input style={inp} placeholder="VD: SP001"
              value={form.goodsId}
              onChange={(e) => set("goodsId", e.target.value.toUpperCase())} />
          </Field>
        )}
        <Field label="Tên hàng hóa" required span={isEdit}>
          <input style={inp} placeholder="Tên sản phẩm..."
            value={form.goodsName}
            onChange={(e) => set("goodsName", e.target.value)} />
        </Field>
        <Field label="Nhóm hàng">
          <select style={inp} value={form.goodsGroupId}
            onChange={(e) => set("goodsGroupId", e.target.value)}>
            <option value="">— Chưa phân nhóm —</option>
            {categories.map((c) => (
              <option key={c.goodsGroupId} value={c.goodsGroupId}>{c.goodsGroupName}</option>
            ))}
          </select>
        </Field>
        <Field label="Đơn vị tính" required>
          <input style={inp} list="unit-list" placeholder="Cái, Hộp, Kg..."
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)} />
          <datalist id="unit-list">
            {UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}
          </datalist>
        </Field>
        <Field label="Tồn kho tối thiểu">
          <input style={inp} type="number" min={0} placeholder="0"
            value={form.minimumStock}
            onChange={(e) => set("minimumStock", e.target.value)} />
        </Field>
        <Field label="Giá mua cố định (₫)">
          <input style={inp} type="number" min={0} placeholder="0"
            value={form.fixedPurchasePrice}
            onChange={(e) => set("fixedPurchasePrice", e.target.value)} />
        </Field>
        <Field label="Giá bán (₫)">
          <input style={inp} type="number" min={0} placeholder="0"
            value={form.salePrice}
            onChange={(e) => set("salePrice", e.target.value)} />
        </Field>
        <Field label="Thuế VAT">
          <select style={inp} value={form.vatrate}
            onChange={(e) => set("vatrate", e.target.value)}>
            {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", gap: 24, marginBottom: 18, marginTop: 4 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <input type="checkbox" checked={form.isIncludeVat}
            onChange={(e) => set("isIncludeVat", e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#1d4ed8" }} />
          <span style={{ fontWeight: 600, color: "#1e293b" }}>Giá đã bao gồm VAT</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <input type="checkbox" checked={form.isPromotion}
            onChange={(e) => set("isPromotion", e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "#f59e0b" }} />
          <span style={{ fontWeight: 600, color: "#1e293b" }}>Hàng khuyến mãi</span>
        </label>
      </div>

      <div style={mFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button style={{ ...btnSave, opacity: disabled ? 0.5 : 1 }}
          disabled={disabled} onClick={submit}>
          {loading ? "⏳ Đang lưu..." : isEdit ? "💾 Lưu thay đổi" : "✨ Tạo hàng hóa"}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function GoodsPage() {
  const {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    categories,
    modalMode, selected, detailLoading, submitLoading,
    confirmDelete, setConfirmDel,
    openCreate, openEdit, closeModal,
    handleCreate, handleUpdate, handleToggleStatus, handleDelete,
    toast,
  } = useGoods();

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
          <h1 style={s.heroTitle}>Quản lý Hàng Hóa</h1>
          <p style={s.heroSub}>Quản lý danh sách sản phẩm, giá cả và tồn kho</p>
        </div>
        <button style={{ ...s.btnNew, position: "relative", zIndex: 1 }} onClick={openCreate}>
          + Thêm hàng hóa
        </button>
      </div>

      {/* Chips */}
      <div style={s.chipRow}>
        {[
          { label: "Tổng hàng hóa",   value: total,                                      bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
          { label: "Đang kinh doanh",  value: items.filter((i) => !i.isInactive).length,  bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
          { label: "Hàng khuyến mãi",  value: items.filter((i) => i.isPromotion).length,  bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
          { label: "Ngừng kinh doanh", value: items.filter((i) => i.isInactive).length,   bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
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
          <input style={{ ...s.fi, minWidth: 220 }} placeholder="Mã hàng, tên hàng..."
            value={filters.keyword} onChange={(e) => handleFilterChange("keyword", e.target.value)} />
        </div>
        <div style={s.fg}>
          <label style={s.fl}>Nhóm hàng</label>
          <select style={s.fi} value={filters.goodsGroupId}
            onChange={(e) => handleFilterChange("goodsGroupId", e.target.value)}>
            <option value="">Tất cả nhóm</option>
            {categories.map((c) => (
              <option key={c.goodsGroupId} value={c.goodsGroupId}>{c.goodsGroupName}</option>
            ))}
          </select>
        </div>
        <div style={s.fg}>
          <label style={s.fl}>Trạng thái</label>
          <select style={s.fi} value={filters.isInactive}
            onChange={(e) => handleFilterChange("isInactive", e.target.value)}>
            <option value="">Tất cả</option>
            <option value="false">Đang kinh doanh</option>
            <option value="true">Ngừng kinh doanh</option>
          </select>
        </div>
        <div style={s.fg}>
          <label style={s.fl}>Khuyến mãi</label>
          <select style={s.fi} value={filters.isPromotion}
            onChange={(e) => handleFilterChange("isPromotion", e.target.value)}>
            <option value="">Tất cả</option>
            <option value="true">Đang KM</option>
            <option value="false">Không KM</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              {[
                { h: "STT",          w: 48,   c: true  },
                { h: "Mã hàng",      w: 110,  c: false },
                { h: "Tên hàng hóa", w: null, c: false },
                { h: "Nhóm",         w: 130,  c: false },
                { h: "ĐVT",          w: 70,   c: true  },
                { h: "Giá mua",      w: 120,  c: true  },
                { h: "Giá bán",      w: 120,  c: true  },
                { h: "Tồn kho",      w: 90,   c: true  },
                { h: "Trạng thái",   w: 150,  c: true  },
                { h: "Thao tác",     w: 120,  c: true  },
              ].map(({ h, w, c }) => (
                <th key={h} style={{ ...s.th, width: w ?? undefined, textAlign: c ? "center" : "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} style={s.statusCell}>
                <div style={s.spinner} />
                <div style={{ color: "#94a3b8", marginTop: 8 }}>Đang tải...</div>
              </td></tr>
            )}
            {!loading && listError && (
              <tr><td colSpan={10} style={{ ...s.statusCell, color: "#b91c1c" }}>⚠️ {listError}</td></tr>
            )}
            {!loading && !listError && items.length === 0 && (
              <tr><td colSpan={10} style={s.statusCell}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏷️</div>
                <div style={{ color: "#64748b" }}>Chưa có hàng hóa nào</div>
                <button style={{ ...s.btnNew, marginTop: 12 }} onClick={openCreate}>
                  + Thêm hàng hóa đầu tiên
                </button>
              </td></tr>
            )}
            {!loading && items.map((item, i) => (
              <GoodsRow
                key={item.goodsId}
                item={item}
                index={(page - 1) * PAGE_SIZE + i + 1}
                onEdit={() => openEdit(item.goodsId)}
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
            Tổng: <strong>{total}</strong> hàng hóa
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
        <Modal title="✨ Thêm hàng hóa mới" onClose={closeModal}>
          <GoodsForm
            initial={{}} isEdit={false}
            categories={categories} loading={submitLoading}
            onClose={closeModal} onSubmit={handleCreate as (p: CreateGoodsRequest | UpdateGoodsRequest) => void}
          />
        </Modal>
      )}

      {modalMode === "edit" && (
        <Modal title={`✏️ Chỉnh sửa — ${selected?.goodsId ?? ""}`} onClose={closeModal}>
          {detailLoading && !selected ? (
            <div style={s.statusCell}>⏳ Đang tải...</div>
          ) : (
            <GoodsForm
              initial={selected ? {
    ...selected,
    goodsGroupId:       selected.goodsGroupId       ?? undefined,
    minimumStock:       selected.minimumStock        ?? undefined,
    fixedPurchasePrice: selected.fixedPurchasePrice  ?? undefined,
    salePrice:          selected.salePrice           ?? undefined,
  } : {}} isEdit
              categories={categories} loading={submitLoading}
              onClose={closeModal}
              onSubmit={(p) => handleUpdate(selected!.goodsId, p as UpdateGoodsRequest)}
            />
          )}
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="🗑️ Xác nhận xóa" onClose={() => setConfirmDel(null)} width={420}>
          <div style={{
            padding: "14px 16px", borderRadius: 10,
            background: "#fff1f2", border: "1.5px solid #fca5a5", marginBottom: 14,
          }}>
            <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>
              Bạn có chắc muốn xóa hàng hóa này?
            </div>
            <div style={{ fontSize: 13, color: "#475569" }}>
              <strong style={{ color: "#1d4ed8" }}>{confirmDelete.goodsId}</strong>
              {" — "}{confirmDelete.goodsName}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            ⚠️ Hành động này <strong>không thể hoàn tác</strong>.
            Chỉ xóa được khi tồn kho = 0.
          </div>
          <div style={mFooter}>
            <button style={btnCancel} onClick={() => setConfirmDel(null)}>Hủy bỏ</button>
            <button
              style={{ ...btnSave, background: "linear-gradient(135deg,#b91c1c,#dc2626)", opacity: submitLoading ? 0.6 : 1 }}
              disabled={submitLoading} onClick={() => handleDelete(confirmDelete)}>
              {submitLoading ? "⏳ Đang xóa..." : "🗑️ Xóa hàng hóa"}
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
function GoodsRow({ item, index, onEdit, onToggle, onDelete }: {
  item:     GoodsListDto;
  index:    number;
  onEdit:   () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const stockColor = (item.itemOnHand ?? 0) === 0 ? "#ef4444"
    : (item.itemOnHand ?? 0) < (10) ? "#f59e0b" : "#15803d";

  return (
    <tr
      style={{ background: hover ? "#f0f4ff" : index % 2 === 0 ? "#fff" : "#fafbff",
        transition: "background 0.1s", opacity: item.isInactive ? 0.6 : 1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ ...s.td, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>{index}</td>
      <td style={{ ...s.td, fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8", fontSize: 12 }}>
        {item.goodsId}
      </td>
      <td style={{ ...s.td, fontWeight: 600 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {item.goodsName}
          {item.isPromotion && (
            <span style={{
              fontSize: 10, padding: "2px 6px", borderRadius: 10,
              background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontWeight: 700,
            }}>KM</span>
          )}
        </div>
      </td>
      <td style={{ ...s.td, fontSize: 12, color: "#64748b" }}>
        {item.goodsGroupName ?? <span style={{ color: "#cbd5e1" }}>—</span>}
      </td>
      <td style={{ ...s.td, textAlign: "center", fontSize: 12, fontWeight: 600 }}>{item.unit}</td>
      <td style={{ ...s.td, textAlign: "right", fontSize: 12, fontFamily: "monospace" }}>
        {fmt(item.fixedPurchasePrice)}
      </td>
      <td style={{ ...s.td, textAlign: "right", fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
        {fmt(item.salePrice)}
      </td>
      <td style={{ ...s.td, textAlign: "center", fontWeight: 700, color: stockColor }}>
        {item.itemOnHand ?? 0}
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        {item.isInactive
          ? <Badge label="Ngừng KD" bg="#f8fafc" color="#94a3b8" border="#e2e8f0" />
          : <Badge label="Đang KD"  bg="#f0fdf4" color="#15803d" border="#bbf7d0" />
        }
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
          <button style={s.act} onClick={onEdit} title="Chỉnh sửa">✏️</button>
          <button style={{
            ...s.act,
            background: item.isInactive ? "#f0fdf4" : "#fff7ed",
            border: `1px solid ${item.isInactive ? "#bbf7d0" : "#fed7aa"}`,
          }} onClick={onToggle} title={item.isInactive ? "Kích hoạt" : "Ngừng KD"}>
            {item.isInactive ? "🟢" : "🔴"}
          </button>
          <button style={{
            ...s.act, background: "#fff1f2", border: "1px solid #fca5a5",
            opacity: (item.itemOnHand ?? 0) > 0 ? 0.35 : 1,
            cursor:  (item.itemOnHand ?? 0) > 0 ? "not-allowed" : "pointer",
          }}
            onClick={(item.itemOnHand ?? 0) > 0 ? undefined : onDelete}
            title={(item.itemOnHand ?? 0) > 0 ? "Còn tồn kho, không thể xóa" : "Xóa"}>
            🗑️
          </button>
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
  hero:     { position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#312e81 0%,#4338ca 60%,#6366f1 100%)", borderRadius: 14, padding: "22px 28px", marginBottom: 16, boxShadow: "0 8px 24px rgba(67,56,202,0.28)", display: "flex", alignItems: "center", justifyContent: "space-between" },
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
  th:       { padding: "11px 14px", background: "linear-gradient(180deg,#312e81,#4338ca)", color: "#fff", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" as const, letterSpacing: "0.04em", borderBottom: "2px solid #312e81" },
  td:       { padding: "10px 14px", borderBottom: "1px solid #f1f5f9" },
  statusCell: { padding: "56px 0", textAlign: "center" as const, color: "#94a3b8" },
  spinner:  { width: 28, height: 28, margin: "0 auto", border: "3px solid #e2e8f0", borderTop: "3px solid #4338ca", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
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
const btnSave: React.CSSProperties  = { height: 36, padding: "0 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#312e81,#4338ca)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };