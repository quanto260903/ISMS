// ============================================================
//  features/customers/hooks/useCustomerManagement.ts
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getCustomerList, getCustomerById, createCustomer,
  updateCustomer, updateCustomerStatus, deleteCustomer,
} from "../customer.api";
import type {
  CustomerListDto, CustomerDetailDto,
  CreateCustomerRequest, UpdateCustomerRequest,
} from "../types/customer.types";

interface Filters {
  keyword:      string;
  isInactive:   string;
  isEnterprise: string;
}

export function useCustomerManagement() {
  const PAGE_SIZE = 20;

  const [filters, setFilters]   = useState<Filters>({ keyword: "", isInactive: "false", isEnterprise: "" });
  const [page, setPage]         = useState(1);
  const [items, setItems]       = useState<CustomerListDto[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [listError, setListErr] = useState("");

  type ModalMode = "create" | "edit" | "none";
  const [modalMode, setModalMode]      = useState<ModalMode>("none");
  const [selected, setSelected]        = useState<CustomerDetailDto | null>(null);
  const [detailLoading, setDetailLoad] = useState(false);
  const [submitLoading, setSubmitLoad] = useState(false);
  const [confirmDelete, setConfirmDel] = useState<CustomerListDto | null>(null);
  const [toast, setToast]              = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true); setListErr("");
    try {
      const res = await getCustomerList({
        keyword:      f.keyword      || undefined,
        isInactive:   f.isInactive   !== "" ? f.isInactive   === "true" : undefined,
        isEnterprise: f.isEnterprise !== "" ? f.isEnterprise === "true" : undefined,
        page: p, pageSize: PAGE_SIZE,
      });
      setItems(res.items); setTotal(res.total);
    } catch (e: unknown) {
      setListErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(filters, page); }, [filters, page, fetchList]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((p) => ({ ...p, [field]: value })); setPage(1);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => { setSelected(null); setModalMode("create"); };

  const openEdit = async (id: string) => {
    setDetailLoad(true); setModalMode("edit");
    try { setSelected(await getCustomerById(id)); }
    catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tải chi tiết", false);
      setModalMode("none");
    } finally { setDetailLoad(false); }
  };

  const closeModal = () => { setModalMode("none"); setSelected(null); };

  const handleCreate = async (payload: CreateCustomerRequest) => {
    setSubmitLoad(true);
    try {
      await createCustomer(payload);
      showToast("Tạo khách hàng thành công");
      closeModal(); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo khách hàng", false);
    } finally { setSubmitLoad(false); }
  };

  const handleUpdate = async (id: string, payload: UpdateCustomerRequest) => {
    setSubmitLoad(true);
    try {
      await updateCustomer(id, payload);
      showToast("Cập nhật thành công");
      closeModal(); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi cập nhật", false);
    } finally { setSubmitLoad(false); }
  };

  const handleToggleStatus = async (item: CustomerListDto) => {
    try {
      const msg = await updateCustomerStatus(item.customerId, !item.isInactive);
      showToast(msg); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi đổi trạng thái", false);
    }
  };

  const handleDelete = async (item: CustomerListDto) => {
    setSubmitLoad(true);
    try {
      const msg = await deleteCustomer(item.customerId);
      showToast(msg); setConfirmDel(null); fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi xóa", false);
      setConfirmDel(null);
    } finally { setSubmitLoad(false); }
  };

  return {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items, total, loading, listError,
    modalMode, selected, detailLoading, submitLoading,
    confirmDelete, setConfirmDel,
    openCreate, openEdit, closeModal,
    handleCreate, handleUpdate, handleToggleStatus, handleDelete,
    toast,
  };
}