using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.Services.SupplierServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierService _service;
        public SupplierController(ISupplierService service) => _service = service;

        /// GET /api/Supplier/search?keyword=abc&limit=10
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string keyword,
            [FromQuery] int limit = 10)
        {
            var result = await _service.SearchAsync(keyword, limit);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/Supplier/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request)
        {
            var result = await _service.CreateAsync(request);
            return StatusCode(result.StatusCode, result);
        }
    }
}
