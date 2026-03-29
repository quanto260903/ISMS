using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.ImportServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly IImportServices _importService;

        public ImportController(IImportServices importService)
        {
            _importService = importService;
        }
        /// <summary>
        /// Xem trước mã phiếu nhập kho tiếp theo (không tiêu thụ số thứ tự)
        /// GET /api/Import/next-id
        /// </summary>
        [HttpGet("next-id")]
        public async Task<IActionResult> GetNextId()
        {
            var nextId = await _importService.GetNextVoucherIdAsync();
            return Ok(new { voucherId = nextId });
        }

        /// <summary>
        /// Thêm mới phiếu nhập kho
        /// </summary>
        [HttpPost("add-inward")]
        public async Task<IActionResult> AddInward([FromBody] ImportOrder request)
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
            var result = await _importService.CreateInwardAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Danh sách phiếu nhập kho — có lọc và phân trang
        /// GET /api/Inward/list?fromDate=2026-03-01&toDate=2026-03-31&keyword=NK&page=1&pageSize=50
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetInwardListRequest request)
        {
            var result = await _importService.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy chi tiết phiếu nhập kho theo ID
        /// GET /api/Import/{voucherId}
        /// </summary>
        [HttpGet("{voucherId}")]
        public async Task<IActionResult> GetById(string voucherId)
        {
            var result = await _importService.GetByIdAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Cập nhật phiếu nhập kho
        /// PUT /api/Import/{voucherId}
        /// </summary>
        [HttpPut("{voucherId}")]
        public async Task<IActionResult> UpdateInward(string voucherId, [FromBody] ImportOrder request)
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
            var result = await _importService.UpdateInwardAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Xóa phiếu nhập kho
        /// DELETE /api/Import/{voucherId}
        /// </summary>
        [HttpDelete("{voucherId}")]
        public async Task<IActionResult> DeleteInward(string voucherId)
        {
            var result = await _importService.DeleteAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
