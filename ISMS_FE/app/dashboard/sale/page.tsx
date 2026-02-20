"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createSale, searchGoods } from "@/services/api/sale.api";

/* =========================
   TYPES
========================= */

type PaymentOption = "CASH" | "BANK" | "UNPAID";

interface GoodsSearchResult {
  goodsId: string;
  goodsName: string;
  unit: string;
  salePrice: number;
  vatrate: string;
  itemOnHand: number;
}

interface WarehouseTransactionDto {
  voucherDate: string;
  voucherId: string;
  warehouseId: string;
  goodsId: string;
  unit: string;
  offsetVoucher: string;
  warehouseIn: number;
  warehouseOut: number;
  customInHand: number;
  cost: number;
}

interface WarehouseReportState {
  goodsId: string;
  goodsName: string;
  data: WarehouseTransactionDto[];
  loading: boolean;
  error: string;
}

interface VoucherItem {
  goodsId: string;
  goodsName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vat: number;       // % thuế VAT (5 | 7 | 10), dùng để tính tiền VAT riêng
  promotion: number;
  amount1: number;   // Thành tiền = quantity × unitPrice - promotion (CHƯA bao gồm VAT)
  debitAccount1: string;
  creditAccount1: string;
  debitAccount2: string;
  creditAccount2: string;
  creditWarehouseId: string;
  offsetVoucher: string;
}

interface Voucher {
  customerId: string;
  customerName: string;
  address: string;
  bankName?: string;
  bankAccountNumber?: string;
  description: string;
  voucherDate: string;
  voucherNumber: string;
  items: VoucherItem[];
}

/* =========================
   CONSTANTS & HELPERS
========================= */

const VAT_OPTIONS = [0, 5, 7, 10]; // các mức thuế VAT (%)

const getDebitAccountByPayment = (payment: PaymentOption) => {
  switch (payment) {
    case "CASH":   return "111";
    case "BANK":   return "112";
    case "UNPAID": return "131";
  }
};

const generateVoucherNumber = () => "BH" + Date.now().toString().slice(-8);

/**
 * Tính thành tiền của 1 dòng.
 * Công thức: quantity × unitPrice - promotion
 * VAT KHÔNG được cộng vào đây — VAT tính riêng ở cột "Tiền VAT"
 */
const calcAmount = (item: VoucherItem): number =>
  item.quantity * item.unitPrice - item.promotion;

/* =========================
   COMPONENT
========================= */

