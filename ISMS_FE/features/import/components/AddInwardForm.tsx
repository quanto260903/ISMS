// ============================================================
//  features/inward/components/AddInwardForm.tsx
// ============================================================

"use client";

import React, { useEffect, useState } from "react";
import styles from "@/shared/styles/sale.styles";
import {
  PAYMENT_LABELS,
  INWARD_REASON_LABELS,
  getVoucherCodeByReason,
  getCreditAccountByPayment,
} from "../constants/import.constants";
import { useInwardForm }        from "../hooks/useInwardForm";
import { useGoodsSearch }       from "../hooks/useGoodsSearch";
import { useWarehouseList }     from "../hooks/useWarehouseList";
import { useSaleVoucherLookup } from "../hooks/useSaleVoucherLookup";
import InwardItemTable          from "./InwardItemTable";
import SupplierSearchInput      from "@/shared/components/supplier/SupplierSearchInput";
import SupplierDropdown         from "@/shared/components/supplier/SupplierDropdown";
import CreateSupplierModal      from "@/shared/components/supplier/CreateSupplierModal";
import { useSupplierSearch }    from "@/shared/hooks/supplier/useSupplierSearch";
import { useAuthStore }         from "@/store/authStore";
import type {
  PaymentOption,
  InwardReason,
  GoodsSearchResult,
} from "../types/import.types";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

