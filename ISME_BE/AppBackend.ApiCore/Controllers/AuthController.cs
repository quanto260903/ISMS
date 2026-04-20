using AppBackend.Services.ApiModels.Auth;
using AppBackend.Services.Services.ActivityLogServices;
using AppBackend.Services.Services.AuthServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IActivityLogService _actLog;

        public AuthController(IAuthService authService, IActivityLogService actLog)
        {
            _authService = authService;
            _actLog      = actLog;
        }

        /// POST /warehouse/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] AuthLoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /warehouse/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] AuthRegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            if (result.IsSuccess)
                await _actLog.LogAsync(null, "DANG_KY",
                    $"Tài khoản mới đăng ký: {request.FullName} ({request.Email})",
                    ActivityModule.User);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /warehouse/auth/me  — cần token hợp lệ
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            // Lấy userId từ JWT claim
            var userId = User.FindFirstValue("userId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _authService.GetMeAsync(userId);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /warehouse/auth/logout  — client-side only, không cần xử lý server
        [HttpPost("logout")]
        [AllowAnonymous]
        public IActionResult Logout()
        {
            return Ok(new { isSuccess = true, message = "Logged out" });
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] string email)
        {
            await _authService.SendLinkResetPassword(email);
            return Ok(new
            {
                message = "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link reset mật khẩu."
            });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            await _authService.ResetPasswordAsync(request);
            return Ok(new
            {
                message = "Đổi mật khẩu thành công."
            });
        }
    }
}
