using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.GoodsServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GoodsController : ControllerBase
    {
        private readonly IGoodsService _service;
        public GoodsController(IGoodsService service) => _service = service;

        private bool IsAdminOrManager
        {
            get
            {
                var role = User.FindFirstValue(ClaimTypes.Role)
                        ?? User.FindFirstValue("role");
                return role is "1" or "2";
            }
        }

        private IActionResult? RequireAdminOrManager()
        {
            if (!IsAdminOrManager)
                return StatusCode(403, new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "FORBIDDEN",
                    StatusCode = 403,
                    Data = 0,
                    Message = "Chỉ Admin hoặc Manager mới có quyền thực hiện thao tác này",
                });
            return null;
        }

        /// GET /api/Goods/list
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetGoodsListRequest request)
        {
            var result = await _service.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Goods/search?keyword=abc&limit=10
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string keyword = "",
            [FromQuery] int limit = 10)
        {
            var result = await _service.SearchAsync(keyword, limit);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/Goods/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/Goods/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateGoodsRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.CreateAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Goods/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateGoodsRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.UpdateAsync(id, request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/Goods/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateGoodsStatusRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.UpdateStatusAsync(id, request.IsInactive);
            return StatusCode(result.StatusCode, result);
        }

        /// DELETE /api/Goods/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;
            var result = await _service.DeleteAsync(id);
            return StatusCode(result.StatusCode, result);
        }
    }

    // Request nhỏ cho status
    public class UpdateGoodsStatusRequest
    {
        public bool IsInactive { get; set; }
    }
}
