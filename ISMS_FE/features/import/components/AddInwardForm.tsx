// ============================================================
//  features/inward/components/AddInwardForm.tsx
//  Phiếu nhập kho — hỗ trợ: Mua hàng | Hàng bán bị trả lại
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
import { useAuthStore }         from "@/store/authStore";
import type {
  PaymentOption,
  InwardReason,
  GoodsSearchResult,
} from "../types/import.types";

export default function AddInwardForm() {
  const [reason, setReason] = useState<InwardReason>("PURCHASE");

  // ── Lấy thông tin người dùng đang đăng nhập ──────────────
  const { user } = useAuthStore();
  const currentUserId   = user?.userId   ?? "";
  const currentUserName = user?.fullName ?? "";

  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
 } = useInwardForm({
  userId:       currentUserId,
  userFullName: currentUserName,
});

  const { warehouses }    = useWarehouseList();
  const saleVoucherLookup = useSaleVoucherLookup();

  // ── Khi đổi lý do → cập nhật voucherCode ────────────────
  const handleReasonChange = (r: InwardReason) => {
    setReason(r);
    const payment = r === "OTHER" ? "CASH" : paymentOption;
    if (r === "OTHER") handlePaymentChange("CASH");
    setField("voucherCode", getVoucherCodeByReason(r, payment));
    saleVoucherLookup.clearLookup();
  };

  // ── Khi tìm thấy phiếu bán → auto-fill toàn bộ bảng ────
  useEffect(() => {
    const result = saleVoucherLookup.lookupResult;
    if (!result || reason !== "SALES_RETURN") return;

    setField("customerName",       result.customerName);
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);

    const creditAcc = getCreditAccountByPayment(paymentOption);
    const newItems = result.items.map((d) => ({
      goodsId:          d.goodsId,
      goodsName:        d.goodsName,
      unit:             d.unit,
      quantity:         d.quantity,
      unitPrice:        d.unitPrice,
      amount1:          d.amount1,
      vat:              d.vat,
      promotion:        d.promotion,
      debitAccount1:    "156",
      creditAccount1:   creditAcc,
      debitWarehouseId: d.creditWarehouseId,
      debitAccount2:    "1331",
      creditAccount2:   creditAcc,
      userId:           currentUserId,          // ← gán userId thực
      createdDateTime:  new Date().toISOString(),
    }));

    replaceAllItems([...newItems, createEmptyItemShim(creditAcc)]);
  }, [saleVoucherLookup.lookupResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const createEmptyItemShim = (creditAcc: string) => ({
    goodsId: "", goodsName: "", unit: "",
    quantity: 1, unitPrice: 0, amount1: 0, vat: 10, promotion: 0,
    debitAccount1: "156", creditAccount1: creditAcc,
    debitWarehouseId: "", debitAccount2: "1331", creditAccount2: creditAcc,
    userId: currentUserId,                        // ← gán userId thực
    createdDateTime: new Date().toISOString(),
  });

  // ── Autocomplete hàng hóa ───────────────────────────────
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

  // Khởi tạo 1 dòng trống
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current) { addItem(); initialized.current = true; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dropdowns khi thêm / xóa item
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
        <div style={s.heroOrb} />
        <div style={s.heroOrb2} />
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
            style={{
              height: 38,
              padding: "0 36px 0 12px",
              border: "1.5px solid #c7d7ff",
              borderRadius: 8,
              background: "#eff6ff",
              color: "#2255cc",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              minWidth: 220,
            }}
          >
            {(["PURCHASE", "SALES_RETURN", "OTHER"] as InwardReason[]).map((r) => (
              <option key={r} value={r}>
                {r === "PURCHASE" ? "🛒 " : r === "SALES_RETURN" ? "↩️ " : "📝 "}
                {INWARD_REASON_LABELS[r]}
              </option>
            ))}
          </select>
          <span style={{
            padding: "4px 12px",
            background: "#f0f4ff",
            color: "#555",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            fontSize: 12,
          }}>
            Mã CT: <strong style={{ color: "#2255cc" }}>
              {getVoucherCodeByReason(reason, paymentOption)}
            </strong>
          </span>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Tra cứu phiếu bán ── */}
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
                style={{
                  ...styles.btnPrimary,
                  padding: "8px 20px",
                  minWidth: 110,
                  opacity: saleVoucherLookup.lookupLoading ? 0.6 : 1,
                }}
                onClick={saleVoucherLookup.handleLookup}
                disabled={saleVoucherLookup.lookupLoading}
              >
                {saleVoucherLookup.lookupLoading ? "⏳ Đang tìm..." : "🔍 Tra cứu"}
              </button>
              {saleVoucherLookup.lookupResult && (
                <button
                  style={{ ...styles.btnDanger, padding: "8px 14px" }}
                  onClick={saleVoucherLookup.clearLookup}
                  title="Xóa kết quả và nhập lại"
                >
                  ✕ Xóa
                </button>
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
                <span style={s.lookupInfo}>
                  Phiếu <strong>{saleVoucherLookup.lookupResult.voucherId}</strong>
                  {" · "}Khách: <strong>{saleVoucherLookup.lookupResult.customerName}</strong>
                  {" · "}Ngày: <strong>{new Date(saleVoucherLookup.lookupResult.voucherDate).toLocaleDateString("vi-VN")}</strong>
                  {" · "}{saleVoucherLookup.lookupResult.items.length} sản phẩm
                  {" → "}đã tự động điền vào bảng bên dưới
                </span>
              </div>
            )}
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ── Hình thức thanh toán (chỉ hiện khi Mua hàng) ── */}
      {reason === "PURCHASE" && (
        <>
          <section style={s.card}>
            <h3 style={s.cardTitle}><span style={s.titleDot} />Hình thức thanh toán</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {(["UNPAID", "CASH", "BANK"] as PaymentOption[]).map((opt) => (
                <label key={opt} style={styles.radioLabel}>
                  <input
                    type="radio" value={opt}
                    checked={paymentOption === opt}
                    onChange={() => handlePaymentChange(opt)}
                    style={{ marginRight: 6 }}
                  />
                  {PAYMENT_LABELS[opt]}
                </label>
              ))}
            </div>
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ── Thông tin phiếu ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin phiếu nhập</h3>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Số phiếu *</label>
            <input
              style={styles.input}
              value={voucher.voucherId}
              onChange={(e) => setField("voucherId", e.target.value)}
              placeholder="Tự sinh, có thể sửa"
            />
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 }}>
            <label style={styles.label}>Ngày nhập kho *</label>
            <input
              type="date" style={styles.input}
              value={voucher.voucherDate}
              onChange={(e) => setField("voucherDate", e.target.value)}
            />
          </div>
        </div>

        {/* Người lập phiếu — chỉ đọc, tự điền từ auth */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Người lập phiếu</label>
          <input
            style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
            value={currentUserName}
            readOnly
          />
        </div>

        {[
          { label: isSalesReturn ? "Mã khách hàng" : "Mã nhà cung cấp",
            field: "customerId" as const,
            placeholder: isSalesReturn ? "Tự điền từ phiếu bán" : "Nhập mã NCC" },
          { label: isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *",
            field: "customerName" as const,
            placeholder: isSalesReturn ? "Tự điền từ phiếu bán" : "Nhập tên NCC" },
          { label: "Mã số thuế",  field: "taxCode"           as const, placeholder: "Nhập MST"       },
          { label: "Địa chỉ",    field: "address"            as const, placeholder: "Nhập địa chỉ"   },
          { label: "Diễn giải",  field: "voucherDescription" as const, placeholder: "Nhập diễn giải" },
        ].map(({ label, field, placeholder }) => (
          <div key={field} style={styles.fieldGroup}>
            <label style={styles.label}>{label}</label>
            <input
              style={styles.input}
              placeholder={placeholder}
              value={voucher[field] as string}
              onChange={(e) => setField(field, e.target.value)}
            />
          </div>
        ))}

        {paymentOption === "BANK" && reason === "PURCHASE" && (
          <>
            {[
              { label: "Số tài khoản ngân hàng *", field: "bankAccountNumber" as const, placeholder: "Nhập số TK" },
              { label: "Tên tài khoản ngân hàng *", field: "bankName"         as const, placeholder: "Nhập tên TK" },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={styles.fieldGroup}>
                <label style={styles.label}>{label}</label>
                <input
                  style={styles.input} placeholder={placeholder}
                  value={(voucher[field] as string) ?? ""}
                  onChange={(e) => setField(field, e.target.value)}
                />
              </div>
            ))}
          </>
        )}
      </section>

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}>
          Chi tiết hàng hóa
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
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            background: message.includes("thành công") ? "#f0fdf4" : "#fff1f2",
            color: message.includes("thành công") ? "#15803d" : "#b91c1c",
            border: `1.5px solid ${message.includes("thành công") ? "#bbf7d0" : "#fca5a5"}`,
          }}>
            {message.includes("thành công") ? "✅" : "⚠️"} {message}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Local styles ── */
