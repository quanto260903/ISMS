// ============================================================
//  features/inward/components/AddInwardForm.tsx
// ============================================================

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import styles from "@/shared/styles/sale.styles";
import {
  INWARD_REASON_LABELS,
  getVoucherCodeByReason,
  DEFAULT_CREDIT_ACCOUNT,
} from "../constants/import.constants";
import { useInwardForm }          from "../hooks/useInwardForm";
import { useGoodsSearch }         from "../hooks/useGoodsSearch";
import { useSaleVoucherSearch }   from "../hooks/useSaleVoucherSearch";
import { getSurplusItems }      from "@/features/stock-take/stockTake.api";
import InwardItemTable          from "./InwardItemTable";
import SupplierSearchInput      from "@/shared/components/supplier/SupplierSearchInput";
import SupplierDropdown         from "@/shared/components/supplier/SupplierDropdown";
import CreateSupplierModal      from "@/shared/components/supplier/CreateSupplierModal";
import { useSupplierSearch }    from "@/shared/hooks/supplier/useSupplierSearch";
import { useAuthStore }         from "@/store/authStore";
import type { InwardReason, InwardItem, GoodsSearchResult, SaleSearchResult, SaleVoucherLookup } from "../types/import.types";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";
import ReactDOM from "react-dom";

