// ============================================================
//  features/sale/components/AddSaleForm.tsx
//  Orchestrator: kết nối các hooks với UI components
// ============================================================

"use client";

import React, { useEffect } from "react";
import styles from "@/shared/styles/sale.styles";
import { PAYMENT_LABELS } from "../constants/sale.constants";
import { calcAmount } from "../constants/sale.constants";
import { useSaleForm }        from "../hooks/useSaleForm";
import { useGoodsSearch }     from "../hooks/useGoodsSearch";
import { useWarehouseReport } from "../hooks/useWarehouseReport";
import SaleItemTable          from "./SaleItemTable";
import WarehouseReportModal   from "./WarehouseReportModal";
import type { PaymentOption, GoodsSearchResult } from "../types/sale.types";

export default function AddSaleForm() {
  // Truyền userId từ auth context vào đây (thay "" bằng userId thực tế)
  const {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem,
    handleSubmit,
  } = useSaleForm(/* userId từ auth */);

  const { report, fetchReport, closeReport } = useWarehouseReport();

  // Khi user chọn 1 lô trong modal → điền ngược warehouseId + offsetVoucher vào dòng sản phẩm
  const handleSelectWarehouse = (
    itemIndex: number,
    row: import("../types/sale.types").WarehouseTransactionDto
  ) => {
    updateItem(itemIndex, "creditWarehouseId", row.warehouseId ?? "");
    updateItem(itemIndex, "offsetVoucher",     row.offsetVoucher ?? "");
  };

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    const currentItem = voucher.items[index];
    const updated = {
      ...currentItem,
      goodsId:   goods.goodsId,
      goodsName: goods.goodsName,
      unit:      goods.unit,
      unitPrice: goods.salePrice,
    };
    updated.amount1 = calcAmount(updated);
    updateItem(index, "goodsId",   updated.goodsId);
    updateItem(index, "goodsName", updated.goodsName);
    updateItem(index, "unit",      updated.unit);
    updateItem(index, "unitPrice", updated.unitPrice);
  };

  const goodsSearch = useGoodsSearch({
    itemCount: voucher.items.length,
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  // Khởi tạo 1 dòng trống khi form load
  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current && voucher.items.length === 0) {
      addItem();
      initialized.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dropdowns khi thêm / xóa item
  const prevLengthRef = React.useRef(voucher.items.length);
  useEffect(() => {
    const cur  = voucher.items.length;
    const prev = prevLengthRef.current;
    if (cur > prev) goodsSearch.addDropdown();
    if (cur < prev) goodsSearch.removeDropdown(cur);
    prevLengthRef.current = cur;
  }, [voucher.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.container}>
      {/* ── Hero header ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb} />
        <div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Xuất hàng</div>
          <h1 style={s.heroTitle}>Tạo đơn bán hàng</h1>
        </div>
      </div>

      {/* ── Hình thức thanh toán ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Hình thức thanh toán</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(["CASH", "BANK", "UNPAID"] as PaymentOption[]).map((opt) => (
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

      {/* ── Thông tin chứng từ ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin chứng từ</h3>

        {/* Các trường map 1-1 với backend */}
        {[
          { label: "Số chứng từ *",    field: "voucherId"          as const, placeholder: "Tự sinh, có thể sửa"   },
          { label: "Mã khách hàng *",  field: "customerId"         as const, placeholder: "Nhập mã khách hàng"    },
          { label: "Tên khách hàng *", field: "customerName"       as const, placeholder: "Nhập tên khách hàng"   },
          { label: "Mã số thuế",       field: "taxCode"            as const, placeholder: "Nhập mã số thuế"       },
          { label: "Địa chỉ *",        field: "address"            as const, placeholder: "Nhập địa chỉ"          },
          { label: "Diễn giải *",      field: "voucherDescription" as const, placeholder: "Nhập diễn giải"        },
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

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Ngày chứng từ *</label>
          <input
            type="date" style={styles.input}
            value={voucher.voucherDate}
            onChange={(e) => setField("voucherDate", e.target.value)}
          />
        </div>

        {/* Thông tin ngân hàng — chỉ hiện khi chọn BANK */}
        {paymentOption === "BANK" && (
          <>
            {[
              { label: "Số tài khoản ngân hàng *", field: "bankAccountNumber" as const, placeholder: "Nhập số tài khoản"  },
              { label: "Tên tài khoản ngân hàng *", field: "bankName"         as const, placeholder: "Nhập tên tài khoản" },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={styles.fieldGroup}>
                <label style={styles.label}>{label}</label>
                <input
                  style={styles.input}
                  placeholder={placeholder}
                  value={(voucher[field] as string) ?? ""}
                  onChange={(e) => setField(field, e.target.value)}
                />
              </div>
            ))}
          </>
        )}
      </section>

      <hr style={styles.hr} />

      {/* ── Danh sách sản phẩm ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Danh sách sản phẩm</h3>

        <div style={{ marginBottom: 10 }}>
          <button
            onClick={addItem}
            style={{
              background: "#7c3aed",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            + Thêm sản phẩm
          </button>
        </div>

        {voucher.items.length > 0 && (
          <SaleItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
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
            onSetDropdownOpen={(index, open) =>
              goodsSearch.dropdowns[index] !== undefined &&
              goodsSearch.setDropdownPos(open ? goodsSearch.dropdownPos : null)
            }
            onViewWarehouse={fetchReport}
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
              <span>Tổng thuế VAT:</span>
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

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button style={styles.btnPrimary} onClick={handleSubmit}>
          💾 Lưu chứng từ
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

      <WarehouseReportModal
        report={report}
        onClose={closeReport}
        onSelectWarehouse={handleSelectWarehouse}
      />
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
};