// ============================================================
//  features/export/components/AddExportForm.tsx
//  Flow mới: chọn hàng → modal bắt buộc chọn chứng từ nhập
//  → xác nhận → điền vào table (có thể nhiều dòng nếu nhiều phiếu nhập)
// ============================================================

"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "@/shared/styles/sale.styles";
import { EXPORT_REASON_LABELS, getVoucherCodeByReason, getDebitAccountByReason } from "../constants/export.constants";
import { useExportForm }              from "../hooks/useExportForm";
import { useInwardVoucherLookup }     from "../hooks/useInwardVoucherLookup";
import { useGoodsSearch }    from "../hooks/useGoodsSearch";

import { useWarehouseReport } from "@/features/sale/hooks/useWarehouseReport";
import { getWarehouseReport } from "../export.api";
import ExportItemTable       from "./ExportItemTable";
import SelectInboundModal    from "./SelectInboundModal";
import type { InboundSelection } from "./SelectInboundModal";
import WarehouseReportModal  from "@/shared/components/warehouse/WarehouseReportModal";
import SupplierSearchInput   from "@/shared/components/supplier/SupplierSearchInput";
import SupplierDropdown      from "@/shared/components/supplier/SupplierDropdown";
import CreateSupplierModal   from "@/shared/components/supplier/CreateSupplierModal";
import { useSupplierSearch } from "@/shared/hooks/supplier/useSupplierSearch";
import { useAuthStore }      from "@/store/authStore";
import type { ExportReason, GoodsSearchResult, ExportItem } from "../types/export.types";
import type { WarehouseTransactionDto } from "@/features/sale/types/sale.types";
import type { SupplierSearchResult } from "@/shared/types/supplier.types";

// State của modal chọn chứng từ nhập
interface PendingGoodsState {
  itemIndex:  number;
  goods:      GoodsSearchResult;
  totalItems: number;
  inbounds:   InboundSelection[];
  loading:    boolean;
}

