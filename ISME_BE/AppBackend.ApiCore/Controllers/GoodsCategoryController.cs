using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.GoodsCategoryServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GoodsCategoryController : ControllerBase
    {
        private readonly IGoodsCategoryService _service;
        public GoodsCategoryController(IGoodsCategoryService service)
            => _service = service;

        private bool IsAdminOrManager =>
            User.FindFirstValue(ClaimTypes.Role) is "1" or "2";

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

        /// GET /api/GoodsCategory/list
        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetGoodsCategoryListRequest request)
        {
            var result = await _service.GetListAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// GET /api/GoodsCategory/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _service.GetByIdAsync(id);
            return StatusCode(result.StatusCode, result);
        }

        /// POST /api/GoodsCategory/create
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateGoodsCategoryRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;

            var result = await _service.CreateAsync(request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/GoodsCategory/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id, [FromBody] UpdateGoodsCategoryRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;

            var result = await _service.UpdateAsync(id, request);
            return StatusCode(result.StatusCode, result);
        }

        /// PUT /api/GoodsCategory/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            string id, [FromBody] UpdateGoodsCategoryStatusRequest request)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;

            var result = await _service.UpdateStatusAsync(id, request);
            return StatusCode(result.StatusCode, result);
        }

        /// DELETE /api/GoodsCategory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deny = RequireAdminOrManager();
            if (deny != null) return deny;

            var result = await _service.DeleteAsync(id);
            return StatusCode(result.StatusCode, result);
        }
    }
}
