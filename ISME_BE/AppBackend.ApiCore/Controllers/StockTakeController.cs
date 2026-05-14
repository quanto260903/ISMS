using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.Services.StockTakeServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [ApiController]
    [Route("api/stock-take-vouchers")]
    public class StockTakeController : ControllerBase
    {
        private readonly IStockTakeService _service;

        public StockTakeController(IStockTakeService service)
        {
            _service = service;
        }

        private string CurrentUser =>
            User.FindFirstValue("userId") ?? User.FindFirstValue("username") ?? "SYSTEM";

        // GET /api/stock-take-vouchers/preview-code
        [HttpGet("preview-code")]
        public async Task<IActionResult> PreviewCode()
        {
            var id = await _service.PreviewNextVoucherCodeAsync();
            return Ok(new { voucherId = id });
        }

        // GET /api/stock-take-vouchers/goods-stock?asOfDate=YYYY-MM-DD
        [HttpGet("goods-stock")]
        public async Task<IActionResult> GetGoodsStock([FromQuery] DateOnly asOfDate)
        {
            var result = await _service.GetGoodsStockAsOfDateAsync(asOfDate);
            return Ok(result);
        }

        // GET /api/stock-take-vouchers
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        // GET /api/stock-take-vouchers/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy phiếu kiểm kê với id: {id}" });
            return Ok(result);
        }

        // POST /api/stock-take-vouchers
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStockTakeVoucherDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdBy = User.FindFirstValue(ClaimTypes.Name) ?? dto.CreatedBy ?? "system";
            var result = await _service.CreateAsync(dto, createdBy);
            return CreatedAtAction(nameof(GetById), new { id = result.StockTakeVoucherId }, result);
        }

        // PUT /api/stock-take-vouchers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateStockTakeVoucherDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _service.UpdateAsync(id, dto);
                if (result == null)
                    return NotFound(new { message = $"Không tìm thấy phiếu kiểm kê với id: {id}" });
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // DELETE /api/stock-take-vouchers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var success = await _service.DeleteAsync(id);
                if (!success)
                    return NotFound(new { message = $"Không tìm thấy phiếu kiểm kê với id: {id}" });
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // POST /api/stock-take-vouchers/{id}/process
        // Đánh dấu hoàn thành thủ công (fallback)
        [HttpPost("{id}/process")]
        public async Task<IActionResult> Process(string id)
        {
            var result = await _service.ProcessAsync(id, CurrentUser);
            return result.Success
                ? Ok(new { isSuccess = true, data = result, message = result.Message })
                : BadRequest(new { isSuccess = false, message = result.Message });
        }

        // PATCH /api/stock-take-vouchers/{id}/mark-nk3-created
        // Gọi khi người dùng nhấn nút "Lập phiếu nhập NK3" — đánh dấu đã lập và
        // tự động set IsCompleted = true nếu không cần XK3 hoặc XK3 đã được lập rồi.
        [HttpPatch("{id}/mark-nk3-created")]
        public async Task<IActionResult> MarkNk3Created(string id)
        {
            var result = await _service.MarkNk3CreatedAsync(id);
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy phiếu kiểm kê với id: {id}" });
            return Ok(result);
        }

        // PATCH /api/stock-take-vouchers/{id}/mark-xk3-created
        // Gọi khi người dùng nhấn nút "Lập phiếu xuất XK3" — đánh dấu đã lập và
        // tự động set IsCompleted = true nếu không cần NK3 hoặc NK3 đã được lập rồi.
        [HttpPatch("{id}/mark-xk3-created")]
        public async Task<IActionResult> MarkXk3Created(string id)
        {
            var result = await _service.MarkXk3CreatedAsync(id);
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy phiếu kiểm kê với id: {id}" });
            return Ok(result);
        }

        // GET /api/stock-take-vouchers/{id}/surplus-items
        [HttpGet("{id}/surplus-items")]
        public async Task<IActionResult> GetSurplusItems(string id)
        {
            var items = await _service.GetSurplusItemsAsync(id);
            return Ok(items);
        }

        // GET /api/stock-take-vouchers/{id}/shortage-items
        [HttpGet("{id}/shortage-items")]
        public async Task<IActionResult> GetShortageItems(string id)
        {
            var items = await _service.GetShortageItemsAsync(id);
            return Ok(items);
        }
    }
}