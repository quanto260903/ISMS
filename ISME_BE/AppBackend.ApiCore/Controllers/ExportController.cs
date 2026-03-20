using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.ExportServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExportController : ControllerBase
    {
        private readonly IExportServices _exportService;

        public ExportController(IExportServices exportService)
        {
            _exportService = exportService;
        }

        /// <summary>
        /// Danh sách phiếu xuất kho — có lọc và phân trang
        /// GET /api/Export/list?fromDate=2026-03-01&toDate=2026-03-31&keyword=XH&page=1&pageSize=50
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetExportListRequest request)
        {
            var result = await _exportService.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy chi tiết phiếu xuất kho theo ID
        /// GET /api/Export/{voucherId}
        /// </summary>
        [HttpGet("{voucherId}")]
        public async Task<IActionResult> GetById(string voucherId)
        {
            var result = await _exportService.GetByIdAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Tạo mới phiếu xuất kho
        /// POST /api/Export/add-export
        /// </summary>
        [HttpPost("add-export")]
        public async Task<IActionResult> AddExport([FromBody] ExportOrder request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ"
                });

            string userId = User?.Identity?.Name ?? "SYSTEM";
            var result = await _exportService.CreateExportAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Cập nhật phiếu xuất kho
        /// PUT /api/Export/{voucherId}
        /// </summary>
        [HttpPut("{voucherId}")]
        public async Task<IActionResult> UpdateExport(string voucherId, [FromBody] ExportOrder request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ"
                });

            if (voucherId != request.VoucherId)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "ID_MISMATCH",
                    StatusCode = 400,
                    Data = 0,
                    Message = "VoucherId trong URL và body không khớp"
                });

            string userId = User?.Identity?.Name ?? "SYSTEM";
            var result = await _exportService.UpdateExportAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }
        // ============================================================
        //  Thêm vào ExportController — chỉ gọi service
        // ============================================================

        // GET /Export/fifo-preview?goodsId=SP001&quantity=15
        [HttpGet("fifo-preview")]
        public async Task<IActionResult> FifoPreview(
            [FromQuery] string goodsId,
            [FromQuery] int quantity)
        {
            if (string.IsNullOrWhiteSpace(goodsId) || quantity <= 0)
                return BadRequest(new { message = "goodsId và quantity là bắt buộc" });

            // Controller chỉ gọi service — không chạm repository
            var result = await _exportService.GetFifoPreviewAsync(goodsId, quantity);
            return Ok(result);
        }
    }
}
