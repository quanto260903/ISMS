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
import { useInwardForm }           from "../hooks/useInwardForm";
import { useGoodsSearch }          from "../hooks/useGoodsSearch";
import { useWarehouseList }        from "../hooks/useWarehouseList";
import { useSaleVoucherLookup }    from "../hooks/useSaleVoucherLookup";
import InwardItemTable             from "./InwardItemTable";
import type {
  PaymentOption,
  InwardReason,
  GoodsSearchResult,
} from "../types/import.types";

export default function AddInwardForm() {
  const [reason, setReason] = useState<InwardReason>("PURCHASE");

  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  } = useInwardForm();

  const { warehouses }  = useWarehouseList();
  const saleVoucherLookup = useSaleVoucherLookup();

  // ── Khi đổi lý do → cập nhật voucherCode, reset payment về CASH nếu OTHER ──
  const handleReasonChange = (r: InwardReason) => {
    setReason(r);
    const payment = r === "OTHER" ? "CASH" : paymentOption;
    if (r === "OTHER") handlePaymentChange("CASH");
    setField("voucherCode", getVoucherCodeByReason(r, payment));
    saleVoucherLookup.clearLookup();
  };

  // ── Khi tìm thấy phiếu bán → auto-fill toàn bộ bảng ──
  useEffect(() => {
    const result = saleVoucherLookup.lookupResult;
    if (!result || reason !== "SALES_RETURN") return;

    // Điền thông tin khách hàng từ phiếu bán
    setField("customerName",       result.customerName);
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);

    // Build danh sách InwardItem từ chi tiết phiếu bán gốc
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
      // Kho nhập lại = kho xuất bán ban đầu (creditWarehouseId → debitWarehouseId)
      debitWarehouseId: d.creditWarehouseId,
      debitAccount2:    "1331",
      creditAccount2:   creditAcc,
      userId:           "",
      createdDateTime:  new Date().toISOString(),
    }));

    // Thêm 1 dòng trống ở cuối để giữ đúng pattern auto-add
    replaceAllItems([...newItems, createEmptyItemShim(creditAcc)]);

  }, [saleVoucherLookup.lookupResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shim dòng trống — dùng nội bộ khi replace items
  const createEmptyItemShim = (creditAcc: string) => ({
    goodsId: "", goodsName: "", unit: "",
    quantity: 1, unitPrice: 0, amount1: 0, vat: 10, promotion: 0,
    debitAccount1: "156", creditAccount1: creditAcc,
    debitWarehouseId: "", debitAccount2: "1331", creditAccount2: creditAcc,
    userId: "", createdDateTime: new Date().toISOString(),
  });

  // ── Autocomplete hàng hóa (dùng cho mua hàng) ──
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
      <h2 style={styles.title}>Thêm mới phiếu nhập kho</h2>

      {/* ── Lý do nhập kho ── */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Lý do nhập kho</h3>
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
          {/* Badge hiển thị VoucherCode tương ứng */}
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

      {/* ── Tra cứu phiếu bán (chỉ hiện khi chọn Hàng bán bị trả lại) ── */}
      {isSalesReturn && (
        <>
          <section style={{ ...styles.section, maxWidth: 860 }}>
            <h3 style={styles.sectionTitle}>Số hóa đơn bán hàng gốc</h3>
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

            {/* Lỗi */}
            {saleVoucherLookup.lookupError && (
              <p style={{ color: "#cc2222", fontSize: 13, marginTop: 6 }}>
                ⚠️ {saleVoucherLookup.lookupError}
              </p>
            )}

            {/* Kết quả tra cứu */}
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
          <section style={{ ...styles.section, maxWidth: 860 }}>
            <h3 style={styles.sectionTitle}>Hình thức thanh toán</h3>
            <div style={{ display: "flex", gap: 24 }}>
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
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Thông tin phiếu nhập</h3>

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

        {[
          { label: isSalesReturn ? "Mã khách hàng" : "Mã nhà cung cấp",
            field: "customerId" as const,
            placeholder: isSalesReturn ? "Tự điền từ phiếu bán" : "Nhập mã NCC" },
          { label: isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *",
            field: "customerName" as const,
            placeholder: isSalesReturn ? "Tự điền từ phiếu bán" : "Nhập tên NCC" },
          { label: "Mã số thuế",  field: "taxCode"           as const, placeholder: "Nhập MST"        },
          { label: "Địa chỉ",    field: "address"            as const, placeholder: "Nhập địa chỉ"    },
          { label: "Diễn giải",  field: "voucherDescription" as const, placeholder: "Nhập diễn giải"  },
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
              { label: "Tên tài khoản ngân hàng *", field: "bankName"          as const, placeholder: "Nhập tên TK" },
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
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
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

      <button style={styles.btnPrimary} onClick={handleSubmit}>
        Lưu phiếu nhập kho
      </button>

      {message && (
        <p style={{
          ...styles.message,
          color: message.includes("thành công") ? "#16a34a" : "#cc2222",
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

/* ── Local styles ── */
const s: Record<string, React.CSSProperties> = {
  lookupResult: {
    marginTop: 10,
    padding: "10px 14px",
    background: "#f0fff4",
    border: "1px solid #86efac",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
  },
  lookupBadge: {
    padding: "2px 10px",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  lookupInfo: {
    color: "#166534",
  },
  autoFilledBadge: {
    marginLeft: 10,
    padding: "2px 10px",
    background: "#eff6ff",
    color: "#2255cc",
    border: "1px solid #c7d7ff",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
  },
};