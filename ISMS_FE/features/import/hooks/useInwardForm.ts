// ============================================================
//  features/inward/hooks/useInwardForm.ts
//  Dùng cho cả CREATE và EDIT — phân biệt bằng initialData
// ============================================================

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createInward, updateInward } from "../import.api";
import type { PaymentOption, InwardVoucher, InwardItem } from "../types/import.types";
import {
  generateVoucherNumber,
  getVoucherCodeByPayment,
  getCreditAccountByPayment,
  calcAmount,
} from "../constants/import.constants";

interface UseInwardFormOptions {
  userId?:       string;
  userFullName?: string;
  initialData?:  InwardVoucher;   // truyền vào khi EDIT, bỏ trống khi CREATE
  onSuccess?:    () => void;       // callback sau khi lưu thành công
}

export function useInwardForm({
  userId       = "",
  userFullName = "",
  initialData,
  onSuccess,
}: UseInwardFormOptions = {}) {

  const isEditMode = !!initialData;

  // ── Detect paymentOption từ voucherCode khi EDIT ──────────
  const detectPayment = (code?: string): PaymentOption => {
    if (!code) return "UNPAID";
    if (code === "NK2") return "CASH";
    if (code === "NK3") return "BANK";
    return "UNPAID";
  };

  const [paymentOption, setPaymentOption] = useState<PaymentOption>(
    isEditMode ? detectPayment(initialData?.voucherCode) : "UNPAID"
  );
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);

  // ── Voucher state — khởi tạo từ initialData nếu EDIT ─────
  const [voucher, setVoucher] = useState<InwardVoucher>(
    initialData ?? {
      voucherId:          generateVoucherNumber(),
      voucherCode:        getVoucherCodeByPayment("UNPAID"),
      customerId:         "",
      customerName:       "",
      taxCode:            "",
      address:            "",
      voucherDescription: userFullName ? `Người lập phiếu: ${userFullName}` : "",
      voucherDate:        new Date().toISOString().split("T")[0],
      bankName:           "",
      bankAccountNumber:  "",
      items:              [],
    }
  );

  // Khi initialData thay đổi (fetch xong) → sync lại state
  useEffect(() => {
    if (!initialData) return;
    setVoucher(initialData);
    setPaymentOption(detectPayment(initialData.voucherCode));
  }, [initialData?.voucherId]); // chỉ re-sync khi load phiếu khác

  // ── Field helpers ─────────────────────────────────────────
  const setField = <K extends keyof InwardVoucher>(field: K, value: InwardVoucher[K]) =>
    setVoucher((prev) => ({ ...prev, [field]: value }));

  const handlePaymentChange = (opt: PaymentOption) => {
    setPaymentOption(opt);
    setVoucher((prev) => ({
      ...prev,
      voucherCode: getVoucherCodeByPayment(opt),
      ...(opt !== "BANK" && { bankName: "", bankAccountNumber: "" }),
    }));
  };

  // ── Items ─────────────────────────────────────────────────
  const createEmptyItem = (payment: PaymentOption): InwardItem => ({
    goodsId:          "",
    goodsName:        "",
    unit:             "",
    quantity:         1,
    unitPrice:        0,
    amount1:          0,
    vat:              10,
    promotion:        0,
    debitAccount1:    "156",
    creditAccount1:   getCreditAccountByPayment(payment),
    debitWarehouseId: "",
    debitAccount2:    "1331",
    creditAccount2:   getCreditAccountByPayment(payment),
    userId:           userId,
    createdDateTime:  new Date().toISOString(),
  });

  const paymentOptionRef = useRef(paymentOption);
  paymentOptionRef.current = paymentOption;

  const addItem = () =>
    setVoucher((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem(paymentOptionRef.current)],
    }));

  const removeItem = (index: number) =>
    setVoucher((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

  const updateItem = (index: number, field: keyof InwardItem, value: unknown) => {
    setVoucher((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      items[index].amount1 = calcAmount(items[index]);
      return { ...prev, items };
    });
  };

  const replaceAllItems = (newItems: InwardItem[]) =>
    setVoucher((prev) => ({ ...prev, items: newItems }));

  // ── Totals ────────────────────────────────────────────────
  const filledItems = useMemo(
    () => voucher.items.slice(0, -1),
    [voucher.items]
  );

  const totalAmount = useMemo(
    () => filledItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    [filledItems]
  );

  const totalVat = useMemo(
    () => filledItems.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vat / 100), 0),
    [filledItems]
  );

  // ── Validate ──────────────────────────────────────────────
  const validate = (): string | null => {
    if (!voucher.voucherId.trim())    return "Chưa có số phiếu";
    if (!voucher.customerName.trim()) return "Chưa nhập tên nhà cung cấp";
    if (!voucher.voucherDate)         return "Chưa chọn ngày";
    if (paymentOption === "BANK") {
      if (!voucher.bankAccountNumber?.trim()) return "Chưa nhập số tài khoản ngân hàng";
      if (!voucher.bankName?.trim())          return "Chưa nhập tên tài khoản ngân hàng";
    }
    if (filledItems.length === 0) return "Chưa có hàng hóa nào";
    return null;
  };

  // ── Build payload (dùng chung cho create và update) ───────
  const buildPayload = () => ({
    voucherId:          voucher.voucherId,
    voucherCode:        voucher.voucherCode,
    customerId:         voucher.customerId,
    customerName:       voucher.customerName,
    taxCode:            voucher.taxCode,
    address:            voucher.address,
    voucherDescription: voucher.voucherDescription,
    voucherDate:        voucher.voucherDate,
    bankName:           voucher.bankName,
    bankAccountNumber:  voucher.bankAccountNumber,
    items: filledItems.map((item) => ({
      goodsId:          item.goodsId,
      goodsName:        item.goodsName,
      unit:             item.unit,
      quantity:         item.quantity,
      unitPrice:        item.unitPrice,
      amount1:          item.amount1,
      vat:              item.vat,
      promotion:        item.promotion,
      debitAccount1:    item.debitAccount1,
      creditAccount1:   item.creditAccount1,
      debitWarehouseId: item.debitWarehouseId,
      debitAccount2:    item.debitAccount2,
      creditAccount2:   item.creditAccount2,
      userId:           item.userId || userId,
      createdDateTime:  item.createdDateTime || new Date().toISOString(),
    })),
  });

  // ── Submit — tự chọn create hoặc update ──────────────────
  const handleSubmit = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }

    setLoading(true);
    setMessage("");
    try {
      const payload = buildPayload();
      const result  = isEditMode
        ? await updateInward(voucher.voucherId, payload)
        : await createInward(payload);

      if (result.isSuccess) {
        setMessage(isEditMode ? "Cập nhật phiếu nhập kho thành công" : "Tạo phiếu nhập kho thành công");
        onSuccess?.();
      } else {
        setMessage(result.message || "Có lỗi xảy ra");
      }
    } catch {
      setMessage("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return {
    voucher, paymentOption, message, loading, isEditMode,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem, replaceAllItems,
    handleSubmit,
  };
}