using AppBackend.BusinessObjects.Dtos.PayOs;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.GoodsServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SaleGoodsController : ControllerBase
    {
        private readonly ISaleGoodsService _saleService;

        public SaleGoodsController(ISaleGoodsService saleService)
        {
            _saleService = saleService;
        }

        [HttpPost("add-sale-goods")]
        public async Task<IActionResult> AddSaleGoods([FromBody] CreateSaleRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Invalid request data"
                });
            }

            // 🔥 Lấy userId từ token nếu có authentication
            string userId = User?.Identity?.Name ?? "SYSTEM";

            var result = await _saleService.CreateSaleAsync(request, userId);

            return StatusCode(result.StatusCode, result);
        }
    }
}
