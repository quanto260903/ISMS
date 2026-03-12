// ============================================================
//  features/export/components/EditExportForm.tsx
// ============================================================

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import { EXPORT_REASON_LABELS, getVoucherCodeByReason } from "../constants/export.constants";
import { useExportForm }        from "../hooks/useExportForm";
import { useExportDetail }      from "../hooks/useExportDetail";
import { useGoodsSearch }       from "../hooks/useGoodsSearch";
import { useWarehouseList }     from "../hooks/useWarehouseList";
import { useWarehouseReport }   from "@/features/sale/hooks/useWarehouseReport";
import ExportItemTable, { type ExportItemWithLot } from "./ExportItemTable";
import WarehouseReportModal     from "@/features/sale/components/WarehouseReportModal";
import { useAuthStore }         from "@/store/authStore";
import type { ExportReason, GoodsSearchResult } from "../types/export.types";
import type { WarehouseTransactionDto } from "@/features/sale/types/sale.types";

interface Props { voucherId: string }

export default function EditExportForm({ voucherId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId   = user?.userId   ?? "";
  const currentUserName = user?.fullName ?? "";

  const { data: initialData, loading: detailLoading, error: detailError } =
    useExportDetail(voucherId);

  const {
    voucher, reason, message, loading, isEditMode,
    totalAmount, totalVat,
    setField, handleReasonChange,
    addItem, removeItem, updateItem,
    handleSubmit,
  } = useExportForm({
    userId:       currentUserId,
    userFullName: currentUserName,
    initialData:  initialData ?? undefined,
    onSuccess:    () => setTimeout(() => router.push("/dashboard/export"), 1200),
  });

  const { warehouses }                        = useWarehouseList();
  const { report, fetchReport, closeReport }  = useWarehouseReport();

  // ── Khi chọn lô từ modal → điền creditWarehouseId + offsetVoucher ────
  const handleSelectWarehouse = (itemIndex: number, row: WarehouseTransactionDto) => {
    const matched = warehouses.find(
      (w) => w.warehouseName === row.warehouseName || w.warehouseId === row.warehouseName
    );
    if (matched) updateItem(itemIndex, "creditWarehouseId", matched.warehouseId);
    if (row.offsetVoucher) updateItem(itemIndex, "offsetVoucher", row.offsetVoucher);
  };

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  const prevLengthRef = React.useRef(voucher.items.length);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev) for (let i = 0; i < cur - prev; i++) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (detailLoading)
    return <div style={s.statusBox}>⏳ Đang tải phiếu xuất...</div>;
  if (detailError)
    return <div style={{ ...s.statusBox, color: "#b91c1c" }}>⚠️ {detailError}</div>;

  return (
    <div style={styles.container}>
      {/* ── Hero header ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Xuất kho · Chỉnh sửa</div>
          <h1 style={s.heroTitle}>Sửa phiếu xuất kho</h1>
        </div>
      </div>

      {/* ── Lý do xuất kho ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Lý do xuất kho</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select value={reason}
            onChange={(e) => handleReasonChange(e.target.value as ExportReason)}
            style={s.reasonSelect}>
            {(["IMPORT_RETURN", "OTHER"] as ExportReason[]).map((r) => (
              <option key={r} value={r}>
                {r === "IMPORT_RETURN" ? "↩️ " : "📝 "}{EXPORT_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          <span style={s.codeBadge}>
            Mã CT: <strong style={{ color: "#2255cc" }}>{getVoucherCodeByReason(reason)}</strong>
          </span>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Thông tin phiếu ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin phiếu xuất</h3>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Số phiếu</label>
            <input style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
              value={voucher.voucherId} readOnly />
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Ngày xuất kho *</label>
            <input type="date" style={styles.input} value={voucher.voucherDate}
              onChange={(e) => setField("voucherDate", e.target.value)} />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Người lập phiếu</label>
          <input style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
            value={currentUserName} readOnly />
        </div>

        {([
          { label: "Mã đối tượng",    field: "customerId"         as const, placeholder: "Nhập mã khách/NCC" },
          { label: "Tên đối tượng *", field: "customerName"       as const, placeholder: "Nhập tên khách/NCC" },
          { label: "Mã số thuế",      field: "taxCode"             as const, placeholder: "Nhập MST" },
          { label: "Địa chỉ",         field: "address"             as const, placeholder: "Nhập địa chỉ" },
          { label: "Diễn giải",       field: "voucherDescription"  as const, placeholder: "Nhập diễn giải" },
        ] as const).map(({ label, field, placeholder }) => (
          <div key={field} style={styles.fieldGroup}>
            <label style={styles.label}>{label}</label>
            <input style={styles.input} placeholder={placeholder}
              value={voucher[field] as string}
              onChange={(e) => setField(field, e.target.value)} />
          </div>
        ))}
      </section>

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Chi tiết hàng hóa</h3>

        {voucher.items.length > 0 && (
          <ExportItemTable
            items={voucher.items as ExportItemWithLot[]}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            warehouses={warehouses}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(index, value)
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
            onViewWarehouse={fetchReport}
          />
        )}

        {voucher.items.length > 0 && (
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Tổng tiền hàng (chưa VAT):</span>
              <strong>{totalAmount.toLocaleString("vi-VN")} ₫</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Tổng thuế VAT:</span>
              <strong>{totalVat.toLocaleString("vi-VN")} ₫</strong>
            </div>
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Tổng cộng:</span>
              <strong>{(totalAmount + totalVat).toLocaleString("vi-VN")} ₫</strong>
            </div>
          </div>
        )}
      </section>

      <hr style={styles.hr} />

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button style={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
        {message && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13,
            background: message.includes("thành công") ? "#f0fdf4" : "#fff1f2",
            color:      message.includes("thành công") ? "#15803d" : "#b91c1c",
            border: `1.5px solid ${message.includes("thành công") ? "#bbf7d0" : "#fca5a5"}`,
          }}>
            {message.includes("thành công") ? "✅" : "⚠️"} {message}
          </div>
        )}
      </div>

      {/* ── WarehouseReportModal — tái sử dụng từ sale ── */}
      <WarehouseReportModal
        report={report}
        onClose={closeReport}
        onSelectWarehouse={handleSelectWarehouse}
      />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  statusBox: { padding: "40px", textAlign: "center", fontSize: 15, color: "#64748b" },
  heroBanner: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #1d4ed8 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 20,
    boxShadow: "0 8px 24px rgba(15,118,110,0.28)",
  },
  heroOrb:  { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2: { position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:   { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  card: {
    background: "#fff", borderRadius: 12,
    border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)", maxWidth: 860,
  },
  cardTitle: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 700, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 14, marginTop: 0,
  },
  titleDot: {
    display: "inline-block", width: 10, height: 10, borderRadius: "50%",
    background: "linear-gradient(135deg, #0f766e, #0891b2)", flexShrink: 0,
  },
  reasonSelect: {
    height: 38, padding: "0 36px 0 12px",
    border: "1.5px solid #c7d7ff", borderRadius: 8,
    background: "#eff6ff", color: "#2255cc",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
    minWidth: 220,
  },
  codeBadge: {
    padding: "4px 12px", background: "#f0f4ff",
    color: "#555", border: "1px solid #e0e0e0",
    borderRadius: 6, fontSize: 12,
  },
};