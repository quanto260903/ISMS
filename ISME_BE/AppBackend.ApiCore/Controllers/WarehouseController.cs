using AppBackend.Services.Services.WarehouseServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehouseController : ControllerBase
    {
        private readonly IWarehouseService _warehouseService;

        public WarehouseController(IWarehouseService warehouseService)
        {
            _warehouseService = warehouseService;
        }

        /// <summary>
        /// Lấy danh sách kho đang hoạt động (IsInactive = false)
        /// GET /api/Warehouse/list
        /// </summary>
        [HttpGet("list")]
        public async Task<IActionResult> GetList()
        {
            var result = await _warehouseService.GetAllActiveAsync();
            return StatusCode(result.StatusCode, result);
        }
    }
}