export default function AddInwardForm() {
  const router           = useRouter();
  const searchParams     = useSearchParams();
  const fromStockTakeId  = searchParams.get("fromStockTake");
  const isFromStockTake  = !!fromStockTakeId && searchParams.get("reason") === "NK3";

  const [reason, setReason] = useState<InwardReason>(isFromStockTake ? "STOCK_TAKE" : "PURCHASE");

  const { user } = useAuthStore();
  const currentUserId   = String(user?.userId ?? "");
  const currentUserName = user?.fullName ?? "";

  const {
    voucher, message,
    totalAmount,
    setField, handleReasonChange,
    addItem, removeItem, updateItem, replaceAllItems,
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

  const [selectedSale, setSelectedSale] = useState<SaleVoucherLookup | null>(null);
  const saleReturnSearch = useSaleVoucherSearch({ onSelect: setSelectedSale });

  // Dùng ref để tránh stale closure
  const reasonRef = useRef(reason);
  reasonRef.current = reason;

  // ── Supplier search + modal ──────────────────────────────
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierQuery,     setSupplierQuery]     = useState("");

  const handleSelectSupplier = (supplier: SupplierSearchResult) => {
    setField("customerId",   supplier.supplierId);
    setField("customerName", supplier.supplierName);
    if (supplier.taxId)   setField("taxCode",  supplier.taxId);
    if (supplier.address) setField("address",  supplier.address);
    setSupplierQuery(supplier.supplierId);
  };

  const supplierSearch = useSupplierSearch({ onSelect: handleSelectSupplier });

  // ── Đổi lý do nhập kho ──────────────────────────────────
  const onReasonChange = (r: InwardReason) => {
    setReason(r);
    handleReasonChange(r);
    saleReturnSearch.clearSearch();
    setSelectedSale(null);
    // Reset thông tin đối tượng và items khi đổi lý do
    setField("customerId",   "");
    setField("customerName", "");
    setSupplierQuery("");
    replaceAllItems([createEmptyItemShim()]);
  };

  const createEmptyItemShim = (): InwardItem => ({
    goodsId:         "",
    goodsName:       "",
    unit:            "",
    quantity:        1,
    unitPrice:       0,
    amount1:         0,
    promotion:       0,
    debitAccount1:   "156",
    creditAccount1:  DEFAULT_CREDIT_ACCOUNT,
    debitAccount2:   "1331",
    creditAccount2:  DEFAULT_CREDIT_ACCOUNT,
    userId:          currentUserId,
    createdDateTime: new Date().toISOString(),
  });

  // ── Auto-fill từ phiếu bán (SALES_RETURN) ───────────────
  useEffect(() => {
    const result = selectedSale;
    if (!result || reasonRef.current !== "SALES_RETURN") return;

    setField("customerId",         result.customerId   ?? "");
    setField("customerName",       result.customerName ?? "");
    setField("voucherDescription", `Hàng bán bị trả lại - ${result.voucherId}`);

    const newItems: InwardItem[] = result.items.map((d) => ({
      goodsId:         d.goodsId,
      goodsName:       d.goodsName,
      unit:            d.unit,
      quantity:        d.quantity,
      unitPrice:       d.unitPrice,
      amount1:         d.amount1,
      promotion:       d.promotion ?? 0,
      debitAccount1:   "156",
      creditAccount1:  DEFAULT_CREDIT_ACCOUNT,
      debitAccount2:   "1331",
      creditAccount2:  DEFAULT_CREDIT_ACCOUNT,
      offsetVoucher:   result.voucherId,
      userId:          currentUserId,
      createdDateTime: new Date().toISOString(),
    }));

    replaceAllItems([...newItems, createEmptyItemShim()]);
  }, [selectedSale]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-fill từ phiếu kiểm kê (STOCK_TAKE / NK3) ─────────
  useEffect(() => {
    if (!isFromStockTake || !fromStockTakeId) return;
    handleReasonChange("STOCK_TAKE");
    setField("voucherDescription", `Nhập kho kiểm kê — hàng thừa từ phiếu ${fromStockTakeId}`);

    getSurplusItems(fromStockTakeId).then((items) => {
      if (!items.length) return;
      const newItems: InwardItem[] = items.map((it) => ({
        goodsId:         it.goodsId,
        goodsName:       it.goodsName,
        unit:            it.unit ?? "",
        quantity:        it.quantity,
        unitPrice:       0,
        amount1:         0,
        promotion:       0,
        debitAccount1:   "156",
        creditAccount1:  "3381",  // Hàng thừa phát hiện khi kiểm kê
        debitAccount2:   "",
        creditAccount2:  "",
        userId:          currentUserId,
        createdDateTime: new Date().toISOString(),
      }));
      replaceAllItems([...newItems, createEmptyItemShim()]);
    }).catch(() => {/* giữ form rỗng nếu lỗi */});
  }, [fromStockTakeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Goods search ─────────────────────────────────────────
  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem, onSelectGoods: handleSelectGoods, onAddItem: addItem,
  });

  // Init dòng đầu tiên (chỉ khi KHÔNG từ kiểm kê — kiểm kê sẽ pre-fill trong useEffect trên)
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && !isFromStockTake) { addItem(); initialized.current = true; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync số dropdown với số dòng items
  const prevLengthRef = useRef(voucher.items.length);
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
        <h3 style={s.cardTitle}><span style={s.titleDot} />Chọn loại phiếu nhập</h3>
        {isFromStockTake ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "6px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
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
              onChange={(e) => onReasonChange(e.target.value as InwardReason)}
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
              Mã CT:{" "}
              <strong style={{ color: "#2255cc" }}>
                {getVoucherCodeByReason(reason)}
              </strong>
            </span>
          </div>
        )}
      </section>

      <hr style={styles.hr} />

      {/* ── Tra cứu phiếu bán (chỉ khi SALES_RETURN) — dropdown gợi ý ── */}
      {isSalesReturn && (
        <>
          <section style={s.card}>
            <h3 style={s.cardTitle}><span style={s.titleDot} />Số hóa đơn bán hàng gốc</h3>
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
                <button style={{ ...styles.btnDanger, padding: "8px 14px" }}
                  onClick={() => { saleReturnSearch.clearSearch(); setSelectedSale(null); }}>
                  ✕ Xóa
                </button>
              )}
            </div>
            {saleReturnSearch.fetchLoading && (
              <p style={{ color: "#2255cc", fontSize: 13, marginTop: 6 }}>⏳ Đang tải chi tiết phiếu bán...</p>
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
                  {" · "}{selectedSale.items.length} sản phẩm
                  {" → "}đã tự động điền vào bảng bên dưới
                </span>
              </div>
            )}
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ── Thông tin phiếu nhập — layout 2 cột ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin phiếu nhập</h3>

        <div style={s.twoCol}>

          {/* Cột trái */}
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
                  onChange={(val) => {
                    setSupplierQuery(val);
                    setField("customerId", val);
                    supplierSearch.handleChange(val);
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

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Diễn giải</label>
              <input style={styles.input} placeholder="Nhập diễn giải"
                value={voucher.voucherDescription ?? ""}
                onChange={(e) => setField("voucherDescription", e.target.value)} />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mã số thuế</label>
              <input style={styles.input} placeholder="Nhập MST"
                value={voucher.taxCode ?? ""}
                onChange={(e) => setField("taxCode", e.target.value)} />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Địa chỉ</label>
              <input style={styles.input} placeholder="Nhập địa chỉ"
                value={voucher.address ?? ""}
                onChange={(e) => setField("address", e.target.value)} />
            </div>
          </div>

          <div style={s.divider} />

          {/* Cột phải */}
          <div style={s.colRight}>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Số phiếu *</label>
              <input
                style={{ ...styles.input, ...s.rightInput, fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace", background: "#f0f4ff", cursor: "default" }}
                value={voucher.voucherId}
                readOnly
                placeholder="Đang tạo số phiếu..."
              />
            </div>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Ngày nhập kho *</label>
              <input type="date"
                style={{ ...styles.input, ...s.rightInput }}
                value={voucher.voucherDate}
                onChange={(e) => setField("voucherDate", e.target.value)}
              />
            </div>
            <div style={s.rightRow}>
              <label style={s.rightLabel}>Người lập phiếu</label>
              <input
                style={{ ...styles.input, ...s.rightInput, background: "#f5f5f5", color: "#555" }}
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
            <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
              <span>Tổng tiền hàng:</span>
              <strong>{totalAmount.toLocaleString("vi-VN")} ₫</strong>
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

      {/* ── Portal dropdown tra cứu phiếu bán (SALES_RETURN) ── */}
      {saleReturnSearch.dropdownPos && saleReturnSearch.dropdown.open && typeof window !== "undefined" && ReactDOM.createPortal(
        <div
          ref={saleReturnSearch.dropdownRef}
          style={{
            position: "fixed",
            top:   saleReturnSearch.dropdownPos.top,
            left:  saleReturnSearch.dropdownPos.left,
            width: saleReturnSearch.dropdownPos.width,
            zIndex: 99999,
            background: "#fff",
            border: "1px solid #c7d7ff",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
          }}
        >
          {saleReturnSearch.dropdown.suggestions.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 300, overflowY: "auto" }}>
              <li style={{ padding: "6px 14px", fontSize: 11, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>
                🧾 {saleReturnSearch.dropdown.suggestions.length} phiếu bán phù hợp
              </li>
              {saleReturnSearch.dropdown.suggestions.map((v: SaleSearchResult) => (
                <li
                  key={v.voucherId}
                  style={{ padding: "9px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = "#f0f4ff")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = "transparent")}
                  onMouseDown={() => saleReturnSearch.handleSelect(v)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "2px 8px", background: "#fef9c3", color: "#92400e", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                      {v.voucherId}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{v.customerName ?? "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 2 }}>
                    {v.voucherDate ?? "—"} · {v.itemCount} mặt hàng · {v.totalAmount.toLocaleString("vi-VN")} ₫
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !saleReturnSearch.dropdown.loading && (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>Không tìm thấy phiếu bán</div>
            )
          )}
        </div>,
        document.body
      )}

      {/* ── Portal dropdown NCC ── */}
      <SupplierDropdown
        dropdown={supplierSearch.dropdown}
        dropdownPos={supplierSearch.dropdownPos}
        dropdownRef={supplierSearch.dropdownRef}
        onSelect={(sup) => { handleSelectSupplier(sup); supplierSearch.handleSelect(sup); }}
        onAddNew={() => setShowSupplierModal(true)}
        query={supplierQuery}
      />

      {showSupplierModal && (
        <CreateSupplierModal
          initialId={supplierQuery}
          onClose={() => setShowSupplierModal(false)}
          onCreated={(sup) => { handleSelectSupplier(sup); setShowSupplierModal(false); }}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  heroBanner: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #3b82f6 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 20,
    boxShadow: "0 8px 24px rgba(109,40,217,0.28)",
  },
  heroOrb:     { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2:    { position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:   { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  card: {
    background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
    padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
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
  twoCol:   { display: "grid", gridTemplateColumns: "1fr auto 320px", gap: 0, alignItems: "flex-start", minWidth: 0 },
  colLeft:  { minWidth: 0, paddingRight: 20, overflow: "hidden" },
  divider:  { width: 1, alignSelf: "stretch", background: "#e2e8f0", margin: "0 4px" },
  colRight: { width: 320, paddingLeft: 20, display: "flex", flexDirection: "column" as const, gap: 10, flexShrink: 0 },
  rightRow: { display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 },
  rightLabel: { fontSize: 12, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" as const, width: 120, flexShrink: 0 },
  rightInput: { flex: 1, minWidth: 0, border: "none", borderBottom: "1.5px solid #e2e8f0", borderRadius: 0, background: "transparent", padding: "4px 0", fontSize: 13, width: "100%", boxSizing: "border-box" as const },
  reasonSelect: {
    height: 38, padding: "0 36px 0 12px",
    border: "1.5px solid #c7d7ff", borderRadius: 8,
    background: "#eff6ff", color: "#2255cc",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", minWidth: 220,
  },
  codeBadge: { padding: "4px 12px", background: "#f0f4ff", color: "#555", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 12 },
  lookupResult: { marginTop: 10, padding: "12px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontSize: 13 },
  lookupBadge:  { padding: "3px 12px", background: "#16a34a", color: "#fff", borderRadius: 20, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" as const, letterSpacing: "0.04em" },
  autoFilledBadge: { marginLeft: 10, padding: "3px 12px", background: "#eff6ff", color: "#4f46e5", border: "1.5px solid #c7d7ff", borderRadius: 20, fontSize: 11, fontWeight: 700 },
};  