export default function AddInwardForm() {
  const [reason, setReason] = useState<InwardReason>("PURCHASE");

  const { user } = useAuthStore();
  const currentUserId   = String(user?.userId   ?? "");
  const currentUserName = user?.fullName ?? "";

  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  } = useInwardForm({ userId: currentUserId, userFullName: currentUserName });

  const { warehouses }    = useWarehouseList();
  const saleVoucherLookup = useSaleVoucherLookup();

  // ── Supplier search + modal ──────────────────────────────
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierQuery,     setSupplierQuery]     = useState("");

  const handleSelectSupplier = (supplier: SupplierSearchResult) => {
    setField("customerId",   supplier.supplierId);
    setField("customerName", supplier.supplierName);
    if (supplier.taxId)   setField("taxCode", supplier.taxId);
    if (supplier.address) setField("address", supplier.address);
    setSupplierQuery(supplier.supplierId);
  };

  const supplierSearch = useSupplierSearch({ onSelect: handleSelectSupplier });

  const handleReasonChange = (r: InwardReason) => {
    setReason(r);
    setField("voucherCode", getVoucherCodeByReason(r, paymentOption));
    saleVoucherLookup.clearLookup();
  };

  useEffect(() => {
    const result = saleVoucherLookup.lookupResult;
    if (!result || reason !== "SALES_RETURN") return;
    setField("customerName",       result.customerName);
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);
    const creditAcc = getCreditAccountByPayment(paymentOption);
    const newItems = result.items.map((d) => ({
      goodsId: d.goodsId, goodsName: d.goodsName, unit: d.unit,
      quantity: d.quantity, unitPrice: d.unitPrice, amount1: d.amount1,
      vat: d.vat, promotion: d.promotion,
      debitAccount1: "156", creditAccount1: creditAcc,
      debitWarehouseId: d.creditWarehouseId,
      debitAccount2: "1331", creditAccount2: creditAcc,
      userId: currentUserId, createdDateTime: new Date().toISOString(),
    }));
    replaceAllItems([...newItems, createEmptyItemShim(creditAcc)]);
  }, [saleVoucherLookup.lookupResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const createEmptyItemShim = (creditAcc: string) => ({
    goodsId: "", goodsName: "", unit: "",
    quantity: 1, unitPrice: 0, amount1: 0, vat: 10, promotion: 0,
    debitAccount1: "156", creditAccount1: creditAcc,
    debitWarehouseId: "", debitAccount2: "1331", creditAccount2: creditAcc,
    userId: currentUserId, createdDateTime: new Date().toISOString(),
  });

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem, onSelectGoods: handleSelectGoods, onAddItem: addItem,
  });

  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current) { addItem(); initialized.current = true; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const prevLengthRef = React.useRef(voucher.items.length);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev) for (let i = 0; i < cur - prev; i++) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSalesReturn = reason === "SALES_RETURN";

  return (
    <div style={styles.container}>

      {/* ── Hero header ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Nhập kho</div>
          <h1 style={s.heroTitle}>Thêm mới phiếu nhập kho</h1>
        </div>
      </div>

      {/* ── Lý do nhập kho ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Lý do nhập kho</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value as InwardReason)}
            style={s.reasonSelect}
          >
            {(["PURCHASE", "SALES_RETURN"] as InwardReason[]).map((r) => (
              <option key={r} value={r}>
                {r === "PURCHASE" ? "🛒 " : "↩️ "}
                {INWARD_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          <span style={s.codeBadge}>
            Mã CT: <strong style={{ color: "#2255cc" }}>
              {getVoucherCodeByReason(reason, paymentOption)}
            </strong>
          </span>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Tra cứu phiếu bán (chỉ khi SALES_RETURN) ── */}
      {isSalesReturn && (
        <>
          <section style={s.card}>
            <h3 style={s.cardTitle}><span style={s.titleDot} />Số hóa đơn bán hàng gốc</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ ...styles.fieldGroup, flex: 1, marginBottom: 0 }}>
                <label style={styles.label}>Số hóa đơn bán hàng *</label>
                <input
                  style={styles.input}
                  placeholder="Nhập số phiếu bán, VD: BH12345678"
                  value={saleVoucherLookup.saleVoucherId}
                  onChange={(e) => saleVoucherLookup.setSaleVoucherId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saleVoucherLookup.handleLookup()}
                />
              </div>
              <button
                style={{ ...styles.btnPrimary, padding: "8px 20px", minWidth: 110,
                  opacity: saleVoucherLookup.lookupLoading ? 0.6 : 1 }}
                onClick={saleVoucherLookup.handleLookup}
                disabled={saleVoucherLookup.lookupLoading}
              >
                {saleVoucherLookup.lookupLoading ? "⏳ Đang tìm..." : "🔍 Tra cứu"}
              </button>
              {saleVoucherLookup.lookupResult && (
                <button style={{ ...styles.btnDanger, padding: "8px 14px" }}
                  onClick={saleVoucherLookup.clearLookup} title="Xóa kết quả">✕ Xóa</button>
              )}
            </div>
            {saleVoucherLookup.lookupError && (
              <p style={{ color: "#cc2222", fontSize: 13, marginTop: 6 }}>
                ⚠️ {saleVoucherLookup.lookupError}
              </p>
            )}
            {saleVoucherLookup.lookupResult && (
              <div style={s.lookupResult}>
                <span style={s.lookupBadge}>✅ Đã tìm thấy</span>
                <span style={{ color: "#166534", fontSize: 13 }}>
                  Phiếu <strong>{saleVoucherLookup.lookupResult.voucherId}</strong>
                  {" · "}Khách: <strong>{saleVoucherLookup.lookupResult.customerName}</strong>
                  {" · "}{saleVoucherLookup.lookupResult.items.length} sản phẩm
                  {" → "}đã tự động điền vào bảng bên dưới
                </span>
              </div>
            )}
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          THÔNG TIN PHIẾU NHẬP
          Layout 2 cột giống MISA:
          - Trái (~65%): NCC, Tên NCC, MST, Địa chỉ, Diễn giải
          - Phải (~35%): Số phiếu, Ngày nhập kho, Người lập
          ════════════════════════════════════════════════════════ */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin phiếu nhập</h3>

        <div style={s.twoCol}>

          {/* ── CỘT TRÁI ── */}
          <div style={s.colLeft}>

            {/* Mã NCC */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                {isSalesReturn ? "Mã khách hàng" : "Nhà cung cấp *"}
              </label>
              {!isSalesReturn ? (
                <div style={{ flex: 1 }}>
                <SupplierSearchInput
                  value={supplierQuery}
                  loading={supplierSearch.dropdown.loading}
                  inputRef={supplierSearch.inputRef}
                  onChange={(val) => {
                    setSupplierQuery(val);
                    setField("customerId", val);
                    supplierSearch.handleChange(val);
                  }}
                  onFocus={supplierSearch.handleFocus}
                  onAddNew={() => setShowSupplierModal(true)}
                  placeholder="Nhập mã NCC để tìm kiếm..."
                />
                </div>
              ) : (
                <input
                  style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
                  value={voucher.customerId ?? ""}
                  readOnly
                  placeholder="Tự điền từ phiếu bán"
                />
              )}
            </div>

            {/* Tên NCC */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                {isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *"}
              </label>
              <input
                style={{
                  ...styles.input,
                  background:  isSalesReturn ? "#f5f5f5" : voucher.customerName ? "#f0fdf4" : "#fff",
                  color:       isSalesReturn ? "#555"    : voucher.customerName ? "#15803d" : "#64748b",
                  fontWeight:  !isSalesReturn && voucher.customerName ? 600 : 400,
                  borderColor: !voucher.customerName ? "#fca5a5" : "#e2e8f0",
                }}
                placeholder={isSalesReturn ? "Tự điền từ phiếu bán" : "Tự điền khi chọn NCC, hoặc nhập tay"}
                value={voucher.customerName ?? ""}
                readOnly={isSalesReturn}
                onChange={(e) => !isSalesReturn && setField("customerName", e.target.value)}
              />
            </div>

            {/* Diễn giải */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Diễn giải</label>
              <input style={styles.input} placeholder="Nhập diễn giải"
                value={(voucher.voucherDescription as string) ?? ""}
                onChange={(e) => setField("voucherDescription", e.target.value)} />
            </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Mã số thuế</label>
                <input style={styles.input} placeholder="Nhập MST"
                  value={(voucher.taxCode as string) ?? ""}
                  onChange={(e) => setField("taxCode", e.target.value)} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Địa chỉ</label>
                <input style={styles.input} placeholder="Nhập địa chỉ"
                  value={(voucher.address as string) ?? ""}
                  onChange={(e) => setField("address", e.target.value)} />
              </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={s.divider} />

          {/* ── CỘT PHẢI ── */}
          <div style={s.colRight}>

            {/* Số phiếu */}
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Số phiếu *</label>
              <input style={{ ...styles.input, ...s.rightInput,
                fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace" }}
                value={voucher.voucherId}
                onChange={(e) => setField("voucherId", e.target.value)}
                placeholder="Tự sinh, có thể sửa"
              />
            </div>

            {/* Ngày nhập kho */}
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Ngày nhập kho *</label>
              <input type="date" style={{ ...styles.input, ...s.rightInput }}
                value={voucher.voucherDate}
                onChange={(e) => setField("voucherDate", e.target.value)}
              />
            </div>

            {/* Người lập phiếu */}
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Người lập phiếu</label>
              <input style={{ ...styles.input, ...s.rightInput,
                background: "#f5f5f5", color: "#555" }}
                value={currentUserName}
                readOnly
              />
            </div>

          </div>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}>
          <span style={s.titleDot} />Chi tiết hàng hóa
          {isSalesReturn && saleVoucherLookup.lookupResult && (
            <span style={s.autoFilledBadge}>✨ Tự động điền từ phiếu bán</span>
          )}
        </h3>

        {voucher.items.length > 0 && (
          <InwardItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            warehouses={warehouses}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(index, value, voucher.items.length)
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
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
        <button style={styles.btnPrimary} onClick={handleSubmit}>
          💾 Lưu phiếu nhập kho
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

      {/* ── Portal dropdown NCC ── */}
      <SupplierDropdown
        dropdown={supplierSearch.dropdown}
        dropdownPos={supplierSearch.dropdownPos}
        dropdownRef={supplierSearch.dropdownRef}
        onSelect={(sup) => {
          handleSelectSupplier(sup);
          supplierSearch.handleSelect(sup);
        }}
        onAddNew={() => setShowSupplierModal(true)}
        query={supplierQuery}
      />

      {showSupplierModal && (
        <CreateSupplierModal
          initialId={supplierQuery}
          onClose={() => setShowSupplierModal(false)}
          onCreated={(sup) => {
            handleSelectSupplier(sup);
            setShowSupplierModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  heroBanner: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 20,
    boxShadow: "0 8px 24px rgba(109,40,217,0.28)",
  },
  heroOrb:  { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2: { position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:   { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
    padding: "20px 24px", marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 700, color: "#475569",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 14, marginTop: 0,
  },
  titleDot: {
    display: "inline-block", width: 10, height: 10, borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #6366f1)", flexShrink: 0,
  },

  // ── 2-column layout ──────────────────────────────────────
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr auto 320px",  // trái linh hoạt | divider | phải cố định 320px
    gap: 0,
    alignItems: "flex-start",
    minWidth: 0,  // ngăn overflow
  },
  colLeft: {
    minWidth: 0,
    paddingRight: 20,
    overflow: "hidden",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    background: "#e2e8f0",
    margin: "0 4px",
  },
  colRight: {
    width: 320,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    flexShrink: 0,
  },
  // Label + input theo hàng ngang (giống MISA bên phải)
  rightRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 10,
  },
  rightLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    width: 120,
    flexShrink: 0,
  },
  rightInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    borderBottom: "1.5px solid #e2e8f0",
    borderRadius: 0,
    background: "transparent",
    padding: "4px 0",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box" as const,
  },

  // Các style cũ giữ nguyên
  reasonSelect: {
    height: 38, padding: "0 36px 0 12px",
    border: "1.5px solid #c7d7ff", borderRadius: 8,
    background: "#eff6ff", color: "#2255cc",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", minWidth: 220,
  },
  codeBadge: {
    padding: "4px 12px", background: "#f0f4ff",
    color: "#555", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 12,
  },
  lookupResult: {
    marginTop: 10, padding: "12px 16px", background: "#f0fdf4",
    border: "1.5px solid #86efac", borderRadius: 10,
    display: "flex", alignItems: "center", gap: 12, fontSize: 13,
  },
  lookupBadge: {
    padding: "3px 12px", background: "#16a34a", color: "#fff",
    borderRadius: 20, fontWeight: 700, fontSize: 11,
    whiteSpace: "nowrap" as const, letterSpacing: "0.04em",
  },
  autoFilledBadge: {
    marginLeft: 10, padding: "3px 12px", background: "#eff6ff",
    color: "#4f46e5", border: "1.5px solid #c7d7ff",
    borderRadius: 20, fontSize: 11, fontWeight: 700,
  },
};