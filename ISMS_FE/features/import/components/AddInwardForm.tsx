// ============================================================
//  features/inward/components/AddInwardForm.tsx
//  Orchestrator — phiếu nhập kho
// ============================================================

"use client";

import React, { useEffect } from "react";
import styles from "@/shared/styles/sale.styles";
import { PAYMENT_LABELS } from "../constants/import.constants";
import { useInwardForm }    from "../hooks/useInwardForm";
import { useGoodsSearch }   from "../hooks/useGoodsSearch";
import { useWarehouseList } from "../hooks/useWarehouseList";
import InwardItemTable      from "./InwardItemTable";
import type { PaymentOption, GoodsSearchResult } from "../types/import.types";

export default function AddInwardForm() {
  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem,
    handleSubmit,
  } = useInwardForm(/* userId từ auth */);

  const { warehouses } = useWarehouseList();

  // Khi chọn hàng từ dropdown → điền goodsName + unit vào dòng
  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
    // Đơn giá nhập để trống — người dùng tự nhập giá mua thực tế
  };

  const goodsSearch = useGoodsSearch({
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  // Khởi tạo 1 dòng trống khi form load
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current) { addItem(); initialized.current = true; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dropdowns khi thêm / xóa item
  const prevLengthRef = React.useRef(voucher.items.length);
  useEffect(() => {
    const cur = voucher.items.length, prev = prevLengthRef.current;
    if (cur > prev) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Thêm mới phiếu nhập kho</h2>

      {/* ── Hình thức thanh toán ── */}
      {/* <section style={{ ...styles.section, maxWidth: 860 }}>
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
      </section> */}

      <hr style={styles.hr} />

      {/* ── Thông tin phiếu ── */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Thông tin phiếu nhập</h3>

        {/* Row 1: Số phiếu + Ngày */}
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

        {/* Nhà cung cấp */}
        {[
          { label: "Mã nhà cung cấp", field: "customerId"   as const, placeholder: "Nhập mã NCC"         },
          { label: "Tên nhà cung cấp *", field: "customerName" as const, placeholder: "Nhập tên NCC"      },
          { label: "Mã số thuế",      field: "taxCode"      as const, placeholder: "Nhập MST"             },
          { label: "Địa chỉ",         field: "address"      as const, placeholder: "Nhập địa chỉ NCC"     },
          { label: "Diễn giải",       field: "voucherDescription" as const, placeholder: "Nhập diễn giải" },
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

        {/* Ngân hàng */}
        {paymentOption === "BANK" && (
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

      {/* ── Thông tin hóa đơn mua hàng ── */}
        {/* <section style={{ ...styles.section, maxWidth: 860 }}>
          <h3 style={styles.sectionTitle}>Thông tin hóa đơn mua hàng</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Ký hiệu</label>
              <input
                style={styles.input} placeholder="VD: 1C24TYY"
                value={voucher.invoiceSymbol}
                onChange={(e) => setField("invoiceSymbol", e.target.value)}
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Số hóa đơn</label>
              <input
                style={styles.input} placeholder="Nhập số hóa đơn"
                value={voucher.invoiceNumber}
                onChange={(e) => setField("invoiceNumber", e.target.value)}
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Ngày hóa đơn</label>
              <input
                type="date" style={styles.input}
                value={voucher.invoiceDate}
                onChange={(e) => setField("invoiceDate", e.target.value)}
              />
            </div>
          </div>
        </section> */}

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Chi tiết hàng hóa</h3>

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

        {/* Tổng kết */}
        {voucher.items.length > 0 && (
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Tổng tiền hàng (chưa VAT):</span>
              <strong>{totalAmount.toLocaleString("vi-VN")} ₫</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Tổng thuế VAT đầu vào:</span>
              <strong>{totalVat.toLocaleString("vi-VN")} ₫</strong>
            </div>
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Tổng thanh toán:</span>
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