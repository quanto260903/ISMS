"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import {
  DEFAULT_CREDIT_ACCOUNT,
  INWARD_REASON_LABELS,
  QUARANTINE_BUCKET,
  getVoucherCodeByReason,
} from "../constants/import.constants";
import { useInwardForm } from "../hooks/useInwardForm";
import { useGoodsSearch } from "../hooks/useGoodsSearch";
import { useSaleVoucherSearch } from "../hooks/useSaleVoucherSearch";
import { getSurplusItems } from "@/features/stock-take/stockTake.api";
import InwardItemTable from "./InwardItemTable";
import SupplierSearchInput from "@/shared/components/supplier/SupplierSearchInput";
import SupplierDropdown from "@/shared/components/supplier/SupplierDropdown";
import CreateSupplierModal from "@/shared/components/supplier/CreateSupplierModal";
import { useSupplierSearch } from "@/shared/hooks/supplier/useSupplierSearch";
import { useAuthStore } from "@/store/authStore";
import type {
  GoodsSearchResult,
  InwardItem,
  InwardReason,
  SaleSearchResult,
  SaleVoucherLookup,
} from "../types/import.types";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

function createEmptyItem(userId: string): InwardItem {
  return {
    goodsId: "",
    goodsName: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
    amount1: 0,
    promotion: 0,
    debitAccount1: "156",
    creditAccount1: DEFAULT_CREDIT_ACCOUNT,
    debitAccount2: "1331",
    creditAccount2: DEFAULT_CREDIT_ACCOUNT,
    userId,
    createdDateTime: new Date().toISOString(),
  };
}