export default function AddExportForm() {
  const { user } = useAuthStore();
  const currentUserId   = String(user?.userId ?? "");
  const currentUserName = user?.fullName ?? "";

  const {
    voucher, reason, message, loading,
    totalAmount,
    setField, handleReasonChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  } = useExportForm({ userId: currentUserId, userFullName: currentUserName });

  const { report, fetchReport, closeReport } = useWarehouseReport();

  // ── Lookup phiếu nhập kho (chỉ khi IMPORT_RETURN) ────────
  const inwardLookup   = useInwardVoucherLookup();
  const isImportReturn = reason === "IMPORT_RETURN";

  const createEmptyExportItemShim = (): ExportItem => ({
    goodsId: "", goodsName: "", unit: "",
    quantity: 1, unitPrice: 0, amount1: 0,
    vat: 0, promotion: 0,
    debitAccount1:   getDebitAccountByReason(reason),
    creditAccount1:  "156",
    debitAccount2:   "", creditAccount2: "",
    costPerUnit:     0,
    userId:          currentUserId,
    createdDateTime: new Date().toISOString(),
    offsetVoucher:   "",
  });

  // Khi tìm thấy phiếu nhập → auto-fill thông tin và bảng hàng hóa
  useEffect(() => {
    const result = inwardLookup.lookupResult;
    if (!result) return;
    setField("customerId",         result.customerId    ?? "");
    setField("customerName",       result.customerName);
    setField("taxCode",            result.taxCode       ?? "");
    setField("address",            result.address       ?? "");
    setField("voucherDescription", `Hàng nhập bị trả lại - ${result.voucherId}`);
    setSupplierQuery(result.customerId ?? "");
    const newItems: ExportItem[] = result.items.map((d) => ({
      goodsId:         d.goodsId,
      goodsName:       d.goodsName,
      unit:            d.unit,
      quantity:        d.quantity,
      unitPrice:       d.unitPrice,
      amount1:         d.amount1,
      vat:             0,
      promotion:       0,
      debitAccount1:   getDebitAccountByReason("IMPORT_RETURN"),
      creditAccount1:  "156",
      debitAccount2:   "",
      creditAccount2:  "",
      costPerUnit:     d.quantity > 0 ? d.amount1 / d.quantity : d.unitPrice,
      userId:          currentUserId,
      createdDateTime: new Date().toISOString(),
      offsetVoucher:   result.voucherId,
    }));
    replaceAllItems([...newItems, createEmptyExportItemShim()]);
  }, [inwardLookup.lookupResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modal chọn chứng từ nhập ─────────────────────────────
  const [pendingGoods, setPendingGoods] = useState<PendingGoodsState | null>(null);

  // Khi user chọn hàng từ dropdown → fetch FIFO → mở modal bắt buộc
  const handleGoodsSelected = useCallback(async (
    index:      number,
    goods:      GoodsSearchResult,
    totalItems: number,
  ) => {
    // Mở modal với loading state ngay lập tức
    setPendingGoods({ itemIndex: index, goods, totalItems, inbounds: [], loading: true });

    try {
      // Tái sử dụng warehouse-report — cùng endpoint với WarehouseReportModal
      // Trả về danh sách phiếu nhập còn tồn (customInHand > 0), order FIFO
      const rows = await getWarehouseReport(goods.goodsId);

      const inbounds: InboundSelection[] = rows
        .filter((r) => r.offsetVoucher && r.customInHand > 0)
        .map((r) => ({
          inboundVoucherCode: r.offsetVoucher!,
          allocatedQty:       0,
          warehouseId:        r.warehouseId,
          remainingQty:       r.customInHand,
          warehouseIn:        r.warehouseIn,
          warehouseOut:       r.warehouseOut,
          unitPrice:          r.unitPrice,
          costPerUnit:        r.warehouseIn > 0 ? r.cost / r.warehouseIn : 0,
        }));

      setPendingGoods((prev) =>
        prev ? { ...prev, inbounds, loading: false } : null
      );
    } catch {
      setPendingGoods((prev) =>
        prev ? { ...prev, inbounds: [], loading: false } : null
      );
    }
  }, []);

  // User xác nhận chọn phiếu nhập + số lượng trong modal
  const handleConfirmInbound = useCallback((selections: InboundSelection[]) => {
    if (!pendingGoods) return;
    const { itemIndex, goods, totalItems } = pendingGoods;

    // Điền thông tin hàng hóa vào dòng hiện tại
    updateItem(itemIndex, "goodsId",   goods.goodsId);
    updateItem(itemIndex, "goodsName", goods.goodsName);
    updateItem(itemIndex, "unit",      goods.unit);

    const fillRow = (idx: number, sel: InboundSelection) => {
      updateItem(idx, "unitPrice",    sel.unitPrice);
      updateItem(idx, "costPerUnit",  sel.costPerUnit);
      updateItem(idx, "quantity",     sel.allocatedQty);
      updateItem(idx, "offsetVoucher", sel.inboundVoucherCode);
    };

    if (selections.length === 1) {
      fillRow(itemIndex, selections[0]);
    } else {
      selections.forEach((sel, i) => {
        if (i === 0) {
          fillRow(itemIndex, sel);
        } else {
          addItem();
          const newIndex = itemIndex + i;
          setTimeout(() => {
            updateItem(newIndex, "goodsId",   goods.goodsId);
            updateItem(newIndex, "goodsName", goods.goodsName);
            updateItem(newIndex, "unit",      goods.unit);
            fillRow(newIndex, sel);
          }, 0);
        }
      });
    }

    // Thêm dòng trống mới nếu đang ở dòng cuối
    if (itemIndex === totalItems - 1) addItem();

    setPendingGoods(null);
  }, [pendingGoods, updateItem, addItem]);

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

  // ── Khi chọn từ WarehouseReportModal (nút 📦 Kho) ───────
  const handleSelectWarehouse = (itemIndex: number, row: WarehouseTransactionDto) => {
    if (row.offsetVoucher) updateItem(itemIndex, "offsetVoucher", row.offsetVoucher);
  };

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    updateItem(index, "goodsId",   goods.goodsId);
    updateItem(index, "goodsName", goods.goodsName);
    updateItem(index, "unit",      goods.unit);
  };

  const goodsSearch = useGoodsSearch({
    updateItem,
    onSelectGoods:   handleSelectGoods,
    onAddItem:       addItem,
    onGoodsSelected: handleGoodsSelected, // trigger modal
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

  return (
    <div style={styles.container}>

      {/* ── Hero header ── */}
      <div style={s.heroBanner}>
        <div style={s.heroOrb} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Xuất kho</div>
          <h1 style={s.heroTitle}>Thêm mới phiếu xuất kho</h1>
        </div>
      </div>

      {/* ── Lý do xuất kho ── */}
      <section style={s.card}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Lý do xuất kho</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select value={reason}
            onChange={(e) => {
              handleReasonChange(e.target.value as ExportReason);
              inwardLookup.clearLookup();
            }}
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

      {/* ── Tra cứu phiếu nhập (chỉ khi IMPORT_RETURN) ── */}
      {isImportReturn && (
        <>
          <section style={s.card}>
            <h3 style={s.cardTitle}><span style={s.titleDot} />Số phiếu nhập kho gốc</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ ...styles.fieldGroup, flex: 1, marginBottom: 0 }}>
                <label style={styles.label}>Số phiếu nhập kho *</label>
                <input
                  style={styles.input}
                  placeholder="Nhập số phiếu nhập, VD: NK12345678"
                  value={inwardLookup.inwardVoucherId}
                  onChange={(e) => inwardLookup.setInwardVoucherId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && inwardLookup.handleLookup()}
                />
              </div>
              <button
                style={{ ...styles.btnPrimary, padding: "8px 20px", minWidth: 110,
                  opacity: inwardLookup.lookupLoading ? 0.6 : 1 }}
                onClick={inwardLookup.handleLookup}
                disabled={inwardLookup.lookupLoading}
              >
                {inwardLookup.lookupLoading ? "⏳ Đang tìm..." : "🔍 Tra cứu"}
              </button>
              {inwardLookup.lookupResult && (
                <button style={{ ...styles.btnDanger, padding: "8px 14px" }}
                  onClick={inwardLookup.clearLookup} title="Xóa kết quả">✕ Xóa</button>
              )}
            </div>
            {inwardLookup.lookupError && (
              <p style={{ color: "#cc2222", fontSize: 13, marginTop: 6 }}>
                ⚠️ {inwardLookup.lookupError}
              </p>
            )}
            {inwardLookup.lookupResult && (
              <div style={s.lookupResult}>
                <span style={s.lookupBadge}>✅ Đã tìm thấy</span>
                <span style={{ color: "#166534", fontSize: 13 }}>
                  Phiếu <strong>{inwardLookup.lookupResult.voucherId}</strong>
                  {" · "}NCC: <strong>{inwardLookup.lookupResult.customerName}</strong>
                  {" · "}{inwardLookup.lookupResult.items.length} sản phẩm
                  {" → "}đã tự động điền vào bảng bên dưới
                </span>
              </div>
            )}
          </section>
          <hr style={styles.hr} />
        </>
      )}

      {/* ── Thông tin phiếu xuất — 2 cột ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}><span style={s.titleDot} />Thông tin phiếu xuất</h3>
        <div style={s.twoCol}>

          {/* Cột trái */}
          <div style={s.colLeft}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mã đối tượng</label>
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
                placeholder="Nhập mã đối tượng để tìm kiếm..."
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tên đối tượng *</label>
              <input style={{
                ...styles.input,
                background:  voucher.customerName ? "#f0fdf4" : "#fff",
                color:       voucher.customerName ? "#15803d" : "#64748b",
                fontWeight:  voucher.customerName ? 600 : 400,
                borderColor: !voucher.customerName ? "#fca5a5" : "#e2e8f0",
              }}
                placeholder="Tự điền khi chọn đối tượng, hoặc nhập tay"
                value={voucher.customerName as string}
                onChange={(e) => setField("customerName", e.target.value)} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Diễn giải</label>
              <input style={styles.input} placeholder="Nhập diễn giải"
                value={voucher.voucherDescription as string}
                onChange={(e) => setField("voucherDescription", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>Mã số thuế</label>
                <input style={styles.input} placeholder="Nhập MST"
                  value={voucher.taxCode as string}
                  onChange={(e) => setField("taxCode", e.target.value)} />
              </div>
              <div style={{ ...styles.fieldGroup, flex: 2 }}>
                <label style={styles.label}>Địa chỉ</label>
                <input style={styles.input} placeholder="Nhập địa chỉ"
                  value={voucher.address as string}
                  onChange={(e) => setField("address", e.target.value)} />
              </div>
            </div>
          </div>

          <div style={s.divider} />

          {/* Cột phải */}
          <div style={s.colRight}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Số phiếu *</label>
              <input style={{ ...styles.input, fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace" }}
                value={voucher.voucherId}
                onChange={(e) => setField("voucherId", e.target.value)}
                placeholder="Tự sinh, có thể sửa" />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ngày xuất kho *</label>
              <input type="date" style={styles.input}
                value={voucher.voucherDate}
                onChange={(e) => setField("voucherDate", e.target.value)} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Người lập phiếu</label>
              <input style={{ ...styles.input, background: "#f5f5f5", color: "#555" }}
                value={currentUserName} readOnly />
            </div>
          </div>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* ── Chi tiết hàng hóa ── */}
      <section style={{ ...s.card, maxWidth: "100%" }}>
        <h3 style={s.cardTitle}>
          <span style={s.titleDot} />Chi tiết hàng hóa
          {isImportReturn && inwardLookup.lookupResult && (
            <span style={s.autoFilledBadge}>✨ Tự động điền từ phiếu nhập</span>
          )}
        </h3>

        <div style={s.infoNote}>
          💡 Sau khi chọn mã hàng, hệ thống sẽ yêu cầu chọn <strong>phiếu nhập đối trừ</strong> và
          số lượng xuất từ mỗi phiếu. Nút <strong>📦 Kho</strong> cho phép điều chỉnh sau.
        </div>

        {voucher.items.length > 0 && (
          <ExportItemTable
            items={voucher.items}
            dropdowns={goodsSearch.dropdowns}
            dropdownPos={goodsSearch.dropdownPos}
            dropdownRefs={goodsSearch.dropdownRefs}
            inputRefs={goodsSearch.inputRefs}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onGoodsIdChange={(index, value) =>
              goodsSearch.handleGoodsIdChange(index, value)}
            onInputFocus={goodsSearch.handleInputFocus}
            onSelectGoods={(index, goods, totalItems) =>
              goodsSearch.handleSelectGoods(index, goods, totalItems)}
            onSetDropdownPos={goodsSearch.setDropdownPos}
            onViewWarehouse={fetchReport}
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
        <button style={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ Đang lưu..." : "💾 Lưu phiếu xuất kho"}
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

      {/* ── Portals ── */}
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

      <WarehouseReportModal
        report={report}
        onClose={closeReport}
        onSelectWarehouse={handleSelectWarehouse}
      />

      {/* ── Modal bắt buộc chọn chứng từ nhập ── */}
      {pendingGoods && (
        <SelectInboundModal
          goodsId={pendingGoods.goods.goodsId}
          goodsName={pendingGoods.goods.goodsName}
          inbounds={pendingGoods.inbounds}
          loading={pendingGoods.loading}
          onConfirm={handleConfirmInbound}
          onCancel={() => setPendingGoods(null)}
          canCancel={true}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  heroBanner:  { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #1d4ed8 100%)", borderRadius: 14, padding: "22px 28px", marginBottom: 20, boxShadow: "0 8px 24px rgba(15,118,110,0.28)" },
  heroOrb:     { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)" },
  heroOrb2:    { position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" },
  heroEyebrow: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 },
  heroTitle:   { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  card:        { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  cardTitle:   { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, marginTop: 0 },
  titleDot:    { display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg, #0f766e, #0891b2)", flexShrink: 0 },
  reasonSelect:{ height: 38, padding: "0 36px 0 12px", border: "1.5px solid #c7d7ff", borderRadius: 8, background: "#eff6ff", color: "#2255cc", fontWeight: 600, fontSize: 14, cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232255cc' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", minWidth: 220 },
  codeBadge:   { padding: "4px 12px", background: "#f0f4ff", color: "#555", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 12 },
  infoNote:    { marginBottom: 12, padding: "10px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 12, color: "#0369a1", lineHeight: 1.6 },
  lookupResult: { marginTop: 10, padding: "12px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontSize: 13 },
  lookupBadge:  { padding: "3px 12px", background: "#16a34a", color: "#fff", borderRadius: 20, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" as const, letterSpacing: "0.04em" },
  autoFilledBadge: { marginLeft: 10, padding: "3px 12px", background: "#eff6ff", color: "#4f46e5", border: "1.5px solid #c7d7ff", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr auto 320px", gap: 0, alignItems: "flex-start", minWidth: 0 },
  colLeft:     { minWidth: 0, paddingRight: 20, overflow: "hidden" },
  divider:     { width: 1, alignSelf: "stretch", background: "#e2e8f0", margin: "0 4px" },
  colRight:    { width: 320, paddingLeft: 20, flexShrink: 0, display: "flex", flexDirection: "column" as const, gap: 0 },
};