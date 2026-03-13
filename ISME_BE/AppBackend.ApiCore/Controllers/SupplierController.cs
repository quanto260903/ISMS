using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.SupplierServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierService _service;
        public SupplierController(ISupplierService service) => _service = service;

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

        /// GET /api/Supplier/search?keyword=abc&limit=10
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string keyword = "",
            [FromQuery] int limit = 10)
        {
            var result = await _service.SearchAsync(keyword, limit);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Supplier/list
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetSupplierListRequest request)
        {
            var result = await _service.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Supplier/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/Supplier/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request)
        {
            var role = User.FindFirstValue(ClaimTypes.Role);
            Console.WriteLine("ROLE = " + role);
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.CreateAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Supplier/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateSupplierRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.UpdateAsync(id, request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Supplier/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateSupplierStatusRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.UpdateStatusAsync(id, request.IsInactive);
            return StatusCode(result.StatusCode, result);
        }

        /// DELETE /api/Supplier/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.DeleteAsync(id);
            return StatusCode(result.StatusCode, result);
        }
    }

    public class UpdateSupplierStatusRequest
    {
        public bool IsInactive { get; set; }
    }
}