export default function AddInwardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromStockTakeId = searchParams.get("fromStockTake");
  const isFromStockTake =
    !!fromStockTakeId && searchParams.get("reason") === "NK3";

  const [reason, setReason] = useState<InwardReason>(
    isFromStockTake ? "STOCK_TAKE" : "PURCHASE",
  );
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleVoucherLookup | null>(null);

  const { user } = useAuthStore();
  const currentUserId = String(user?.userId ?? "");
  const currentUserName = user?.fullName ?? "";

  const reasonRef = useRef(reason);
  reasonRef.current = reason;

  const {
    voucher,
    message,
    loading,
    totalAmount,
    setField,
    handleReasonChange,
    addItem,
    removeItem,
    updateItem,
    replaceAllItems,
    handleSubmit,
  } = useInwardForm({
    userId: currentUserId,
    onSuccess: () => {
      if (fromStockTakeId) {
        localStorage.setItem(`nk3_done_${fromStockTakeId}`, "true");
      }
      setTimeout(() => router.push("/dashboard/import"), 1500);
    },
  });

  const saleReturnSearch = useSaleVoucherSearch({ onSelect: setSelectedSale });

  const handleSelectSupplier = (supplier: SupplierSearchResult) => {
    setField("customerId", supplier.supplierId);
    setField("customerName", supplier.supplierName);
    setField("taxCode", supplier.taxId ?? "");
    setField("address", supplier.address ?? "");
    setSupplierQuery(supplier.supplierId);
  };

  const supplierSearch = useSupplierSearch({ onSelect: handleSelectSupplier });

  const onReasonChange = (nextReason: InwardReason) => {
    setReason(nextReason);
    handleReasonChange(nextReason);

    saleReturnSearch.clearSearch();
    setSelectedSale(null);

    setField("customerId", "");
    setField("customerName", "");
    setField("taxCode", "");
    setField("address", "");
    setField("voucherDescription", "");
    setSupplierQuery("");

    replaceAllItems(
      nextReason === "PURCHASE" ? [createEmptyItem(currentUserId)] : [],
    );
  };

  useEffect(() => {
    const result = selectedSale;
    if (!result || reasonRef.current !== "SALES_RETURN") return;

    setField("customerId", result.customerId ?? "");
    setField("customerName", result.customerName ?? "");
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);

    const newItems = result.items
      .map<InwardItem | null>((detail) => {
        const soldQty = detail.soldQty ?? detail.quantity ?? 0;
        const returnedQty = detail.returnedQty ?? 0;
        const remainingQty = Math.max(soldQty - returnedQty, 0);

        if (remainingQty <= 0) return null;

        return {
          goodsId: detail.goodsId,
          goodsName: detail.goodsName,
          unit: detail.unit,
          quantity: remainingQty,
          unitPrice: detail.unitPrice,
          amount1:
            remainingQty *
            detail.unitPrice *
            (1 - (detail.promotion ?? 0) / 100),
          promotion: detail.promotion ?? 0,
          debitAccount1: "156",
          creditAccount1: DEFAULT_CREDIT_ACCOUNT,
          debitAccount2: "1331",
          creditAccount2: DEFAULT_CREDIT_ACCOUNT,
          stockBucket: QUARANTINE_BUCKET,
          offsetVoucher: result.voucherId,
          sourceVoucherId: result.voucherId,
          sourceVoucherDetailId: detail.saleVoucherDetailId,
          returnReason: "",
          rootCause: "",
          expiryDate: null,
          soldQty,
          returnedQty,
          userId: currentUserId,
          createdDateTime: new Date().toISOString(),
        };
      })
      .filter((item): item is InwardItem => item !== null);

    replaceAllItems(newItems);
  }, [selectedSale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isFromStockTake || !fromStockTakeId) return;

    handleReasonChange("STOCK_TAKE");
    setField(
      "voucherDescription",
      `Nhập kho kiểm kê - hàng thừa từ phiếu ${fromStockTakeId}`,
    );

    getSurplusItems(fromStockTakeId)
      .then((items) => {
        const newItems: InwardItem[] = items.map((item) => ({
          goodsId: item.goodsId,
          goodsName: item.goodsName,
          unit: item.unit ?? "",
          quantity: item.quantity,
          unitPrice: 0,
          amount1: 0,
          promotion: 0,
          debitAccount1: "156",
          creditAccount1: "3381",
          debitAccount2: "",
          creditAccount2: "",
          userId: currentUserId,
          createdDateTime: new Date().toISOString(),
        }));

        replaceAllItems(newItems);
      })
      .catch(() => {});
  }, [fromStockTakeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId", goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit", goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem,
    onSelectGoods: handleSelectGoods,
    onAddItem: addItem,
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || isFromStockTake) return;

    addItem();
    initialized.current = true;
  }, [addItem, isFromStockTake]);

  const prevLengthRef = useRef(voucher.items.length);
  useEffect(() => {
    const currentLength = voucher.items.length;
    const previousLength = prevLengthRef.current;

    if (currentLength > previousLength) {
      for (let i = 0; i < currentLength - previousLength; i += 1) {
        goodsSearch.addDropdown();
      }
    }

    if (currentLength < previousLength) {
      goodsSearch.removeDropdown(currentLength);
    }

    prevLengthRef.current = currentLength;
  }, [goodsSearch, voucher.items.length]);

  const isSalesReturn = reason === "SALES_RETURN";

  return (
    <div style={styles.container}>
      <div style={s.heroBanner}>
        <div style={s.heroOrb} />
        <div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Nhập kho</div>
          <h1 style={s.heroTitle}>Thêm mới phiếu nhập kho</h1>
        </div>
      </div>

      <section style={s.card}>
        <h3 style={s.cardTitle}>
          <span style={s.titleDot} />
          Chọn loại phiếu nhập
        </h3>

        {isFromStockTake ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                padding: "6px 16px",
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 8,
                fontSize: 13,
                color: "#15803d",
                fontWeight: 600,
              }}
            >
              📋 NK3 — Nhập kho kiểm kê
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Hàng thừa từ phiếu kiểm kê <strong>{fromStockTakeId}</strong>
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select
              value={reason}
              onChange={(event) =>
                onReasonChange(event.target.value as InwardReason)
              }
              style={s.reasonSelect}
            >
              {(["PURCHASE", "SALES_RETURN"] as InwardReason[]).map((option) => (
                <option key={option} value={option}>
                  {option === "PURCHASE" ? "🛒 " : "↩️ "}
                  {INWARD_REASON_LABELS[option]}
                </option>
              ))}
            </select>

            <span style={s.codeBadge}>
              Mã CT:{" "}
              <strong style={{ color: "#2255cc" }}>
                {getVoucherCodeByReason(reason)}
              </strong>
            </span>
          </div>
        )}
      </section>

      <hr style={styles.hr} />

      {isSalesReturn && (
        <>
          <section style={s.card}>
            <h3 style={s.cardTitle}>
              <span style={s.titleDot} />
              Số hóa đơn bán hàng gốc
            </h3>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ ...styles.fieldGroup, flex: 1, marginBottom: 0 }}>
                <label style={styles.label}>Số hóa đơn bán hàng *</label>
                <input
                  ref={saleReturnSearch.inputRef}
                  style={styles.input}
                  placeholder="Nhập số phiếu hoặc tên khách hàng để tìm kiếm..."
                  value={saleReturnSearch.query}
                  onChange={(e) => saleReturnSearch.handleChange(e.target.value)}
                  onFocus={saleReturnSearch.handleFocus}
                  autoComplete="off"
                />
              </div>

              {selectedSale && (
                <button
                  style={{ ...styles.btnDanger, padding: "8px 14px" }}
                  onClick={() => {
                    saleReturnSearch.clearSearch();
                    setSelectedSale(null);
                    setField("customerId", "");
                    setField("customerName", "");
                    setField("voucherDescription", "");
                    replaceAllItems([]);
                  }}
                >
                  ✕ Xóa
                </button>
              )}
            </div>

            {saleReturnSearch.fetchLoading && (
              <p style={{ color: "#2255cc", fontSize: 13, marginTop: 6 }}>
                ⏳ Đang tải chi tiết phiếu bán...
              </p>
            )}

            {saleReturnSearch.error && (
              <p style={{ color: "#cc2222", fontSize: 13, marginTop: 6 }}>
                ⚠️ {saleReturnSearch.error}
              </p>
            )}

            {selectedSale && (
              <div style={s.lookupResult}>
                <span style={s.lookupBadge}>✅ Đã tìm thấy</span>
                <span style={{ color: "#166534", fontSize: 13 }}>
                  Phiếu <strong>{selectedSale.voucherId}</strong>
                  {" · "}Khách: <strong>{selectedSale.customerName}</strong>
                  {" · "}Dòng hợp lệ: <strong>{voucher.items.length}</strong>
                  {" → "}đã tự động điền vào bảng bên dưới
                </span>
              </div>
            )}
          </section>

          <hr style={styles.hr} />
        </>
      )}

      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}>
          <span style={s.titleDot} />
          Thông tin phiếu nhập
        </h3>

        <div style={s.twoCol}>
          <div style={s.colLeft}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                {isSalesReturn ? "Mã khách hàng" : "Nhà cung cấp *"}
              </label>

              {!isSalesReturn ? (
                <SupplierSearchInput
                  value={supplierQuery}
                  loading={supplierSearch.dropdown.loading}
                  inputRef={supplierSearch.inputRef}
                  onChange={(value) => {
                    setSupplierQuery(value);
                    setField("customerId", value);
                    supplierSearch.handleChange(value);
                  }}
                  onFocus={supplierSearch.handleFocus}
                  onAddNew={() => setShowSupplierModal(true)}
                  placeholder="Nhập mã NCC để tìm kiếm..."
                />
              ) : (
                <input
                  style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
                  value={voucher.customerId ?? ""}
                  readOnly
                  placeholder="Tự điền từ phiếu bán"
                />
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                {isSalesReturn ? "Tên khách hàng *" : "Tên nhà cung cấp *"}
              </label>
              <input
                style={{
                  ...styles.input,
                  background: isSalesReturn
                    ? "#f5f5f5"
                    : voucher.customerName
                      ? "#f0fdf4"
                      : "#fff",
                  color: isSalesReturn
                    ? "#555"
                    : voucher.customerName
                      ? "#15803d"
                      : "#64748b",
                  fontWeight: !isSalesReturn && voucher.customerName ? 600 : 400,
                  borderColor: !voucher.customerName ? "#fca5a5" : "#e2e8f0",
                }}
                placeholder={
                  isSalesReturn
                    ? "Tự điền từ phiếu bán"
                    : "Tự điền khi chọn NCC, hoặc nhập tay"
                }
                value={voucher.customerName ?? ""}
                readOnly={isSalesReturn}
                onChange={(event) => {
                  if (!isSalesReturn) {
                    setField("customerName", event.target.value);
                  }
                }}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Diễn giải</label>
              <input
                style={styles.input}
                placeholder="Nhập diễn giải"
                value={voucher.voucherDescription ?? ""}
                onChange={(event) =>
                  setField("voucherDescription", event.target.value)
                }
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mã số thuế</label>
              <input
                style={styles.input}
                placeholder="Nhập MST"
                value={voucher.taxCode ?? ""}
                onChange={(event) => setField("taxCode", event.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Địa chỉ</label>
              <input
                style={styles.input}
                placeholder="Nhập địa chỉ"
                value={voucher.address ?? ""}
                onChange={(event) => setField("address", event.target.value)}
              />
            </div>
          </div>

          <div style={s.divider} />

          <div style={s.colRight}>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Số phiếu *</label>
              <input
                style={{
                  ...styles.input,
                  ...s.rightInput,
                  fontWeight: 700,
                  color: "#1d4ed8",
                  fontFamily: "monospace",
                  background: "#f0f4ff",
                  cursor: "default",
                }}
                value={voucher.voucherId}
                readOnly
                placeholder="Đang tạo số phiếu..."
              />
            </div>

            <div style={s.rightRow}>
              <label style={s.rightLabel}>Ngày nhập kho *</label>
              <input
                type="date"
                style={{ ...styles.input, ...s.rightInput }}
                value={voucher.voucherDate}
                onChange={(event) => setField("voucherDate", event.target.value)}
              />
            </div>

            <div style={s.rightRow}>
              <label style={s.rightLabel}>Người lập phiếu</label>
              <input
                style={{
                  ...styles.input,
                  ...s.rightInput,
                  background: "#f5f5f5",
                  color: "#555",
                }}
                value={currentUserName}
                readOnly
              />
            </div>
          </div>
        </div>
      </section>

      <hr style={styles.hr} />

      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}>
          <span style={s.titleDot} />
          Chi tiết hàng hóa
          {isSalesReturn && selectedSale && (
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
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(
                index,
                value,
                voucher.items.length,
              )
            }
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)
            }
            onSetDropdownPos={goodsSearch.setDropdownPos}
            lockGoodsSelection={isSalesReturn || isFromStockTake}
            showReturnMetadata={isSalesReturn}
          />
        )}

        {voucher.items.length > 0 && (
          <div style={styles.summaryBox}>
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Tổng tiền hàng:</span>
              <strong>{totalAmount.toLocaleString("vi-VN")} VND</strong>
            </div>
          </div>
        )}
      </section>

      <div style={s.actionRow}>
        <button
          style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Đang lưu..." : "Lưu phiếu nhập kho"}
        </button>

        {message && (
          <span
            style={
              message.toLowerCase().includes("thành công")
                ? s.successText
                : s.errorText
            }
          >
            {message}
          </span>
        )}
      </div>

      {saleReturnSearch.dropdownPos &&
        saleReturnSearch.dropdown.open &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            ref={saleReturnSearch.dropdownRef}
            style={{
              position: "fixed",
              top: saleReturnSearch.dropdownPos.top,
              left: saleReturnSearch.dropdownPos.left,
              width: saleReturnSearch.dropdownPos.width,
              zIndex: 99999,
              background: "#fff",
              border: "1px solid #c7d7ff",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            }}
          >
            {saleReturnSearch.dropdown.suggestions.length > 0 ? (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: "4px 0",
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                <li
                  style={{
                    padding: "6px 14px",
                    fontSize: 11,
                    color: "#94a3b8",
                    fontWeight: 600,
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  🧾 {saleReturnSearch.dropdown.suggestions.length} phiếu bán phù hợp
                </li>

                {saleReturnSearch.dropdown.suggestions.map((v: SaleSearchResult) => (
                  <li
                    key={v.voucherId}
                    style={{
                      padding: "9px 14px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      borderBottom: "1px solid #f8fafc",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLLIElement).style.background =
                        "#f0f4ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLLIElement).style.background =
                        "transparent";
                    }}
                    onMouseDown={() => saleReturnSearch.handleSelect(v)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "#fef9c3",
                          color: "#92400e",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}
                      >
                        {v.voucherId}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        {v.customerName ?? "—"}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 2 }}>
                      {v.voucherDate ?? "—"} · {v.itemCount} mặt hàng ·{" "}
                      {v.totalAmount.toLocaleString("vi-VN")} ₫
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              !saleReturnSearch.dropdown.loading && (
                <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>
                  Không tìm thấy phiếu bán
                </div>
              )
            )}
          </div>,
          document.body,
        )}

      <SupplierDropdown
        dropdown={supplierSearch.dropdown}
        dropdownPos={supplierSearch.dropdownPos}
        dropdownRef={supplierSearch.dropdownRef}
        onSelect={(supplier) => {
          handleSelectSupplier(supplier);
          supplierSearch.handleSelect(supplier);
        }}
        onAddNew={() => setShowSupplierModal(true)}
        query={supplierQuery}
      />

      {showSupplierModal && (
        <CreateSupplierModal
          initialId={supplierQuery}
          onClose={() => setShowSupplierModal(false)}
          onCreated={(supplier) => {
            handleSelectSupplier(supplier);
            setShowSupplierModal(false);
          }}
        />
      )}
    </div>
  );
}

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
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
  },
  heroOrb2: {
    position: "absolute",
    bottom: -30,
    left: 80,
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    margin: 0,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
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
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #6366f1)",
    flexShrink: 0,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr auto 320px",
    gap: 0,
    alignItems: "flex-start",
    minWidth: 0,
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
    flexDirection: "column",
    gap: 10,
    flexShrink: 0,
  },
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
    whiteSpace: "nowrap",
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
    boxSizing: "border-box",
  },
  reasonSelect: {
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
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    minWidth: 220,
  },
  codeBadge: {
    padding: "4px 12px",
    background: "#f0f4ff",
    color: "#555",
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    fontSize: 12,
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
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  successText: {
    color: "#15803d",
    fontWeight: 600,
    fontSize: 13,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: 600,
    fontSize: 13,
  },
};