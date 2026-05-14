using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.UserRepo;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.UserServices
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;

        public UserService(IUserRepository repo)
            => _repo = repo;

        // ── Map entity → DTO ──────────────────────────────────
        // ✅ User.UserRoles phải được Include trước khi gọi hàm này
        private static UserDetailDto MapToDetail(User u) => new()
        {
            UserId = u.UserId,
            Username = u.Username,
            FullName = u.FullName,
            Email = u.Email,
            // ✅ multi-role: lấy từ collection UserRoles
            RoleIds = u.UserRoles.Select(r => r.RoleId).ToList(),
            RoleLabels = u.UserRoles
                                 .Select(r => RoleConstants.Labels
                                     .GetValueOrDefault(r.RoleId, "Unknown"))
                                 .ToList(),
            IsActive = u.IsActive ?? false,
            IdcardNumber = u.IdcardNumber,
            IssuedDate = u.IssuedDate,
            IssuedBy = u.IssuedBy,
            ContractType = u.ContractType,
            NegotiatedSalary = u.NegotiatedSalary,
            InsuranceSalary = u.InssuranceSalary,
            NumberOfDependent = u.NumberOfDependent,
        };

        private static UserListDto MapToList(User u) => new()
        {
            UserId = u.UserId,
            FullName = u.FullName,
            Email = u.Email,
            // ✅ multi-role
            RoleIds = u.UserRoles.Select(r => r.RoleId).ToList(),
            RoleLabels = u.UserRoles
                            .Select(r => RoleConstants.Labels
                                .GetValueOrDefault(r.RoleId, "Unknown"))
                            .ToList(),
            IsActive = u.IsActive ?? false,
            ContractType = u.ContractType,
        };

        // ── Helper: kiểm tra user có quyền Admin không ────────
        // ✅ Thay vì user.RoleId == Admin, giờ kiểm tra trong collection
        private static bool HasAdminRole(User u)
            => u.UserRoles.Any(r => r.RoleId == RoleConstants.Admin);

        // ── Danh sách người dùng ──────────────────────────────
        public async Task<ResultModel<PagedResult<UserListDto>>> GetListAsync(
            GetUserListRequest request)
        {
            try
            {
                // _repo.GetListAsync phải Include(u => u.UserRoles)
                var (items, total) = await _repo.GetListAsync(request);
                var dtos = items.Select(MapToList).ToList();

                return Ok(new PagedResult<UserListDto>
                {
                    Items = dtos,
                    Total = total,
                    Page = request.Page,
                    PageSize = request.PageSize,
                }, "OK");
            }
            catch (Exception ex) { return Error<PagedResult<UserListDto>>(ex); }
        }

        // ── Chi tiết 1 người dùng ─────────────────────────────
        public async Task<ResultModel<UserDetailDto>> GetByIdAsync(string userId)
        {
            try
            {
                // _repo.GetByIdAsync phải Include(u => u.UserRoles)
                var user = await _repo.GetByIdAsync(userId);
                if (user == null)
                    return Fail<UserDetailDto>(404, "NOT_FOUND",
                        $"Không tìm thấy người dùng: {userId}");

                return Ok(MapToDetail(user), "OK");
            }
            catch (Exception ex) { return Error<UserDetailDto>(ex); }
        }

        // ── Tạo tài khoản mới ────────────────────────────────
        public async Task<ResultModel<UserDetailDto>> CreateUserAsync(
            CreateUserRequest request, string adminId)
        {
            try
            {
                // Validate thông tin cơ bản
                if (string.IsNullOrWhiteSpace(request.FullName))
                    return Fail<UserDetailDto>(400, "MISSING_FULLNAME",
                        "Họ tên không được để trống");

                if (string.IsNullOrWhiteSpace(request.Email))
                    return Fail<UserDetailDto>(400, "MISSING_EMAIL",
                        "Email không được để trống");

                if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
                    return Fail<UserDetailDto>(400, "WEAK_PASSWORD",
                        "Mật khẩu phải có ít nhất 6 ký tự");

                // ✅ Validate từng roleId trong danh sách
                if (request.RoleIds == null || request.RoleIds.Count == 0)
                    return Fail<UserDetailDto>(400, "MISSING_ROLE",
                        "Phải chọn ít nhất một quyền");

                if (request.RoleIds.Any(id => id == RoleConstants.Admin))
                    return Fail<UserDetailDto>(403, "FORBIDDEN_ROLE",
                        "Không thể tạo tài khoản Admin");

                if (request.RoleIds.Any(id => !RoleConstants.IsValid(id)))
                    return Fail<UserDetailDto>(400, "INVALID_ROLE",
                        "RoleId không hợp lệ. Chấp nhận: 2 (Manager), 3 (Staff)");

                // Kiểm tra email trùng
                var existing = await _repo.GetByEmailAsync(request.Email);
                if (existing != null)
                    return Fail<UserDetailDto>(409, "EMAIL_TAKEN",
                        $"Email '{request.Email}' đã được sử dụng");

                var userId = "U" + Guid.NewGuid().ToString("N")[..7].ToUpper();

                var user = new User
                {
                    UserId = userId,
                    Username = request.Email.Trim().ToLower(),
                    Email = request.Email.Trim().ToLower(),
                    FullName = request.FullName.Trim(),
                    PasswordHash = HashPassword(request.Password),
                    IsActive = true,
                    IdcardNumber = request.IdcardNumber,
                    IssuedDate = request.IssuedDate,
                    IssuedBy = request.IssuedBy,
                    ContractType = request.ContractType,
                    NegotiatedSalary = request.NegotiatedSalary,
                    InssuranceSalary = request.InsuranceSalary,
                    NumberOfDependent = request.NumberOfDependent,
                    // ✅ Gán nhiều roles ngay khi tạo
                    UserRoles = request.RoleIds
                        .Distinct()
                        .Select(rid => new UserRole { UserId = userId, RoleId = rid })
                        .ToList(),
                };

                await _repo.AddAsync(user);
                await _repo.SaveChangesAsync();

                return new ResultModel<UserDetailDto>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 201,
                    Data = MapToDetail(user),
                    Message = $"Tạo tài khoản thành công cho {user.FullName}",
                };
            }
            catch (Exception ex) { return Error<UserDetailDto>(ex); }
        }

        // ── Cập nhật thông tin ────────────────────────────────
        public async Task<ResultModel<UserDetailDto>> UpdateUserAsync(
            string userId, UpdateUserRequest request, string adminId)
        {
            try
            {
                var user = await _repo.GetByIdAsync(userId);
                if (user == null)
                    return Fail<UserDetailDto>(404, "NOT_FOUND",
                        $"Không tìm thấy người dùng: {userId}");

                // ✅ Dùng helper HasAdminRole thay vì user.RoleId == Admin
                if (HasAdminRole(user) && user.UserId != adminId)
                    return Fail<UserDetailDto>(403, "FORBIDDEN",
                        "Không có quyền chỉnh sửa tài khoản Admin khác");

                if (!string.IsNullOrWhiteSpace(request.FullName))
                    user.FullName = request.FullName.Trim();

                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    var emailOwner = await _repo.GetByEmailAsync(request.Email);
                    if (emailOwner != null && emailOwner.UserId != userId)
                        return Fail<UserDetailDto>(409, "EMAIL_TAKEN",
                            $"Email '{request.Email}' đã được sử dụng");

                    user.Email = request.Email.Trim().ToLower();
                    user.Username = request.Email.Trim().ToLower();
                }

                if (request.IdcardNumber != null) user.IdcardNumber = request.IdcardNumber;
                if (request.IssuedDate != null) user.IssuedDate = request.IssuedDate;
                if (request.IssuedBy != null) user.IssuedBy = request.IssuedBy;
                if (request.ContractType != null) user.ContractType = request.ContractType;
                if (request.NegotiatedSalary != null) user.NegotiatedSalary = request.NegotiatedSalary;
                if (request.InsuranceSalary != null) user.InssuranceSalary = request.InsuranceSalary;
                if (request.NumberOfDependent != null) user.NumberOfDependent = request.NumberOfDependent.Value;

                await _repo.SaveChangesAsync();
                return Ok(MapToDetail(user), "Cập nhật thành công");
            }
            catch (Exception ex) { return Error<UserDetailDto>(ex); }
        }

        // ── Đổi phân quyền (multi-role) ───────────────────────
        public async Task<ResultModel<int>> UpdateRoleAsync(
            string userId, UpdateRoleRequest request, string adminId)
        {
            try
            {
                // ✅ Validate danh sách roleIds
                if (request.RoleIds == null || request.RoleIds.Count == 0)
                    return Fail<int>(400, "MISSING_ROLE",
                        "Phải chọn ít nhất một quyền");

                if (request.RoleIds.Any(id => id == RoleConstants.Admin))
                    return Fail<int>(403, "FORBIDDEN_ROLE",
                        "Không thể gán quyền Admin");

                if (request.RoleIds.Any(id => !RoleConstants.IsValid(id)))
                    return Fail<int>(400, "INVALID_ROLE",
                        "RoleId không hợp lệ. Chấp nhận: 2 (Manager), 3 (Staff)");

                // ✅ GetByIdAsync phải Include(u => u.UserRoles)
                var user = await _repo.GetByIdAsync(userId);
                if (user == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy người dùng: {userId}");

                if (HasAdminRole(user))
                    return Fail<int>(403, "FORBIDDEN",
                        "Không thể thay đổi quyền của Admin");

                // Ghi log quyền cũ → mới để trả về message
                var oldLabels = user.UserRoles
                    .Select(r => RoleConstants.Labels.GetValueOrDefault(r.RoleId, "?"))
                    .ToList();
                var newLabels = request.RoleIds
                    .Select(id => RoleConstants.Labels.GetValueOrDefault(id, "?"))
                    .ToList();

                // ✅ Xóa toàn bộ roles cũ, gán lại roles mới
                await _repo.RemoveUserRolesAsync(userId);
                user.UserRoles = request.RoleIds
                    .Distinct()
                    .Select(rid => new UserRole { UserId = userId, RoleId = rid })
                    .ToList();

                var rows = await _repo.SaveChangesAsync();

                return Ok(rows,
                    $"Đã đổi quyền {user.FullName}: " +
                    $"[{string.Join(", ", oldLabels)}] → [{string.Join(", ", newLabels)}]");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        // ── Reset mật khẩu ────────────────────────────────────
        public async Task<ResultModel<int>> ResetPasswordAsync(
            string userId, ResetPasswordRequest request, string adminId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.NewPassword) ||
                    request.NewPassword.Length < 6)
                    return Fail<int>(400, "WEAK_PASSWORD",
                        "Mật khẩu mới phải có ít nhất 6 ký tự");

                var user = await _repo.GetByIdAsync(userId);
                if (user == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy người dùng: {userId}");

                // ✅ dùng HasAdminRole
                if (HasAdminRole(user) && user.UserId != adminId)
                    return Fail<int>(403, "FORBIDDEN",
                        "Không thể reset mật khẩu Admin khác");

                user.PasswordHash = HashPassword(request.NewPassword);
                var rows = await _repo.SaveChangesAsync();

                return Ok(rows, $"Đã reset mật khẩu cho {user.FullName}");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        // ── Kích hoạt / khóa tài khoản ───────────────────────
        public async Task<ResultModel<int>> UpdateStatusAsync(
            string userId, UpdateStatusRequest request, string adminId)
        {
            try
            {
                var user = await _repo.GetByIdAsync(userId);
                if (user == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy người dùng: {userId}");

                // ✅ dùng HasAdminRole
                if (HasAdminRole(user))
                    return Fail<int>(403, "FORBIDDEN",
                        "Không thể khóa tài khoản Admin");

                if (user.UserId == adminId && !request.IsActive)
                    return Fail<int>(400, "SELF_LOCK",
                        "Không thể tự khóa tài khoản của chính mình");

                user.IsActive = request.IsActive;
                var rows = await _repo.SaveChangesAsync();

                var action = request.IsActive ? "kích hoạt" : "khóa";
                return Ok(rows, $"Đã {action} tài khoản {user.FullName}");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        // ── Password helpers ──────────────────────────────────
        private static string HashPassword(string password)
            => BCrypt.Net.BCrypt.HashPassword(password);

        // ── Result helpers ────────────────────────────────────
        private static ResultModel<T> Ok<T>(T data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };

        private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };

        private static ResultModel<T> Error<T>(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
    }
}