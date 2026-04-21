using System.ComponentModel.DataAnnotations;

namespace AppBackend.BusinessObjects.Dtos
{
    public class UserDto
    {
        public string UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int Role { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }

    // ── Constants ─────────────────────────────────────────────
    public static class RoleConstants
    {
        public const int Admin = 1;
        public const int Manager = 2;
        public const int Staff = 3;

        public static readonly Dictionary<int, string> Labels = new()
        {
            { Admin,   "Admin"   },
            { Manager, "Manager" },
            { Staff,   "Staff"   },
        };

        // IsValid chỉ cho phép Manager và Staff (Admin không được tạo/gán từ UI)
        public static bool IsValid(int roleId) =>
            roleId == Manager || roleId == Staff;
    }

    // ── Request: tạo tài khoản mới ────────────────────────────
    public class CreateUserRequest
    {
        [Required]
        public string FullName { get; set; } = null!;

        [Required]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;

        // ✅ multi-role: thay RoleId: int → RoleIds: List<int>
        [Required, MinLength(1, ErrorMessage = "Phải chọn ít nhất một quyền")]
        public List<int> RoleIds { get; set; } = new() { RoleConstants.Staff };

        // Thông tin nhân viên (tuỳ chọn)
        public string? IdcardNumber { get; set; }
        public DateOnly? IssuedDate { get; set; }
        public string? IssuedBy { get; set; }
        public string? ContractType { get; set; }
        public decimal? NegotiatedSalary { get; set; }
        public decimal? InsuranceSalary { get; set; }
        public int NumberOfDependent { get; set; } = 0;
    }

    // ── Request: cập nhật thông tin ───────────────────────────
    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? IdcardNumber { get; set; }
        public DateOnly? IssuedDate { get; set; }
        public string? IssuedBy { get; set; }
        public string? ContractType { get; set; }
        public decimal? NegotiatedSalary { get; set; }
        public decimal? InsuranceSalary { get; set; }
        public int? NumberOfDependent { get; set; }
    }

    // ── Request: đổi role (multi-role) ────────────────────────
    public class UpdateRoleRequest
    {
        [Required, MinLength(1, ErrorMessage = "Phải có ít nhất một quyền")]
        public List<int> RoleIds { get; set; } = new();
    }

    // ── Request: reset mật khẩu ───────────────────────────────
    public class ResetPasswordRequest
    {
        [Required, MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = null!;
    }

    // ── Request: đổi trạng thái ───────────────────────────────
    public class UpdateStatusRequest
    {
        public bool IsActive { get; set; }
    }

    // ── Request: lọc danh sách ────────────────────────────────
    public class GetUserListRequest
    {
        public string? Keyword { get; set; }
        public int? RoleId { get; set; }   // lọc theo 1 role (optional)
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    // ── Response: chi tiết 1 user ─────────────────────────────
    public class UserDetailDto
    {
        public string UserId { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? FullName { get; set; }
        public string? Email { get; set; }

        // ✅ multi-role
        public List<int> RoleIds { get; set; } = new();
        public List<string> RoleLabels { get; set; } = new();

        public bool IsActive { get; set; }

        // Thông tin nhân viên
        public string? IdcardNumber { get; set; }
        public DateOnly? IssuedDate { get; set; }
        public string? IssuedBy { get; set; }
        public string? ContractType { get; set; }
        public decimal? NegotiatedSalary { get; set; }
        public decimal? InsuranceSalary { get; set; }
        public int NumberOfDependent { get; set; }
    }

    // ── Response: dòng trong danh sách ───────────────────────
    public class UserListDto
    {
        public string UserId { get; set; } = null!;
        public string? FullName { get; set; }
        public string? Email { get; set; }

        // ✅ multi-role
        public List<int> RoleIds { get; set; } = new();
        public List<string> RoleLabels { get; set; } = new();

        public bool IsActive { get; set; }
        public string? ContractType { get; set; }
    }

}