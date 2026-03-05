// ============================================================
//  features/inward/hooks/useInwardForm.ts
//  Quản lý state form phiếu nhập kho
// ============================================================

"use client";

import { useState, useMemo, useRef } from "react";
import { createInward } from "../import.api";
import type { PaymentOption, InwardVoucher, InwardItem } from "../types/import.types";
import {
  generateVoucherNumber,
  getVoucherCodeByPayment,
  getCreditAccountByPayment,
  calcAmount,
} from "../constants/import.constants";

export function useInwardForm(userId: string = "") {
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("UNPAID");
  const [message, setMessage]             = useState("");

  const [voucher, setVoucher] = useState<InwardVoucher>({
    voucherId:          generateVoucherNumber(),
    voucherCode:        getVoucherCodeByPayment("UNPAID"), // NK3 mặc định
    customerId:         "",
    customerName:       "",
    taxCode:            "",
    address:            "",
    voucherDescription: "",
    voucherDate:        new Date().toISOString().split("T")[0],
    invoiceSymbol:      "",
    invoiceNumber:      "",
    invoiceDate:        "",
    bankName:           "",
    bankAccountNumber:  "",
    items:              [],
  });

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

  // ---- Items ----

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

  const filledItems = useMemo(
    () => voucher.items.slice(0, -1),
    [voucher.items]
  );

  const totalAmount = useMemo(
    () => filledItems.reduce((s, i) => s + i.amount1, 0),
    [filledItems]
  );

  const totalVat = useMemo(
    () => filledItems.reduce((s, i) => s + i.amount1 * (i.vat / 100), 0),
    [filledItems]
  );

  // ---- Validate ----

  const validate = (): string | null => {
    if (!voucher.voucherId.trim())          return "Chưa có số phiếu";
    if (!voucher.customerName.trim())       return "Chưa nhập tên nhà cung cấp";
    if (!voucher.voucherDate)               return "Chưa chọn ngày";
    if (paymentOption === "BANK") {
      if (!voucher.bankAccountNumber?.trim()) return "Chưa nhập số tài khoản ngân hàng";
      if (!voucher.bankName?.trim())          return "Chưa nhập tên tài khoản ngân hàng";
    }
    if (filledItems.length === 0) return "Chưa có hàng hóa nào";
    for (const item of filledItems) {
      if (!item.debitWarehouseId.trim())
        return `Chưa chọn kho nhập cho: ${item.goodsName || item.goodsId}`;
    }
    return null;
  };

  // ---- Submit ----

  const handleSubmit = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }
    try {
      const result = await createInward({
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
      setMessage(result.isSuccess ? "Tạo phiếu nhập kho thành công" : result.message);
    } catch {
      setMessage("Lỗi kết nối server");
    }
  };

  return {
    voucher, paymentOption, message,
    totalAmount, totalVat,
    setField, handlePaymentChange,
    addItem, removeItem, updateItem,
    handleSubmit,
  };
}