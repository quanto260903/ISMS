using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Exceptions;
using AppBackend.BusinessObjects.Models;
using AppBackend.Services.ApiModels;
using AppBackend.Services.ApiModels.Auth;
using AppBackend.Services.Services.Email;
using CloudinaryDotNet.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AppBackend.Services.Services.AuthServices
{
    public class AuthService : IAuthService
    {
        private readonly IndividualBusinessContext _context;
        private readonly IConfiguration _config;
        private IResetPasswordTokenService _resetPasswordService;
        private IEmailService _emailService;
        public AuthService(IndividualBusinessContext context, IConfiguration config,
            IResetPasswordTokenService resetPasswordTokenService,
            IEmailService emailService)
        {
            _context = context;
            _config = config;
            _resetPasswordService = resetPasswordTokenService;
            _emailService = emailService;
        }

        // ── Login ──────────────────────────────────────────────────────────
        public async Task<ResultModel<AuthData>> LoginAsync(AuthLoginRequest request)
        {
            try
            {
                var user = await _context.Users
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

        // ── Register ───────────────────────────────────────────────────────
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
                    RoleId = 1, // Tài khoản đăng ký luôn là Admin
                    IsActive = true,
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
                    Message = "Đăng ký thành công"
                };
            }
            catch (Exception ex) { return Error<AuthData>(ex); }
        }

        // ── GetMe ──────────────────────────────────────────────────────────
        public async Task<ResultModel<UserDto>> GetMeAsync(string userId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive == true);

                if (user == null)
                    return Fail<UserDto>(404, "NOT_FOUND", "Không tìm thấy người dùng");

                return Ok(MapToDto(user), "OK");
            }
            catch (Exception ex) { return Error<UserDto>(ex); }
        }

        // ── Helpers ────────────────────────────────────────────────────────

        private static UserDto MapToDto(User user)
        {
            var roleName = user.RoleId switch
            {
                1 => "Admin",
                2 => "Manager",
                3 => "Staff",
                _ => "User"
            };

            return new UserDto
            {
                UserId = user.UserId,
                FullName = user.FullName ?? user.Username ?? "",
                Email = user.Email ?? user.Username ?? "",
                Role = user.RoleId,
                RoleName = roleName,
            };
        }

        private string GenerateToken(User user, UserDto dto)
        {
            var key = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var issuer = _config["Jwt:Issuer"];
            var audience = _config["Jwt:Audience"];
            var expMins = int.TryParse(
                _config["Jwt:AccessTokenExpirationMinutes"], out var m) ? m : 30;

            var claims = new[]
            {
                new Claim("userId",   user.UserId),
                new Claim("username", user.Username ?? ""),
                new Claim("email",    user.Email    ?? ""),
                new Claim("fullName",                dto.FullName),
                new Claim(ClaimTypes.Role, dto.Role.ToString()),
            };

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
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private static bool VerifyPassword(string password, string stored)
        {
            if (string.IsNullOrWhiteSpace(stored)) return false;
            return BCrypt.Net.BCrypt.Verify(password, stored);
        }

        // ── Result helpers ─────────────────────────────────────────────────

        private static ResultModel<T> Ok<T>(T data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };

        private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };

        private static ResultModel<T> Error<T>(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };

        public async Task SendLinkResetPassword(string email)
        {
            email = email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(e => e.Email == email)
                ?? throw new BadRequestException("Không tìm thấy email");

            var token = _resetPasswordService.GenerateToken(user);
            var resetLink = $"{_config["ResetPassword:ResetUrl"]}?token={Uri.EscapeDataString(token)}";
            var expiredTime = _config["ResetPassword:ExpireMinutes"];
            var subject = "Reset password";
            var body = $@"
        Xin chào,
        
        Bạn vừa yêu cầu đặt lại mật khẩu.
        
        Bấm vào link bên dưới để đặt lại mật khẩu:
        {resetLink}
        
        Link có hiệu lực trong {expiredTime} phút.
        
        Nếu không phải bạn yêu cầu, hãy bỏ qua email này.
        ";
            await _emailService.SendEmail(user.Email, subject, body);

        }

        public async Task ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword))
                throw new BadRequestException("Mật khẩu mới không được để trống.");

            if (request.NewPassword != request.ConfirmPassword)
                throw new BadRequestException("Xác nhận mật khẩu không khớp.");

            var validateResult = await _resetPasswordService.ValidateTokenAsync(request.Token);

            if (!validateResult.IsValid || validateResult.User == null)
                throw new BadRequestException(validateResult.Message);

            var user = validateResult.User;

            // Đổi password -> PasswordHash đổi -> token cũ tự vô hiệu
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            await _context.SaveChangesAsync();
        }
    }
}