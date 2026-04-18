using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.InventoryReportServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InventoryReportController : ControllerBase
    {
        private readonly IInventoryReportService _service;

        public InventoryReportController(IInventoryReportService service)
            => _service = service;

        private bool IsAdminOrManager
        {
            get
            {
                var role = User.FindFirstValue(ClaimTypes.Role)
                        ?? User.FindFirstValue("role");
                return role is "1" or "2";
            }
        }

        /// GET /api/InventoryReport/summary?fromDate=2026-01-01&toDate=2026-04-16&keyword=
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] GetInventorySummaryRequest request)
        {
            if (!IsAdminOrManager)
                return StatusCode(403, new ResultModel<int>
                {
                    IsSuccess    = false,
                    ResponseCode = "FORBIDDEN",
                    StatusCode   = 403,
                    Data         = 0,
                    Message      = "Chỉ Admin hoặc Manager mới có quyền xem báo cáo tồn kho",
                });

            // Mặc định: đầu tháng hiện tại → hôm nay
            var today = DateOnly.FromDateTime(DateTime.Today);
            if (request.FromDate == default)
                request.FromDate = new DateOnly(today.Year, today.Month, 1);
            if (request.ToDate == default)
                request.ToDate = today;

            var result = await _service.GetSummaryAsync(request);
            return StatusCode(result.StatusCode, result);
        }
    }
}
