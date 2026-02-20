
using AppBackend.Services.Services.ItemServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
    {
        private readonly IItemService _itemService;

        public ItemsController(IItemService itemService)
        {
            _itemService = itemService;
        }

        [HttpGet("warehouse-report/{goodsId}")]
        public async Task<IActionResult> GetWarehouseReport(string goodsId)
        {
            var result = await _itemService
                .GetItemWarehouseReportAsync(goodsId);

            return StatusCode(result.StatusCode, result);
        }
        [HttpGet("search")]
        public async Task<IActionResult> Search(
        [FromQuery] string keyword,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
        {
            var result = await _itemService.SearchGoodsAsync(
                keyword,
                limit,
                cancellationToken);

            return Ok(result);
        }
    }
}