export default function AddSaleForm() {
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("CASH");

  const [voucher, setVoucher] = useState<Voucher>({
    customerId: "",
    customerName: "",
    address: "",
    bankName: "",
    bankAccountNumber: "",
    description: "",
    voucherDate: new Date().toISOString().split("T")[0],
    voucherNumber: generateVoucherNumber(),
    items: [],
  });

  const [message, setMessage] = useState("");

  // State cho modal báo cáo kho
  const [warehouseReport, setWarehouseReport] =
    useState<WarehouseReportState | null>(null);

  const fetchWarehouseReport = async (goodsId: string, goodsName: string) => {
    if (!goodsId.trim()) return;

    setWarehouseReport({ goodsId, goodsName, data: [], loading: true, error: "" });

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${BASE_URL}/api/goods/warehouse-report/${encodeURIComponent(goodsId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Lỗi ${res.status}: ${res.statusText}`);
      const json = await res.json();
      // API trả về { statusCode, data, ... } hoặc thẳng mảng
      const rows: WarehouseTransactionDto[] = Array.isArray(json)
        ? json
        : json.data ?? [];
      setWarehouseReport({ goodsId, goodsName, data: rows, loading: false, error: "" });
    } catch (err: any) {
      setWarehouseReport((prev) =>
        prev ? { ...prev, loading: false, error: err.message ?? "Lỗi không xác định" } : null
      );
    }
  };

  const [dropdowns, setDropdowns] = useState<
    { suggestions: GoodsSearchResult[]; loading: boolean; open: boolean }[]
  >([]);

  // Vị trí tuyệt đối của dropdown đang mở (dùng cho Portal)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number; left: number; width: number; index: number;
  } | null>(null);

  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  /* ---- Đóng dropdown khi click ra ngoài ---- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      dropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node)) {
          setDropdowns((prev) =>
            prev.map((d, idx) => (idx === i ? { ...d, open: false } : d))
          );
        }
      });
      // Đóng portal dropdown nếu click ra ngoài input
      setDropdownPos((prev) => {
        if (!prev) return null;
        const inputEl = inputRefs.current[prev.index];
        if (inputEl && !inputEl.contains(e.target as Node)) return null;
        return prev;
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---- Xóa thông tin ngân hàng khi chuyển sang hình thức khác ---- */
  useEffect(() => {
    if (paymentOption !== "BANK") {
      setVoucher((prev) => ({ ...prev, bankName: "", bankAccountNumber: "" }));
    }
  }, [paymentOption]);

  /* =========================
     ITEMS
  ========================= */

  const createEmptyItem = (): VoucherItem => ({
    goodsId: "",
    goodsName: "",
    unit: "",
    quantity: 1,
    unitPrice: 0,
    vat: 10,          // mặc định 10%
    promotion: 0,
    amount1: 0,
    debitAccount1: getDebitAccountByPayment(paymentOption),
    creditAccount1: "511",
    debitAccount2: "632",
    creditAccount2: "156",
    creditWarehouseId: "",
    offsetVoucher: "",
  });

  const addItem = () => {
    setVoucher((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
    setDropdowns((prev) => [...prev, { suggestions: [], loading: false, open: false }]);
  };

  const removeItem = (index: number) => {
    setVoucher((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    setDropdowns((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof VoucherItem, value: any) => {
    const updatedItems = [...voucher.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    // Tính lại thành tiền — KHÔNG cộng VAT
    updatedItems[index].amount1 = calcAmount(updatedItems[index]);
    setVoucher((prev) => ({ ...prev, items: updatedItems }));
  };

  /* ---- Tính vị trí và mở portal dropdown ---- */
  const openPortalDropdown = (index: number) => {
    const el = inputRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,          // fixed → tọa độ từ viewport, không cộng scrollY
      left: rect.left,
      width: Math.max(rect.width, 500),
      index,
    });
  };

  /* =========================
     GOODS SEARCH (DROPDOWN)
  ========================= */

  const handleGoodsIdChange = useCallback(
    (index: number, value: string) => {
      updateItem(index, "goodsId", value);

      if (!value.trim()) {
        setDropdowns((prev) =>
          prev.map((d, i) => i === index ? { suggestions: [], loading: false, open: false } : d)
        );
        setDropdownPos(null);
        return;
      }

      setDropdowns((prev) =>
        prev.map((d, i) => i === index ? { ...d, loading: true, open: true } : d)
      );
      openPortalDropdown(index);

      clearTimeout(debounceTimers.current[index]);
      debounceTimers.current[index] = setTimeout(async () => {
        try {
          const results = await searchGoods(value);
          setDropdowns((prev) =>
            prev.map((d, i) =>
              i === index ? { suggestions: results, loading: false, open: true } : d
            )
          );
          openPortalDropdown(index);
        } catch {
          setDropdowns((prev) =>
            prev.map((d, i) =>
              i === index ? { suggestions: [], loading: false, open: false } : d
            )
          );
          setDropdownPos(null);
        }
      }, 350);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [voucher.items]
  );

  const handleSelectGoods = (index: number, goods: GoodsSearchResult) => {
    const updatedItems = [...voucher.items];
    updatedItems[index] = {
      ...updatedItems[index],
      goodsId:   goods.goodsId,
      goodsName: goods.goodsName,
      unit:      goods.unit,
      unitPrice: goods.salePrice,
    };
    updatedItems[index].amount1 = calcAmount(updatedItems[index]);
    setVoucher((prev) => ({ ...prev, items: updatedItems }));
    setDropdowns((prev) =>
      prev.map((d, i) => i === index ? { suggestions: [], loading: false, open: false } : d)
    );
  };

  /* =========================
     TOTALS
  ========================= */

  const setField = <K extends keyof Voucher>(field: K, value: Voucher[K]) =>
    setVoucher((prev) => ({ ...prev, [field]: value }));

  // Tổng tiền hàng (chưa VAT)
  const totalAmount = useMemo(
    () => voucher.items.reduce((sum, item) => sum + item.amount1, 0),
    [voucher.items]
  );

  // Tổng tiền VAT = Σ (amount1 × vat%)
  const totalVat = useMemo(
    () => voucher.items.reduce((sum, item) => sum + item.amount1 * (item.vat / 100), 0),
    [voucher.items]
  );

  /* =========================
     VALIDATE & SUBMIT
  ========================= */

  const validate = (): string | null => {
    if (!voucher.customerId.trim())    return "Chưa nhập mã khách hàng";
    if (!voucher.customerName.trim())  return "Chưa nhập tên khách hàng";
    if (!voucher.address.trim())       return "Chưa nhập địa chỉ";
    if (!voucher.description.trim())   return "Chưa nhập diễn giải";
    if (!voucher.voucherDate)          return "Chưa chọn ngày chứng từ";
    if (!voucher.voucherNumber.trim()) return "Chưa có số chứng từ";
    if (paymentOption === "BANK") {
      if (!voucher.bankAccountNumber?.trim()) return "Chưa nhập số tài khoản ngân hàng";
      if (!voucher.bankName?.trim())          return "Chưa nhập tên tài khoản ngân hàng";
    }
    if (voucher.items.length === 0) return "Chưa có sản phẩm nào";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }
    try {
      const result = await createSale({ ...voucher, paymentOption });
      setMessage(result.isSuccess ? "Tạo đơn thành công" : result.message);
    } catch {
      setMessage("Lỗi kết nối server");
    }
  };

  /* =========================
     RENDER HELPERS
  ========================= */

  const renderCommonFields = () => (
    <>
      {[
        { label: "Mã khách hàng *",  field: "customerId"    as const, placeholder: "Nhập mã khách hàng"               },
        { label: "Tên khách hàng *", field: "customerName"  as const, placeholder: "Nhập tên khách hàng"              },
        { label: "Địa chỉ *",        field: "address"       as const, placeholder: "Nhập địa chỉ"                     },
        { label: "Diễn giải *",      field: "description"   as const, placeholder: "Nhập diễn giải"                   },
        { label: "Số chứng từ *",    field: "voucherNumber" as const, placeholder: "Số chứng từ (tự sinh, có thể sửa)" },
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
          style={styles.input}
          type="date"
          value={voucher.voucherDate}
          onChange={(e) => setField("voucherDate", e.target.value)}
        />
      </div>
    </>
  );

  const renderBankFields = () => (
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
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Tạo đơn bán hàng</h2>

      {/* Hình thức thanh toán */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Hình thức thanh toán</h3>
        <div style={{ display: "flex", gap: 24 }}>
          {(["CASH", "BANK", "UNPAID"] as PaymentOption[]).map((opt) => (
            <label key={opt} style={styles.radioLabel}>
              <input
                type="radio"
                value={opt}
                checked={paymentOption === opt}
                onChange={() => setPaymentOption(opt)}
                style={{ marginRight: 6 }}
              />
              {opt === "CASH" ? "Tiền mặt" : opt === "BANK" ? "Ngân hàng" : "Chưa thanh toán"}
            </label>
          ))}
        </div>
      </section>

      <hr style={styles.hr} />

      {/* Thông tin chứng từ */}
      <section style={{ ...styles.section, maxWidth: 860 }}>
        <h3 style={styles.sectionTitle}>Thông tin chứng từ</h3>
        {renderCommonFields()}
        {paymentOption === "BANK" && renderBankFields()}
      </section>

      <hr style={styles.hr} />

      {/* Danh sách sản phẩm */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Danh sách sản phẩm</h3>
        <button style={styles.btnSecondary} onClick={addItem}>+ Thêm sản phẩm</button>

        {voucher.items.length === 0 && (
          <p style={{ color: "#999", marginTop: 8 }}>Chưa có sản phẩm nào.</p>
        )}

        {voucher.items.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={styles.itemTable}>
              <thead>
                <tr>
                  {["#", "Mã hàng", "Tên hàng", "Đơn vị", "Số lượng", "Đơn giá", "Thuế VAT", "Tiền VAT", "Thành tiền", ""].map((h) => (
                    <th key={h} style={styles.itemTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {voucher.items.map((item, index) => {
                  const dd = dropdowns[index] ?? { suggestions: [], loading: false, open: false };
                  const vatAmount = item.amount1 * (item.vat / 100);

                  return (
                    <tr key={index} style={{ background: index % 2 === 0 ? "#fff" : "#f8f9ff" }}>

                      {/* STT */}
                      <td style={{ ...styles.itemTd, textAlign: "center", color: "#999", width: 36 }}>{index + 1}</td>

                      {/* Mã hàng — có dropdown portal */}
                      <td style={{ ...styles.itemTd, minWidth: 150 }}>
                        <div
                          style={{ position: "relative" }}
                          ref={(el) => { dropdownRefs.current[index] = el; }}
                        >
                          <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            style={{ ...styles.inputTable, paddingRight: dd.loading ? 26 : 6 }}
                            placeholder="Nhập mã hàng..."
                            value={item.goodsId}
                            onChange={(e) => handleGoodsIdChange(index, e.target.value)}
                            onFocus={(e) => {
                              e.target.select();
                              if (dd.suggestions.length > 0) {
                                setDropdowns((prev) =>
                                  prev.map((d, i) => i === index ? { ...d, open: true } : d)
                                );
                                openPortalDropdown(index);
                              }
                            }}
                            autoComplete="off"
                          />
                          {dd.loading && <span style={styles.spinner}>⏳</span>}
                        </div>
                      </td>

                      {/* Tên hàng — readonly */}
                      <td style={{ ...styles.itemTd, minWidth: 180 }}>
                        <input
                          style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555" }}
                          value={item.goodsName}
                          readOnly
                          tabIndex={-1}
                          placeholder="Tự động điền"
                        />
                      </td>

                      {/* Đơn vị — readonly */}
                      <td style={{ ...styles.itemTd, minWidth: 70 }}>
                        <input
                          style={{ ...styles.inputTable, background: "#f4f4f4", color: "#555", textAlign: "center" }}
                          value={item.unit}
                          readOnly
                          tabIndex={-1}
                        />
                      </td>

                      {/* Số lượng */}
                      <td style={{ ...styles.itemTd, minWidth: 80 }}>
                        <input
                          type="number"
                          style={{ ...styles.inputTable, textAlign: "right" }}
                          value={item.quantity}
                          min={1}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        />
                      </td>

                      {/* Đơn giá */}
                      <td style={{ ...styles.itemTd, minWidth: 120 }}>
                        <input
                          type="number"
                          style={{ ...styles.inputTable, textAlign: "right" }}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                        />
                      </td>

                      {/* Thuế VAT dropdown */}
                      <td style={{ ...styles.itemTd, minWidth: 80 }}>
                        <select
                          style={{ ...styles.selectVat, width: "100%" }}
                          value={item.vat}
                          onChange={(e) => updateItem(index, "vat", Number(e.target.value))}
                        >
                          {VAT_OPTIONS.map((v) => (
                            <option key={v} value={v}>{v}%</option>
                          ))}
                        </select>
                      </td>

                      {/* Tiền VAT */}
                      <td style={{ ...styles.itemTd, textAlign: "right", color: "#b45309", fontWeight: 600, minWidth: 100 }}>
                        {vatAmount.toLocaleString("vi-VN")}
                      </td>

                      {/* Thành tiền */}
                      <td style={{ ...styles.itemTd, textAlign: "right", color: "#2255cc", fontWeight: 700, minWidth: 120 }}>
                        {item.amount1.toLocaleString("vi-VN")}
                      </td>

                      {/* Actions: Kho + Xóa */}
                      <td style={{ ...styles.itemTd, textAlign: "center", whiteSpace: "nowrap" as const, width: 90 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {item.goodsId.trim() && (
                            <button
                              style={styles.btnDetail}
                              onClick={() => fetchWarehouseReport(item.goodsId, item.goodsName)}
                              title="Xem báo cáo xuất nhập kho"
                            >
                              📦 Kho
                            </button>
                          )}
                          <button
                            style={styles.btnDanger}
                            onClick={() => removeItem(index)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bảng tổng kết */}
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

      <button style={styles.btnPrimary} onClick={handleSubmit}>
        Lưu chứng từ
      </button>

      {message && (
        <p style={{ ...styles.message, color: message.includes("thành công") ? "green" : "red" }}>
          {message}
        </p>
      )}

      {/* =====================================================
          PORTAL: DROPDOWN GỢI Ý MÃ HÀNG
          Render thẳng vào body để không bị bất kỳ
          overflow:hidden nào của bảng che khuất
      ===================================================== */}
      {dropdownPos && (() => {
        const dd = dropdowns[dropdownPos.index];
        if (!dd) return null;
        const hasResults = dd.open && dd.suggestions.length > 0;
        const isEmpty = dd.open && !dd.loading && dd.suggestions.length === 0
          && (voucher.items[dropdownPos.index]?.goodsId ?? "").trim() !== "";
        if (!hasResults && !isEmpty) return null;

        return (
          <div
            style={{
              position: "fixed",      // fixed → bám viewport, không trôi khi scroll
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              pointerEvents: "auto",
            }}
          >
            {hasResults && (
              <ul style={{
                listStyle: "none",
                margin: 0,
                padding: "4px 0",
                maxHeight: 280,
                overflowY: "auto",
              }}>
                {dd.suggestions.map((g) => (
                  <li
                    key={g.goodsId}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = "#f0f4ff")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLLIElement).style.background = "transparent")}
                    onMouseDown={() => {
                      handleSelectGoods(dropdownPos.index, g);
                      setDropdownPos(null);
                    }}
                  >
                    <span style={styles.dropdownId}>{g.goodsId}</span>
                    <span style={styles.dropdownName}>{g.goodsName}</span>
                    <span style={styles.dropdownMeta}>
                      {g.unit} · {g.salePrice.toLocaleString("vi-VN")} ₫
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {isEmpty && (
              <div style={{ padding: "10px 14px", fontSize: 13, color: "#999" }}>
                Không tìm thấy sản phẩm
              </div>
            )}
          </div>
        );
      })()}

      {/* =====================================================
          MODAL: BÁO CÁO XUẤT NHẬP KHO
      ===================================================== */}
      {warehouseReport && (
        <div style={styles.modalOverlay} onClick={() => setWarehouseReport(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalTitle}>Báo cáo xuất nhập kho</div>
                <div style={styles.modalSubtitle}>
                  {warehouseReport.goodsId}
                  {warehouseReport.goodsName && ` — ${warehouseReport.goodsName}`}
                </div>
              </div>
              <button
                style={styles.modalClose}
                onClick={() => setWarehouseReport(null)}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={styles.modalBody}>
              {warehouseReport.loading && (
                <div style={styles.modalStatus}>⏳ Đang tải dữ liệu...</div>
              )}

              {warehouseReport.error && (
                <div style={{ ...styles.modalStatus, color: "#cc2222" }}>
                  ⚠️ {warehouseReport.error}
                </div>
              )}

              {!warehouseReport.loading && !warehouseReport.error && warehouseReport.data.length === 0 && (
                <div style={styles.modalStatus}>Không có dữ liệu giao dịch kho.</div>
              )}

              {!warehouseReport.loading && warehouseReport.data.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {[
                          "Ngày CT", "Số CT", "Kho",
                          "CT đối ứng", "Đơn vị",
                          "Nhập kho", "Xuất kho", "Tồn kho", "Giá trị",
                        ].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Tính tồn kho cộng dồn theo thứ tự dòng */}
                      {(() => {
                        let runningStock = 0;
                        return warehouseReport.data.map((row, i) => {
                          runningStock += row.warehouseIn - row.warehouseOut;
                          const isEven = i % 2 === 0;
                          return (
                            <tr
                              key={i}
                              style={{ background: isEven ? "#fff" : "#f7f9ff" }}
                            >
                              <td style={styles.td}>
                                {new Date(row.voucherDate).toLocaleDateString("vi-VN")}
                              </td>
                              <td style={styles.td}>{row.voucherId}</td>
                              <td style={styles.td}>{row.warehouseId || "—"}</td>
                              <td style={styles.td}>{row.offsetVoucher || "—"}</td>
                              <td style={{ ...styles.td, textAlign: "center" }}>{row.unit}</td>
                              <td style={{ ...styles.td, ...styles.tdIn }}>
                                {row.warehouseIn > 0 ? row.warehouseIn.toLocaleString("vi-VN") : "—"}
                              </td>
                              <td style={{ ...styles.td, ...styles.tdOut }}>
                                {row.warehouseOut > 0 ? row.warehouseOut.toLocaleString("vi-VN") : "—"}
                              </td>
                              <td style={{ ...styles.td, ...styles.tdStock, color: runningStock < 0 ? "#cc2222" : "#1a7a3a" }}>
                                {runningStock.toLocaleString("vi-VN")}
                              </td>
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                {row.cost.toLocaleString("vi-VN")} ₫
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    {/* Footer tổng */}
                    <tfoot>
                      <tr style={{ background: "#eef2ff", fontWeight: 600 }}>
                        <td style={styles.td} colSpan={5}>Tổng cộng</td>
                        <td style={{ ...styles.td, ...styles.tdIn }}>
                          {warehouseReport.data
                            .reduce((s, r) => s + r.warehouseIn, 0)
                            .toLocaleString("vi-VN")}
                        </td>
                        <td style={{ ...styles.td, ...styles.tdOut }}>
                          {warehouseReport.data
                            .reduce((s, r) => s + r.warehouseOut, 0)
                            .toLocaleString("vi-VN")}
                        </td>
                        <td style={styles.td}>
                          {warehouseReport.data
                            .reduce((s, r) => s + r.warehouseIn - r.warehouseOut, 0)
                            .toLocaleString("vi-VN")}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          {warehouseReport.data
                            .reduce((s, r) => s + r.cost, 0)
                            .toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* =========================
   STYLES
========================= */

const styles: Record<string, React.CSSProperties> = {
  container:    { maxWidth: "100%", margin: "0 auto", padding: "24px 32px", fontFamily: "sans-serif", fontSize: 14 },
  title:        { fontSize: 22, marginBottom: 16 },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#333" },
  fieldGroup:   { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  label:        { minWidth: 220, color: "#444" },
  input:        { flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14 },
  inputSmall:   { width: 130, padding: "5px 8px", border: "1px solid #ccc", borderRadius: 4, fontSize: 13 },
  selectVat: {
    padding: "5px 8px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 13,
    background: "#fff",
    cursor: "pointer",
    width: 72,
  },
  itemTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
  },
  itemTh: {
    padding: "9px 10px",
    background: "#2255cc",
    color: "#fff",
    textAlign: "left" as const,
    fontWeight: 600,
    fontSize: 12,
    whiteSpace: "nowrap" as const,
    borderBottom: "2px solid #1a44aa",
  },
  itemTd: {
    padding: "6px 8px",
    borderBottom: "1px solid #eee",
    verticalAlign: "middle" as const,
    fontSize: 13,
  },
  inputTable: {
    width: "100%",
    padding: "5px 6px",
    border: "1px solid #ddd",
    borderRadius: 4,
    fontSize: 13,
    boxSizing: "border-box" as const,
    outline: "none",
  },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 2px)",
    left: 0,
    zIndex: 9999,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: 6,
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    listStyle: "none",
    margin: 0,
    padding: "4px 0",
    maxHeight: 260,
    overflowY: "auto" as const,
    minWidth: 480,       // rộng hơn cột, hiện ngang tự do
    width: "max-content",
  },
  dropdownItem:  { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13 },
  dropdownId:    { fontWeight: 700, color: "#2255cc", minWidth: 70, fontSize: 12 },
  dropdownName:  { flex: 1, color: "#222" },
  dropdownMeta:  { fontSize: 11, color: "#888", whiteSpace: "nowrap" as const },
  dropdownEmpty: {
    position: "absolute" as const,
    top: "calc(100% + 4px)",
    left: 0, right: 0,
    zIndex: 100,
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 13,
    color: "#999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  spinner: {
    position: "absolute" as const,
    right: 8, top: "50%",
    transform: "translateY(-50%)",
    fontSize: 13,
    pointerEvents: "none" as const,
  },
  vatBadge: {
    padding: "4px 8px",
    background: "#fff8e1",
    borderRadius: 4,
    fontWeight: 600,
    color: "#b45309",
    minWidth: 90,
    textAlign: "right" as const,
    fontSize: 13,
  },
  amountBadge: {
    padding: "4px 10px",
    background: "#f0f4ff",
    borderRadius: 4,
    fontWeight: 600,
    color: "#2255cc",
    minWidth: 110,
    textAlign: "right" as const,
  },
  summaryBox: {
    marginTop: 16,
    border: "1px solid #e0e8ff",
    borderRadius: 6,
    padding: "12px 16px",
    background: "#f8faff",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    maxWidth: 360,
    marginLeft: "auto" as const,
  },
  summaryRow:   { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#444" },
  summaryTotal: { borderTop: "1px solid #c7d7ff", paddingTop: 8, marginTop: 4, fontSize: 15, color: "#1a3a99" },
  hr:           { border: "none", borderTop: "1px solid #e5e5e5", margin: "16px 0" },
  radioLabel:   { display: "flex", alignItems: "center", cursor: "pointer", fontSize: 14, color: "#333" },
  btnPrimary:   { padding: "8px 20px", background: "#2255cc", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnSecondary: { padding: "6px 14px", background: "#f5f5f5", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", fontSize: 13 },
  btnDanger:    { padding: "4px 10px", background: "#fff0f0", color: "#cc2222", border: "1px solid #ffcccc", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  btnDetail: {
    padding: "4px 12px",
    background: "#f0fff4",
    color: "#1a7a3a",
    border: "1px solid #86efac",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },
  message:      { marginTop: 12, fontWeight: 500 },

  /* ---- Modal ---- */
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 10,
    width: "min(96vw, 900px)",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e5e5",
    background: "#f8faff",
  },
  modalTitle:    { fontSize: 16, fontWeight: 700, color: "#1a3a99" },
  modalSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#888",
    lineHeight: 1,
    padding: "2px 6px",
    borderRadius: 4,
  },
  modalBody:   { padding: "16px 20px", overflowY: "auto" as const, flex: 1 },
  modalStatus: { textAlign: "center" as const, color: "#888", padding: "32px 0", fontSize: 14 },

  /* ---- Table ---- */
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
    minWidth: 700,
  },
  th: {
    padding: "8px 10px",
    background: "#2255cc",
    color: "#fff",
    textAlign: "left" as const,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    fontSize: 12,
  },
  td: {
    padding: "7px 10px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap" as const,
    fontSize: 13,
  },
  tdIn:    { color: "#1a7a3a", fontWeight: 600, textAlign: "right" as const },
  tdOut:   { color: "#cc2222", fontWeight: 600, textAlign: "right" as const },
  tdStock: { fontWeight: 700, textAlign: "right" as const },
};