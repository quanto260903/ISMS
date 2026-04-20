using AppBackend.Services.Services.ActivityLogServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogService _activityLogService;

        public ActivityLogController(IActivityLogService activityLogService)
        {
            _activityLogService = activityLogService;
        }

        /// <summary>
        /// Danh sách nhật ký hoạt động (dành cho Manager)
        /// GET /api/ActivityLog/list?module=NHAP_KHO&fromDate=2026-04-01&toDate=2026-04-30&keyword=&page=1&pageSize=50
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetList(
            [FromQuery] string? module,
            [FromQuery] string? fromDate,
            [FromQuery] string? toDate,
            [FromQuery] string? keyword,
            [FromQuery] int page     = 1,
            [FromQuery] int pageSize = 50)
        {
            DateTime? from = DateTime.TryParse(fromDate, out var fd) ? fd : null;
            DateTime? to   = DateTime.TryParse(toDate,   out var td) ? td : null;

            var result = await _activityLogService.GetListAsync(module, from, to, keyword, page, pageSize);
            return StatusCode(result.StatusCode, result);
        }
    }
}
