using AppBackend.BusinessObjects.Dtos;
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

        /// <summary>
        /// Tra cứu phiếu bán theo số phiếu
        /// GET /api/SaleGoods/voucher/{voucherId}
        /// </summary>
        [HttpGet("voucher/{voucherId}")]
        public async Task<IActionResult> GetByVoucherId(string voucherId)
        {
            if (string.IsNullOrWhiteSpace(voucherId))
                return BadRequest(new ResultModel<object>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_ID",
                    StatusCode = 400,
                    Data = null,
                    Message = "Số phiếu không được để trống"
                });

            var result = await _saleService.GetByVoucherIdAsync(voucherId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Tìm kiếm phiếu bán theo từ khóa (dùng cho dropdown gợi ý)
        /// GET /api/SaleGoods/search?keyword=BH&amp;limit=10
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string keyword = "",
            [FromQuery] int limit = 10)
        {
            var result = await _saleService.SearchSaleVouchersAsync(keyword, limit);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Kiểm tra phiếu bán đã được nhập kho trả lại (NK2) chưa
        /// GET /api/SaleGoods/check-return/{saleVoucherId}
        /// </summary>
        [HttpGet("check-return/{saleVoucherId}")]
        public async Task<IActionResult> CheckReturn(string saleVoucherId)
        {
            var isUsed = await _saleService.CheckSaleUsedForReturnAsync(saleVoucherId);
            return Ok(new { isUsed });
        }
    }
}
