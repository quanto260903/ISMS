// ============================================================
//  features/user-management/hooks/useUserManagement.ts
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getUserList, getUserById, createUser,
  updateUser, updateRole, resetPassword, updateStatus,
} from "../userManagement.api";
import type {
  UserListDto, UserDetailDto,
  CreateUserRequest, UpdateUserRequest,
} from "../types/userManagement.types";

interface Filters {
  keyword:  string;
  roleId:   string;   // "" | "2" | "3"
  isActive: string;   // "" | "true" | "false"
}

export function useUserManagement() {
  // ── List state ──────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    keyword: "", roleId: "", isActive: "",
  });
  const [page, setPage]       = useState(1);
  const PAGE_SIZE              = 20;
  const [items, setItems]     = useState<UserListDto[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");

  // ── Modal / detail state ────────────────────────────────────
  type ModalMode = "create" | "edit" | "role" | "password" | "none";
  const [modalMode, setModalMode]     = useState<ModalMode>("none");
  const [selected, setSelected]       = useState<UserDetailDto | null>(null);
  const [detailLoading, setDetailLoad]= useState(false);
  const [submitLoading, setSubmitLoad]= useState(false);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Fetch list ──────────────────────────────────────────────
  const fetchList = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    setListError("");
    try {
      const res = await getUserList({
        keyword:  f.keyword  || undefined,
        roleId:   f.roleId   ? Number(f.roleId)           : undefined,
        isActive: f.isActive !== "" ? f.isActive === "true" : undefined,
        page:     p,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(filters, page); }, [filters, page, fetchList]);

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // ── Show toast ──────────────────────────────────────────────
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Open modals ─────────────────────────────────────────────
  const openCreate = () => { setSelected(null); setModalMode("create"); };

  const openEdit = async (userId: string) => {
    setDetailLoad(true);
    setModalMode("edit");
    try {
      const detail = await getUserById(userId);
      setSelected(detail);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tải chi tiết", false);
      setModalMode("none");
    } finally {
      setDetailLoad(false);
    }
  };

  const openRole = async (userId: string) => {
    setDetailLoad(true);
    setModalMode("role");
    try {
      const detail = await getUserById(userId);
      setSelected(detail);
    } catch {
      setModalMode("none");
    } finally {
      setDetailLoad(false);
    }
  };

  const openPassword = (user: UserListDto) => {
    setSelected({ ...user } as unknown as UserDetailDto);
    setModalMode("password");
  };

  const closeModal = () => { setModalMode("none"); setSelected(null); };

  // ── Submit handlers ─────────────────────────────────────────
  const handleCreate = async (payload: CreateUserRequest) => {
    setSubmitLoad(true);
    try {
      await createUser(payload);
      showToast("Tạo tài khoản thành công");
      closeModal();
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi tạo tài khoản", false);
    } finally {
      setSubmitLoad(false);
    }
  };

  const handleUpdate = async (userId: string, payload: UpdateUserRequest) => {
    setSubmitLoad(true);
    try {
      await updateUser(userId, payload);
      showToast("Cập nhật thành công");
      closeModal();
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi cập nhật", false);
    } finally {
      setSubmitLoad(false);
    }
  };

  const handleUpdateRole = async (userId: string, roleId: number) => {
    setSubmitLoad(true);
    try {
      const msg = await updateRole(userId, roleId);
      showToast(msg);
      closeModal();
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi đổi quyền", false);
    } finally {
      setSubmitLoad(false);
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    setSubmitLoad(true);
    try {
      const msg = await resetPassword(userId, newPassword);
      showToast(msg);
      closeModal();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi reset mật khẩu", false);
    } finally {
      setSubmitLoad(false);
    }
  };

  const handleToggleStatus = async (user: UserListDto) => {
    try {
      const msg = await updateStatus(user.userId, !user.isActive);
      showToast(msg);
      fetchList(filters, page);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Lỗi đổi trạng thái", false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    // list
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    // modal
    modalMode, selected, detailLoading, submitLoading,
    openCreate, openEdit, openRole, openPassword, closeModal,
    // actions
    handleCreate, handleUpdate, handleUpdateRole,
    handleResetPassword, handleToggleStatus,
    // toast
    toast,
  };
}