const s: Record<string, React.CSSProperties> = {
  heroBanner: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)",
    borderRadius: 14,
    padding: "22px 28px",
    marginBottom: 20,
    boxShadow: "0 8px 24px rgba(109,40,217,0.28)",
  },
  heroOrb: {
    position: "absolute",
    top: -40, right: -40,
    width: 180, height: 180,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
  },
  heroOrb2: {
    position: "absolute",
    bottom: -30, left: 80,
    width: 120, height: 120,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22, fontWeight: 800,
    color: "#fff", margin: 0,
    letterSpacing: "-0.3px",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    maxWidth: 860,
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 14,
    marginTop: 0,
  },
  titleDot: {
    display: "inline-block",
    width: 10, height: 10,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    flexShrink: 0,
  },
  lookupResult: {
    marginTop: 10,
    padding: "12px 16px",
    background: "#f0fdf4",
    border: "1.5px solid #86efac",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
  },
  lookupBadge: {
    padding: "3px 12px",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 20,
    fontWeight: 700,
    fontSize: 11,
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
  },
  lookupInfo: { color: "#166534", fontSize: 13 },
  autoFilledBadge: {
    marginLeft: 10,
    padding: "3px 12px",
    background: "#eff6ff",
    color: "#4f46e5",
    border: "1.5px solid #c7d7ff",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
};