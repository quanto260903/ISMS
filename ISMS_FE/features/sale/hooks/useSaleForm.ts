// ============================================================
//  features/sale/hooks/useSaleForm.ts
//  Quản lý toàn bộ state form: voucher, items, validate, submit
// ============================================================
'use client';
import { useState, useMemo, useRef } from "react";
import { createSale } from "@/services/api/sale.api";
import type { PaymentOption, Voucher, VoucherItem } from "../types/sale.types";
import {
  generateVoucherNumber,
  getDebitAccountByPayment,
  getVoucherCodeByPayment,
  calcAmount,
} from "../constants/sale.constants";

export function useSaleForm(userId: string = "") {
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("CASH");
  const [message, setMessage] = useState("");

  const [voucher, setVoucher] = useState<Voucher>({
    voucherId:          generateVoucherNumber(),
    voucherCode:        getVoucherCodeByPayment(paymentOption),
    customerId:         "",
    customerName:       "",
    taxCode:            "",
    address:            "",
    bankName:           "",
    bankAccountNumber:  "",
    voucherDescription: "",
    voucherDate:        new Date().toISOString().split("T")[0],
    items:              [],
  });

  const setField = <K extends keyof Voucher>(field: K, value: Voucher[K]) =>
    setVoucher((prev) => ({ ...prev, [field]: value }));

 const handlePaymentChange = (opt: PaymentOption) => {
  setPaymentOption(opt);

  setVoucher((prev) => ({
    ...prev,
    voucherCode: getVoucherCodeByPayment(opt),
    ...(opt !== "BANK" && { bankName: "", bankAccountNumber: "" }),

    // 🔥 UPDATE lại debitAccount1 của tất cả item
    items: prev.items.map(item => ({
      ...item,
      debitAccount1: getDebitAccountByPayment(opt)
    }))
  }));
};

  // ---- Items ----

  const createEmptyItem = (payment: PaymentOption): VoucherItem => ({
    goodsId:           "",
    goodsName:         "",
    unit:              "",
    quantity:          1,
    unitPrice:         0,
    amount2:           0,
    vat:               10,
    promotion:         0,
    amount1:           0,
    debitAccount1:     getDebitAccountByPayment(payment),  // dùng param, không dùng closure
    creditAccount1:    "511",
    debitAccount2:     "632",
    creditAccount2:    "156",
    creditWarehouseId: "",
    offsetVoucher:     "",
    userId:            userId,
    createdDateTime:   new Date().toISOString(),
  });

  // Đọc paymentOption từ state ref để luôn lấy giá trị mới nhất
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

  const updateItem = (index: number, field: keyof VoucherItem, value: unknown) => {
    setVoucher((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      items[index].amount1 = calcAmount(items[index]);
      return { ...prev, items };
    });
  };

  // ---- Bỏ dòng trống cuối trước khi tính / gửi ----

  const filledItems = useMemo(
    () => voucher.items.slice(0, -1),
    [voucher.items]
  );

  const totalAmount = useMemo(
    () => filledItems.reduce((sum, item) => sum + item.amount1, 0),
    [filledItems]
  );

  const totalVat = useMemo(
    () => filledItems.reduce((sum, item) => sum + item.amount1 * (item.vat / 100), 0),
    [filledItems]
  );

  // ---- Validate ----

  const validate = (): string | null => {
    if (!voucher.customerId.trim())         return "Chưa nhập mã khách hàng";
    if (!voucher.customerName.trim())       return "Chưa nhập tên khách hàng";
    if (!voucher.address.trim())            return "Chưa nhập địa chỉ";
    if (!voucher.voucherDescription.trim()) return "Chưa nhập diễn giải";
    if (!voucher.voucherDate)               return "Chưa chọn ngày chứng từ";
    if (!voucher.voucherId.trim())          return "Chưa có số chứng từ";
    if (paymentOption === "BANK") {
      if (!voucher.bankAccountNumber?.trim()) return "Chưa nhập số tài khoản ngân hàng";
      if (!voucher.bankName?.trim())          return "Chưa nhập tên tài khoản ngân hàng";
    }
    if (filledItems.length === 0) return "Chưa có sản phẩm nào";
    return null;
  };

  // ---- Submit: map đúng tên field với backend ----

  const handleSubmit = async () => {
    const error = validate();
    if (error) { setMessage(error); return; }
    try {
      const result = await createSale({
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
        paymentOption,
        items: filledItems.map((item) => ({
          goodsId:           item.goodsId,
          goodsName:         item.goodsName,
          unit:              item.unit,
          quantity:          item.quantity,
          unitPrice:         item.unitPrice,
          amount1:           item.amount1,
          amount2:           item.amount2,
          promotion:         item.promotion,
          vat:               item.vat,
          debitAccount1:     item.debitAccount1,
          creditAccount1:    item.creditAccount1,
          debitAccount2:     item.debitAccount2,
          creditAccount2:    item.creditAccount2,
          creditWarehouseId: item.creditWarehouseId,
          offsetVoucher:     item.offsetVoucher,
          userId:            item.userId || userId,
          createdDateTime:   item.createdDateTime || new Date().toISOString(),
        })),
      });
      setMessage(result.isSuccess ? "Tạo đơn thành công" : result.message);
    } catch {
      setMessage("Lỗi kết nối server");
    }
  };

  return {
    voucher,
    paymentOption,
    message,
    totalAmount,
    totalVat,
    setField,
    handlePaymentChange,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
  };
}