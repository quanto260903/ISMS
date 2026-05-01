using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Services.ApiModels;
using AppBackend.Services.ApiModels.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AppBackend.Services.Services.AuthServices
{
    public class AuthService : IAuthService
    {
        private readonly IndividualBusinessContext _context;
        private readonly IConfiguration _config;

        public AuthService(IndividualBusinessContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ── Login ──────────────────────────────────────────────
        public async Task<ResultModel<AuthData>> LoginAsync(AuthLoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.UserRoles)
                    .FirstOrDefaultAsync(u =>
                        u.Email == request.Email.Trim().ToLower() &&
                        u.IsActive == true);

                if (user == null || !VerifyPassword(request.Password, user.PasswordHash ?? ""))
                    return Fail<AuthData>(401, "INVALID_CREDENTIALS",
                        "Email hoặc mật khẩu không đúng");

                var dto = MapToDto(user);
                var token = GenerateToken(user, dto);

                return Ok(new AuthData { User = dto, Token = token }, "Đăng nhập thành công");
            }
            catch (Exception ex) { return Error<AuthData>(ex); }
        }

        // ── Register ───────────────────────────────────────────
        public async Task<ResultModel<AuthData>> RegisterAsync(AuthRegisterRequest request)
        {
            try
            {
                var exists = await _context.Users
                    .AnyAsync(u => u.Email == request.Email.Trim().ToLower());

                if (exists)
                    return Fail<AuthData>(409, "EMAIL_TAKEN",
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
                    UserRoles = new List<UserRole>
                    {
                        new UserRole { UserId = userId, RoleId = RoleConstants.Admin }
                    },
                };

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();

                var dto = MapToDto(user);
                var token = GenerateToken(user, dto);

                return new ResultModel<AuthData>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 201,
                    Data = new AuthData { User = dto, Token = token },
                    Message = "Đăng ký thành công",
                };
            }
            catch (Exception ex) { return Error<AuthData>(ex); }
        }

        // ── GetMe ──────────────────────────────────────────────
        public async Task<ResultModel<UserDto>> GetMeAsync(string userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.UserRoles)
                    .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive == true);

                if (user == null)
                    return Fail<UserDto>(404, "NOT_FOUND", "Không tìm thấy người dùng");

                return Ok(MapToDto(user), "OK");
            }
            catch (Exception ex) { return Error<UserDto>(ex); }
        }

        // ── Helpers ────────────────────────────────────────────

        // Role cao nhất — dùng để xác định redirect sau login
        private static int PrimaryRoleId(User user)
        {
            var ids = user.UserRoles.Select(r => r.RoleId).ToHashSet();
            if (ids.Contains(RoleConstants.Admin)) return RoleConstants.Admin;
            if (ids.Contains(RoleConstants.Manager)) return RoleConstants.Manager;
            if (ids.Contains(RoleConstants.Staff)) return RoleConstants.Staff;
            return 0;
        }

        // ✅ Fix: MapToDto trả về toàn bộ mảng Roles thay vì chỉ 1 role
        private static UserDto MapToDto(User user)
        {
            var primaryRoleId = PrimaryRoleId(user);
            var roleName = RoleConstants.Labels.GetValueOrDefault(primaryRoleId, "Unknown");

            // Lấy toàn bộ roleId user có, sắp xếp ưu tiên cao → thấp
            var allRoleIds = user.UserRoles
                .Select(r => r.RoleId)
                .OrderBy(id => id)   // 1=Admin < 2=Manager < 3=Staff
                .ToList();

            var allRoleNames = allRoleIds
                .Select(id => RoleConstants.Labels.GetValueOrDefault(id, id.ToString()))
                .ToList();

            return new UserDto
            {
                UserId = user.UserId,
                FullName = user.FullName ?? user.Username ?? "",
                Email = user.Email ?? user.Username ?? "",

                // Giữ nguyên Role (role cao nhất) để không break code cũ
                Role = primaryRoleId,
                RoleName = roleName,

                // ✅ Thêm mới: toàn bộ roles user có
                Roles = allRoleIds,
                RoleNames = allRoleNames,
            };
        }

        private string GenerateToken(User user, UserDto dto)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            var expMins = int.TryParse(
                _config["Jwt:AccessTokenExpirationMinutes"], out var m) ? m : 30;

            var claims = new List<Claim>
            {
                new Claim("userId",   user.UserId),
                new Claim("username", user.Username ?? ""),
                new Claim("email",    user.Email    ?? ""),
                new Claim("fullName", dto.FullName),
                // Claim role chính (tương thích ngược với code cũ)
                new Claim(ClaimTypes.Role, dto.Role.ToString()),
            };

            // ✅ Thêm claim cho từng role trong mảng Roles
            foreach (var roleId in dto.Roles)
            {
                // Tránh thêm trùng role chính đã có ở trên
                if (roleId != dto.Role)
                    claims.Add(new Claim(ClaimTypes.Role, roleId.ToString()));

                var label = RoleConstants.Labels.GetValueOrDefault(roleId, roleId.ToString());
                claims.Add(new Claim("role_name", label));
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expMins),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string HashPassword(string password)
            => BCrypt.Net.BCrypt.HashPassword(password);

        private static bool VerifyPassword(string password, string stored)
        {
            if (string.IsNullOrWhiteSpace(stored)) return false;
            return BCrypt.Net.BCrypt.Verify(password, stored);
        }

        // ── Result helpers ─────────────────────────────────────
        private static ResultModel<T> Ok<T>(T data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };

        private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };

        private static ResultModel<T> Error<T>(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
    }
}