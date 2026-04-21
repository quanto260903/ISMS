// ============================================================
//  features/user-management/components/UserManagementPage.tsx
// ============================================================

"use client";

import React, { useState } from "react";
import { useUserManagement } from "../hooks/useUserManagement";
import {
  ROLE_OPTIONS, CONTRACT_OPTIONS,
  type UserListDto, type CreateUserRequest, type UpdateUserRequest,
} from "../types/userManagement.types";

// ── Single role badge ────────────────────────────────────────
function RoleBadge({ roleId, label }: { roleId: number; label: string }) {
  const opt    = ROLE_OPTIONS.find((r) => r.value === roleId);
  const color  = opt?.color  ?? "#64748b";
  const bg     = opt?.bg     ?? "#f8fafc";
  const border = opt?.border ?? "#e2e8f0";
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: bg, color, border: `1px solid ${border}`,
      whiteSpace: "nowrap" as const,
    }}>
      {label}
    </span>
  );
}

// ✅ Multi-role badge list — hiện nhiều badge cạnh nhau
function RoleBadgeList({ roleIds, roleLabels }: {
  roleIds:    number[];
  roleLabels: string[];
}) {
  if (!roleIds || roleIds.length === 0) {
    return <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>;
  }
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
      {roleIds.map((id, idx) => (
        <RoleBadge key={id} roleId={id} label={roleLabels[idx] ?? String(id)} />
      ))}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: active ? "#f0fdf4" : "#f8fafc",
      color:      active ? "#15803d" : "#94a3b8",
      border:     `1px solid ${active ? "#bbf7d0" : "#e2e8f0"}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: active ? "#22c55e" : "#cbd5e1",
        display: "inline-block",
      }} />
      {active ? "Hoạt động" : "Đã khóa"}
    </span>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ title, onClose, children, width = 540 }: {
  title:    string;
  onClose:  () => void;
  children: React.ReactNode;
  width?:   number;
}) {
  return (
    <div style={overlay} onClick={onClose}>
      <div
        style={{ ...modalBox, width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeader}>
          <span style={modalTitle}>{title}</span>
          <button style={modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={modalBody}>{children}</div>
      </div>
    </div>
  );
}

// ── Field row helper ─────────────────────────────────────────
function Field({ label, required, children }: {
  label:    string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={fieldLabel}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const {
    filters, handleFilterChange,
    page, setPage, PAGE_SIZE, totalPages,
    items, total, loading, listError,
    modalMode, selected, detailLoading, submitLoading,
    openCreate, openEdit, openRole, openPassword, closeModal,
    handleCreate, handleUpdate, handleUpdateRole,
    handleResetPassword, handleToggleStatus,
    toast,
  } = useUserManagement();

  return (
    <div style={s.page}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          ...s.toast,
          background: toast.ok ? "#f0fdf4" : "#fff1f2",
          color:      toast.ok ? "#15803d" : "#b91c1c",
          border:     `1.5px solid ${toast.ok ? "#bbf7d0" : "#fca5a5"}`,
        }}>
          {toast.ok ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroEyebrow}>Hệ thống</div>
          <h1 style={s.heroTitle}>Quản lý Người dùng</h1>
          <p style={s.heroSub}>Tạo tài khoản và phân quyền cho nhân viên</p>
        </div>
        <button
          style={{ ...s.btnNew, position: "relative", zIndex: 1 }}
          onClick={openCreate}
        >
          + Tạo tài khoản
        </button>
      </div>

      {/* ── Summary chips ── */}
      <div style={s.chipRow}>
        {[
          {
            label: "Tổng nhân viên",
            value: total,
            bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe",
          },
          {
            label: "Đang hoạt động",
            value: items.filter((i) => i.isActive).length,
            bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0",
          },
          {
            label: "Manager",
            // ✅ đếm user có chứa roleId 2 trong mảng roleIds
            value: items.filter((i) => i.roleIds?.includes(2)).length,
            bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe",
          },
          {
            label: "Staff",
            // ✅ đếm user có chứa roleId 3 trong mảng roleIds
            value: items.filter((i) => i.roleIds?.includes(3)).length,
            bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd",
          },
        ].map(({ label, value, bg, color, border }) => (
          <div key={label} style={{ ...s.chip, background: bg, color, border: `1.5px solid ${border}` }}>
            <span style={s.chipNum}>{value}</span>
            <span style={s.chipLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={s.filterBar}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Tìm kiếm</label>
          <input
            style={{ ...s.filterInput, minWidth: 220 }}
            placeholder="Tên, email, mã nhân viên..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
          />
        </div>

        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Phân quyền</label>
          <select
            style={s.filterInput}
            value={filters.roleId}
            onChange={(e) => handleFilterChange("roleId", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="2">Manager</option>
            <option value="3">Staff</option>
          </select>
        </div>

        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Trạng thái</label>
          <select
            style={s.filterInput}
            value={filters.isActive}
            onChange={(e) => handleFilterChange("isActive", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={s.tableCard}>
        <table style={s.table}>
          <thead>
            <tr>
              {["Mã NV", "Họ tên", "Email", "Phân quyền", "Hợp đồng", "Trạng thái", "Chức năng"]
                .map((h, i) => (
                  <th key={i} style={{
                    ...s.th,
                    textAlign: i >= 5 ? "center" : "left" as const,
                  }}>{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={s.statusCell}>⏳ Đang tải...</td></tr>
            )}
            {!loading && listError && (
              <tr><td colSpan={7} style={{ ...s.statusCell, color: "#b91c1c" }}>
                ⚠️ {listError}
              </td></tr>
            )}
            {!loading && !listError && items.length === 0 && (
              <tr><td colSpan={7} style={s.statusCell}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>👥</div>
                Chưa có nhân viên nào
              </td></tr>
            )}
            {!loading && items.map((user, i) => (
              <UserRow
                key={user.userId}
                user={user}
                i={i}
                onEdit={() => openEdit(user.userId)}
                onRole={() => openRole(user.userId)}
                onPassword={() => openPassword(user)}
                onToggleStatus={() => handleToggleStatus(user)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {total > 0 && (
        <div style={s.footer}>
          <span style={s.totalText}>
            Tổng: <strong>{total}</strong> nhân viên
          </span>
          <div style={s.pagination}>
            <span style={s.pageInfo}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}
            </span>
            <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(1)}>⟪</button>
            <button style={s.pageBtn} disabled={page <= 1}          onClick={() => setPage(page - 1)}>‹</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
            <button style={s.pageBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>⟫</button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modalMode === "create" && (
        <CreateModal
          loading={submitLoading}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}
      {modalMode === "edit" && (
        <EditModal
          user={selected}
          loading={detailLoading || submitLoading}
          onClose={closeModal}
          onSubmit={(payload) => handleUpdate(selected!.userId, payload)}
        />
      )}
      {modalMode === "role" && (
        <RoleModal
          user={selected}
          loading={detailLoading || submitLoading}
          onClose={closeModal}
          // ✅ nhận roleIds: number[] thay vì roleId: number
          onSubmit={(roleIds) => handleUpdateRole(selected!.userId, roleIds)}
        />
      )}
      {modalMode === "password" && (
        <PasswordModal
          userName={selected?.fullName ?? ""}
          loading={submitLoading}
          onClose={closeModal}
          onSubmit={(pw) => handleResetPassword(selected!.userId, pw)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROW
// ─────────────────────────────────────────────────────────────
function UserRow({ user, i, onEdit, onRole, onPassword, onToggleStatus }: {
  user:           UserListDto;
  i:              number;
  onEdit:         () => void;
  onRole:         () => void;
  onPassword:     () => void;
  onToggleStatus: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <tr
      style={{
        background: hover ? "#f0f4ff" : i % 2 === 0 ? "#fff" : "#fafbff",
        transition: "background 0.1s",
        opacity:    user.isActive ? 1 : 0.6,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ ...s.td, fontFamily: "monospace", color: "#64748b", fontSize: 12 }}>
        {user.userId}
      </td>
      <td style={{ ...s.td, fontWeight: 600 }}>
        {user.fullName ?? "—"}
      </td>
      <td style={{ ...s.td, color: "#475569" }}>
        {user.email ?? "—"}
      </td>
      {/* ✅ dùng RoleBadgeList thay RoleBadge */}
      <td style={s.td}>
        <RoleBadgeList roleIds={user.roleIds} roleLabels={user.roleLabels} />
      </td>
      <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>
        {user.contractType ?? "—"}
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <StatusBadge active={user.isActive} />
      </td>
      <td style={{ ...s.td, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <button style={s.btnAction} onClick={onEdit}     title="Chỉnh sửa">✏️</button>
          <button style={s.btnAction} onClick={onRole}     title="Đổi quyền">🔑</button>
          <button style={s.btnAction} onClick={onPassword} title="Reset mật khẩu">🔒</button>
          <button
            style={{
              ...s.btnAction,
              background: user.isActive ? "#fff1f2" : "#f0fdf4",
              color:      user.isActive ? "#b91c1c" : "#15803d",
              border:     `1px solid ${user.isActive ? "#fca5a5" : "#bbf7d0"}`,
            }}
            onClick={onToggleStatus}
            title={user.isActive ? "Khóa tài khoản" : "Kích hoạt"}
          >
            {user.isActive ? "🔴" : "🟢"}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
//  CREATE MODAL
// ─────────────────────────────────────────────────────────────
function CreateModal({ loading, onClose, onSubmit }: {
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (p: CreateUserRequest) => void;
}) {
  const [form, setForm] = useState<CreateUserRequest>({
    fullName: "", email: "", password: "",
    roleIds: [3],   // ✅ default: Staff
    numberOfDependent: 0,
  });
  const [showPw, setShowPw] = useState(false);

  const set = (k: keyof CreateUserRequest, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // ✅ Toggle role trong mảng roleIds
  const toggleRole = (roleId: number) => {
    setForm((prev) => {
      const exists = prev.roleIds.includes(roleId);
      if (exists) {
        // Không cho phép bỏ chọn nếu chỉ còn 1 quyền
        if (prev.roleIds.length <= 1) return prev;
        return { ...prev, roleIds: prev.roleIds.filter((id) => id !== roleId) };
      }
      return { ...prev, roleIds: [...prev.roleIds, roleId] };
    });
  };

  return (
    <Modal title="✨ Tạo tài khoản nhân viên" onClose={onClose} width={580}>

      {/* ✅ Role selector — checkbox (chọn nhiều) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
          Phân quyền
          <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>
          <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>
            (có thể chọn nhiều quyền)
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {ROLE_OPTIONS.map((r) => {
            const checked = form.roleIds.includes(r.value);
            return (
              <div
                key={r.value}
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 10,
                  border: `2px solid ${checked ? r.color : "#e2e8f0"}`,
                  background: checked ? r.bg : "#fafbff",
                  cursor: "pointer", transition: "all 0.15s",
                  position: "relative" as const,
                }}
                onClick={() => toggleRole(r.value)}
              >
                {/* Checkmark góc trên phải */}
                {checked && (
                  <span style={{
                    position: "absolute", top: 8, right: 10,
                    width: 18, height: 18, borderRadius: "50%",
                    background: r.color, color: "#fff",
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    ✓
                  </span>
                )}
                <div style={{ fontWeight: 700, color: checked ? r.color : "#1e293b", fontSize: 13 }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{r.desc}</div>
              </div>
            );
          })}
        </div>
        {/* Preview badges đã chọn */}
        <div style={{
          marginTop: 8, padding: "7px 10px", borderRadius: 7,
          background: "#f8fafc", border: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const,
        }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>Quyền đã chọn:</span>
          {form.roleIds.map((id) => {
            const opt = ROLE_OPTIONS.find((r) => r.value === id);
            return opt ? <RoleBadge key={id} roleId={id} label={opt.label} /> : null;
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Họ và tên" required>
            <input style={inp} placeholder="Nguyễn Văn A"
              value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </Field>
        </div>
        <Field label="Email" required>
          <input style={inp} type="email" placeholder="email@company.com"
            value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Mật khẩu" required>
          <div style={{ position: "relative" }}>
            <input style={inp} type={showPw ? "text" : "password"} placeholder="Tối thiểu 6 ký tự"
              value={form.password} onChange={(e) => set("password", e.target.value)} />
            <button
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#64748b",
              }}
              onClick={() => setShowPw(!showPw)} type="button"
            >{showPw ? "🙈" : "👁️"}</button>
          </div>
        </Field>
        <Field label="Loại hợp đồng">
          <select style={inp} value={form.contractType ?? ""}
            onChange={(e) => set("contractType", e.target.value || undefined)}>
            <option value="">— Chọn —</option>
            {CONTRACT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Số người phụ thuộc">
          <input style={inp} type="number" min={0}
            value={form.numberOfDependent}
            onChange={(e) => set("numberOfDependent", Number(e.target.value))} />
        </Field>
        <Field label="Số CCCD">
          <input style={inp} placeholder="012345678901"
            value={form.idcardNumber ?? ""}
            onChange={(e) => set("idcardNumber", e.target.value || undefined)} />
        </Field>
        <Field label="Ngày cấp">
          <input style={inp} type="date"
            value={form.issuedDate ?? ""}
            onChange={(e) => set("issuedDate", e.target.value || undefined)} />
        </Field>
        <Field label="Nơi cấp">
          <input style={inp} placeholder="Công an TP.HCM"
            value={form.issuedBy ?? ""}
            onChange={(e) => set("issuedBy", e.target.value || undefined)} />
        </Field>
        <Field label="Lương thỏa thuận">
          <input style={inp} type="number" min={0} placeholder="0"
            value={form.negotiatedSalary ?? ""}
            onChange={(e) => set("negotiatedSalary", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="Lương bảo hiểm">
          <input style={inp} type="number" min={0} placeholder="0"
            value={form.insuranceSalary ?? ""}
            onChange={(e) => set("insuranceSalary", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
      </div>

      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button
          style={{ ...btnSave, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
          onClick={() => onSubmit(form)}
        >
          {loading ? "⏳ Đang tạo..." : "✨ Tạo tài khoản"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  EDIT MODAL  (không liên quan đến role — giữ nguyên)
// ─────────────────────────────────────────────────────────────
function EditModal({ user, loading, onClose, onSubmit }: {
  user:     import("../types/userManagement.types").UserDetailDto | null;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (p: UpdateUserRequest) => void;
}) {
  const [form, setForm] = useState<UpdateUserRequest>({});
  const set = (k: keyof UpdateUserRequest, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  React.useEffect(() => {
    if (user) setForm({
      fullName:          user.fullName          ?? "",
      email:             user.email             ?? "",
      idcardNumber:      user.idcardNumber       ?? "",
      issuedDate:        user.issuedDate         ?? "",
      issuedBy:          user.issuedBy           ?? "",
      contractType:      user.contractType       ?? "",
      negotiatedSalary:  user.negotiatedSalary   ?? undefined,
      insuranceSalary:   user.insuranceSalary    ?? undefined,
      numberOfDependent: user.numberOfDependent,
    });
  }, [user]);

  if (loading && !user) return (
    <Modal title="Chỉnh sửa nhân viên" onClose={onClose}>
      <div style={s.statusCell}>⏳ Đang tải thông tin...</div>
    </Modal>
  );

  return (
    <Modal title={`✏️ Chỉnh sửa — ${user?.fullName ?? ""}`} onClose={onClose} width={580}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Họ và tên">
            <input style={inp} value={form.fullName ?? ""}
              onChange={(e) => set("fullName", e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <input style={inp} type="email" value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Loại hợp đồng">
          <select style={inp} value={form.contractType ?? ""}
            onChange={(e) => set("contractType", e.target.value || undefined)}>
            <option value="">— Chọn —</option>
            {CONTRACT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Số CCCD">
          <input style={inp} value={form.idcardNumber ?? ""}
            onChange={(e) => set("idcardNumber", e.target.value)} />
        </Field>
        <Field label="Ngày cấp">
          <input style={inp} type="date" value={form.issuedDate ?? ""}
            onChange={(e) => set("issuedDate", e.target.value)} />
        </Field>
        <Field label="Nơi cấp">
          <input style={inp} value={form.issuedBy ?? ""}
            onChange={(e) => set("issuedBy", e.target.value)} />
        </Field>
        <Field label="Số người phụ thuộc">
          <input style={inp} type="number" min={0}
            value={form.numberOfDependent ?? 0}
            onChange={(e) => set("numberOfDependent", Number(e.target.value))} />
        </Field>
        <Field label="Lương thỏa thuận">
          <input style={inp} type="number" min={0}
            value={form.negotiatedSalary ?? ""}
            onChange={(e) => set("negotiatedSalary", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="Lương bảo hiểm">
          <input style={inp} type="number" min={0}
            value={form.insuranceSalary ?? ""}
            onChange={(e) => set("insuranceSalary", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
      </div>
      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button style={{ ...btnSave, opacity: loading ? 0.7 : 1 }}
          disabled={loading} onClick={() => onSubmit(form)}>
          {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROLE MODAL  ✅ MULTI-ROLE: checkbox thay radio
// ─────────────────────────────────────────────────────────────
function RoleModal({ user, loading, onClose, onSubmit }: {
  user:     import("../types/userManagement.types").UserDetailDto | null;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (roleIds: number[]) => void;   // ✅ array thay vì number
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Khởi tạo từ dữ liệu user hiện tại
  React.useEffect(() => {
    if (user) setSelectedIds(user.roleIds ?? []);
  }, [user]);

  // Toggle thêm/bỏ một quyền
  const toggleRole = (id: number) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        // Không cho bỏ nếu chỉ còn 1 quyền
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  // Kiểm tra có thay đổi gì không
  const unchanged =
    JSON.stringify([...selectedIds].sort()) ===
    JSON.stringify([...(user?.roleIds ?? [])].sort());

  if (loading && !user) return (
    <Modal title="Đổi phân quyền" onClose={onClose} width={440}>
      <div style={s.statusCell}>⏳ Đang tải...</div>
    </Modal>
  );

  return (
    <Modal title={`🔑 Đổi quyền — ${user?.fullName ?? ""}`} onClose={onClose} width={440}>

      {/* Mô tả */}
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 4 }}>
        Quyền hiện tại:{" "}
        <RoleBadgeList
          roleIds={user?.roleIds ?? []}
          roleLabels={user?.roleLabels ?? []}
        />
      </p>
      <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>
        Tích chọn một hoặc nhiều quyền. Tài khoản sẽ có đầy đủ chức năng của các quyền đã chọn.
      </p>

      {/* Warning nếu bỏ chọn hết */}
      {selectedIds.length === 0 && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 12,
          background: "#fff7ed", border: "1.5px solid #fed7aa",
          color: "#c2410c", fontSize: 12, fontWeight: 600,
        }}>
          ⚠️ Phải giữ ít nhất một quyền
        </div>
      )}

      {/* ✅ Checkbox cards thay radio */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {ROLE_OPTIONS.map((r) => {
          const checked = selectedIds.includes(r.value);
          const isOnlyOne = selectedIds.length === 1 && checked;
          return (
            <label
              key={r.value}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 10,
                border: `2px solid ${checked ? r.color : "#e2e8f0"}`,
                background: checked ? r.bg : "#fafbff",
                cursor: isOnlyOne ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                opacity: isOnlyOne ? 0.75 : 1,
              }}
              title={isOnlyOne ? "Phải có ít nhất một quyền" : undefined}
            >
              {/* ✅ checkbox input */}
              <input
                type="checkbox"
                checked={checked}
                disabled={isOnlyOne}
                onChange={() => toggleRole(r.value)}
                style={{ accentColor: r.color, width: 16, height: 16, cursor: isOnlyOne ? "not-allowed" : "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: checked ? r.color : "#1e293b" }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.desc}</div>
              </div>
              {checked && (
                <span style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: r.color, color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Preview quyền sau khi lưu */}
      <div style={{
        padding: "10px 14px", borderRadius: 8,
        background: "#f8fafc", border: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", gap: 8,
        flexWrap: "wrap" as const, marginBottom: 4,
      }}>
        <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>Sau khi lưu:</span>
        {selectedIds.length > 0
          ? selectedIds.map((id) => {
              const opt = ROLE_OPTIONS.find((r) => r.value === id);
              return opt ? <RoleBadge key={id} roleId={id} label={opt.label} /> : null;
            })
          : <span style={{ fontSize: 12, color: "#ef4444" }}>Chưa chọn quyền nào</span>
        }
      </div>

      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button
          style={{
            ...btnSave,
            opacity: (loading || unchanged || selectedIds.length === 0) ? 0.5 : 1,
          }}
          disabled={loading || unchanged || selectedIds.length === 0}
          onClick={() => onSubmit(selectedIds)}
        >
          {loading ? "⏳ Đang lưu..." : "🔑 Xác nhận đổi quyền"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  PASSWORD MODAL  (không thay đổi)
// ─────────────────────────────────────────────────────────────
function PasswordModal({ userName, loading, onClose, onSubmit }: {
  userName: string;
  loading:  boolean;
  onClose:  () => void;
  onSubmit: (pw: string) => void;
}) {
  const [pw, setPw]         = useState("");
  const [pw2, setPw2]       = useState("");
  const [showPw, setShowPw] = useState(false);
  const mismatch = pw && pw2 && pw !== pw2;
  const weak     = pw.length > 0 && pw.length < 6;

  return (
    <Modal title={`🔒 Reset mật khẩu — ${userName}`} onClose={onClose} width={400}>
      <Field label="Mật khẩu mới" required>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inp, borderColor: weak ? "#fca5a5" : undefined }}
            type={showPw ? "text" : "password"}
            placeholder="Tối thiểu 6 ký tự"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 14,
            }}
            onClick={() => setShowPw(!showPw)} type="button"
          >{showPw ? "🙈" : "👁️"}</button>
        </div>
        {weak && <div style={errText}>Mật khẩu phải có ít nhất 6 ký tự</div>}
      </Field>
      <Field label="Xác nhận mật khẩu" required>
        <input
          style={{ ...inp, borderColor: mismatch ? "#fca5a5" : undefined }}
          type={showPw ? "text" : "password"}
          placeholder="Nhập lại mật khẩu"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
        {mismatch && <div style={errText}>Mật khẩu không khớp</div>}
      </Field>
      <div style={modalFooter}>
        <button style={btnCancel} onClick={onClose}>Hủy</button>
        <button
          style={{ ...btnSave, opacity: (loading || !!weak || !!mismatch || !pw) ? 0.5 : 1 }}
          disabled={loading || !!weak || !!mismatch || !pw}
          onClick={() => onSubmit(pw)}
        >
          {loading ? "⏳ Đang reset..." : "🔒 Reset mật khẩu"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  SHARED STYLES
// ─────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "24px 28px", minHeight: "100vh",
    background: "#f8f9ff", fontFamily: "sans-serif", fontSize: 14,
  },
  toast: {
    position: "fixed", top: 20, right: 24, zIndex: 99999,
    padding: "12px 20px", borderRadius: 10,
    fontWeight: 600, fontSize: 13,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  },
  hero: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#3b82f6 100%)",
    borderRadius: 14, padding: "22px 28px", marginBottom: 16,
    boxShadow: "0 8px 24px rgba(29,78,216,0.28)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  heroOrb1: {
    position: "absolute", top: -40, right: 160, width: 160, height: 160,
    borderRadius: "50%", background: "rgba(255,255,255,0.06)",
  },
  heroOrb2: {
    position: "absolute", bottom: -30, left: 60, width: 110, height: 110,
    borderRadius: "50%", background: "rgba(255,255,255,0.04)",
  },
  heroEyebrow: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" },
  heroSub:   { fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0 },
  btnNew: {
    height: 38, padding: "0 22px", borderRadius: 9,
    border: "2px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.15)",
    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  chipRow:   { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" as const },
  chip:      {
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    gap: 3, padding: "12px 20px", borderRadius: 10, minWidth: 110,
  },
  chipNum:   { fontSize: 22, fontWeight: 800 },
  chipLabel: { fontSize: 11, fontWeight: 600 },
  filterBar: {
    display: "flex", gap: 12, alignItems: "flex-end",
    marginBottom: 14, flexWrap: "wrap" as const,
    background: "#fff", padding: "14px 16px",
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  filterGroup:  { display: "flex", flexDirection: "column" as const, gap: 4 },
  filterLabel:  { fontSize: 11, color: "#64748b", fontWeight: 600 },
  filterInput: {
    height: 36, padding: "0 10px",
    border: "1.5px solid #e2e8f0", borderRadius: 7,
    fontSize: 13, background: "#fff", minWidth: 140, outline: "none",
  },
  tableCard: {
    overflowX: "auto" as const, background: "#fff",
    borderRadius: 10, border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 14,
  },
  table:  { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: {
    padding: "11px 14px",
    background: "linear-gradient(180deg,#1e40af,#1d4ed8)",
    color: "#fff", fontWeight: 600, fontSize: 11,
    whiteSpace: "nowrap" as const, letterSpacing: "0.04em",
    borderBottom: "2px solid #1e3a8a",
  },
  td:         { padding: "10px 14px", borderBottom: "1px solid #f1f5f9" },
  statusCell: { padding: "48px 0", textAlign: "center" as const, color: "#94a3b8" },
  footer:     {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 16px", background: "#fff",
    borderRadius: 10, border: "1px solid #e2e8f0",
  },
  totalText:  { fontSize: 13, color: "#64748b" },
  pagination: { display: "flex", alignItems: "center", gap: 6 },
  pageInfo:   { fontSize: 13, color: "#64748b", marginRight: 6 },
  pageBtn:    {
    width: 30, height: 30, border: "1.5px solid #e2e8f0",
    borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14,
  },
  btnAction: {
    width: 32, height: 32, border: "1px solid #e2e8f0",
    borderRadius: 7, background: "#f8fafc", cursor: "pointer",
    fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
};

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 16,
};

const modalBox: React.CSSProperties = {
  background: "#fff", borderRadius: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  maxHeight: "90vh", overflowY: "auto",
};

const modalHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "18px 24px 0",
};

const modalTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "#1e293b",
};

const modalClose: React.CSSProperties = {
  width: 28, height: 28, border: "none",
  background: "#f1f5f9", color: "#64748b",
  borderRadius: 7, cursor: "pointer", fontSize: 12,
};

const modalBody: React.CSSProperties = { padding: "16px 24px 24px" };

const modalFooter: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", gap: 10,
  paddingTop: 16, marginTop: 8,
  borderTop: "1px solid #f1f5f9",
};

const inp: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 7,
  fontSize: 13, outline: "none", boxSizing: "border-box",
};

const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: 12,
  fontWeight: 600, color: "#475569", marginBottom: 5,
};

const btnCancel: React.CSSProperties = {
  height: 36, padding: "0 20px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer",
};

const btnSave: React.CSSProperties = {
  height: 36, padding: "0 24px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)",
  color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
};

const errText: React.CSSProperties = {
  fontSize: 11, color: "#ef4444", marginTop: 4,
};