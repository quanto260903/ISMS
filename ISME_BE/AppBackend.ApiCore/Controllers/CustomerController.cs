using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.CustomerServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _service;
        public CustomerController(ICustomerService service) => _service = service;

        private bool IsAdminOrManager
        {
            get
            {
                var role = User.FindFirstValue(ClaimTypes.Role)
                        ?? User.FindFirstValue("role");
                return role is "1" or "2";
            }
        }

        private IActionResult? RequireAdminOrManager() =>
            IsAdminOrManager ? null : StatusCode(403, new ResultModel<int>
            {
                IsSuccess = false,
                ResponseCode = "FORBIDDEN",
                StatusCode = 403,
                Data = 0,
                Message = "Chỉ Admin hoặc Manager mới có quyền thực hiện thao tác này",
            });

        /// GET /api/Customer/list
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetCustomerListRequest request)
        {
            var result = await _service.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Customer/search?keyword=abc&limit=10
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string keyword = "",
            [FromQuery] int limit = 10)
        {
            var result = await _service.SearchAsync(keyword, limit);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Customer/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/Customer/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.CreateAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Customer/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id, [FromBody] UpdateCustomerRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.UpdateAsync(id, request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Customer/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            string id, [FromBody] UpdateCustomerStatusRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.UpdateStatusAsync(id, request.IsInactive);
            return StatusCode(result.StatusCode, result);
        }

        /// DELETE /api/Customer/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.DeleteAsync(id);
            return StatusCode(result.StatusCode, result);
        }
    }

    public class UpdateCustomerStatusRequest
    {
        public bool IsInactive { get; set; }
    }
}
