using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.AuditServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _service;
        public AuditController(IAuditService service) => _service = service;

        /// GET /api/Audit/list?fromDate=2026-01-01&toDate=2026-03-31&keyword=KK&page=1&pageSize=50
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetAuditListRequest request)
        {
            var result = await _service.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Audit/{voucherId}
        [HttpGet("{voucherId}")]
        public async Task<IActionResult> GetById(string voucherId)
        {
            var result = await _service.GetByIdAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/Audit/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateAuditRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ",
                });

            var userId = User?.Identity?.Name ?? "SYSTEM";
            var result = await _service.CreateAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Audit/{voucherId}
        [HttpPut("{voucherId}")]
        public async Task<IActionResult> Update(
            string voucherId, [FromBody] CreateAuditRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ",
                });

            if (voucherId != request.VoucherId)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "ID_MISMATCH",
                    StatusCode = 400,
                    Data = 0,
                    Message = "VoucherId trong URL và body không khớp",
                });

            var userId = User?.Identity?.Name ?? "SYSTEM";
            var result = await _service.UpdateAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }
    }
}