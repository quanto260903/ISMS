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

        // GET /api/stock-take-vouchers/preview-code
        // Xem trước mã phiếu KK sẽ được sinh khi tạo mới (không tạo phiếu)
        [HttpGet("preview-code")]
        public async Task<IActionResult> PreviewCode()
        {
            var id = await _service.PreviewNextVoucherCodeAsync();
            return Ok(new { voucherId = id });
        }

        // GET /api/stock-take-vouchers/goods-stock?asOfDate=YYYY-MM-DD
        // Lấy danh sách hàng hóa với tồn kho tính đến ngày asOfDate
        [HttpGet("goods-stock")]
        public async Task<IActionResult> GetGoodsStock([FromQuery] DateOnly asOfDate)
        {
            var result = await _service.GetGoodsStockAsOfDateAsync(asOfDate);
            return Ok(result);
        }

        // GET /api/stock-take-vouchers
        // Lấy danh sách tất cả phiếu kiểm kê
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        // GET /api/stock-take-vouchers/{id}
        // Lấy chi tiết 1 phiếu kiểm kê
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy phiếu kiểm kê với id: {id}" });
            return Ok(result);
        }

        // POST /api/stock-take-vouchers
        // Tạo mới phiếu kiểm kê
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStockTakeVoucherDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lấy user hiện tại từ claim, hoặc dùng giá trị mặc định
            var createdBy = User.FindFirstValue(ClaimTypes.Name) ?? dto.CreatedBy ?? "system";

            var result = await _service.CreateAsync(dto, createdBy);
            return CreatedAtAction(nameof(GetById), new { id = result.StockTakeVoucherId }, result);
        }

        // PUT /api/stock-take-vouchers/{id}
        // Cập nhật phiếu kiểm kê (chỉ khi chưa xử lý)
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
        // Xóa phiếu kiểm kê (chỉ khi chưa xử lý)
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
        private string CurrentUser =>
           User.FindFirstValue("userId") ?? User.FindFirstValue("username") ?? "SYSTEM";

        /// POST /api/StockTake/{id}/process — Xử lý: tạo phiếu nhập/xuất kho
        [HttpPost("{id}/process")]
        public async Task<IActionResult> Process(string id)
        {
            var result = await _service.ProcessAsync(id, CurrentUser);
            return result.Success
                ? Ok(new { isSuccess = true, data = result, message = result.Message })
                : BadRequest(new { isSuccess = false, message = result.Message });
        }
    }

}
