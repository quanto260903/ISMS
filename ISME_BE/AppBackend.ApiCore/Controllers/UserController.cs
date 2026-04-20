using AppBackend.Attributes;
using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.ActivityLogServices;
using AppBackend.Services.Services.UserServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.Api.Controllers
{
    /// <summary>
    /// APIs for managing users (Register, Login, Query Users)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _service;
        private readonly IActivityLogService _actLog;

        public UserController(IUserService service, IActivityLogService actLog)
        {
            _service = service;
            _actLog  = actLog;
        }

        // Lấy userId của người đang gọi từ JWT
        private string CurrentUserId =>
    User.FindFirstValue("userId") ?? "SYSTEM";

        private bool IsAdmin =>
            User.FindFirstValue(ClaimTypes.Role) == RoleConstants.Admin.ToString();

        // Helper trả 403 nếu không phải Admin
        private IActionResult? RequireAdmin()
        {
            if (!IsAdmin)
                return StatusCode(403, new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "FORBIDDEN",
                    StatusCode = 403,
                    Data = 0,
                    Message = "Chỉ Admin mới có quyền thực hiện thao tác này",
                });
            return null;
        }

        /// GET /api/UserManagement/list?keyword=&roleId=3&isActive=true&page=1&pageSize=50
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetUserListRequest request)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            var result = await _service.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/UserManagement/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetById(string userId)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            var result = await _service.GetByIdAsync(userId);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/UserManagement/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ",
                });

            var result = await _service.CreateUserAsync(request, CurrentUserId);
            if (result.IsSuccess)
                await _actLog.LogAsync(CurrentUserId, "TAO_TAI_KHOAN",
                    $"Admin tạo tài khoản mới: {request.FullName} ({request.Email}) - Vai trò: {request.RoleId}",
                    ActivityModule.User);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/UserManagement/{userId}
        [HttpPut("{userId}")]
        public async Task<IActionResult> Update(
            string userId, [FromBody] UpdateUserRequest request)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            var result = await _service.UpdateUserAsync(userId, request, CurrentUserId);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/UserManagement/{userId}/role
        [HttpPut("{userId}/role")]
        public async Task<IActionResult> UpdateRole(
            string userId, [FromBody] UpdateRoleRequest request)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            var result = await _service.UpdateRoleAsync(userId, request, CurrentUserId);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/UserManagement/{userId}/password
        [HttpPut("{userId}/password")]
        public async Task<IActionResult> ResetPassword(
            string userId, [FromBody] ResetPasswordRequest request)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            var result = await _service.ResetPasswordAsync(userId, request, CurrentUserId);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/UserManagement/{userId}/status
        [HttpPut("{userId}/status")]
        public async Task<IActionResult> UpdateStatus(
            string userId, [FromBody] UpdateStatusRequest request)
        {
            var deny = RequireAdmin();
            if (deny != null) return deny;

            var result = await _service.UpdateStatusAsync(userId, request, CurrentUserId);
            return StatusCode(result.StatusCode, result);
        }
    }
}