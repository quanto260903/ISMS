using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.Services.OpenInventoryServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OpenInventoryController : ControllerBase
    {
        private readonly IOpenInventoryService _svc;
        public OpenInventoryController(IOpenInventoryService svc) => _svc = svc;

        private bool IsAdminOrManager
        {
            get
            {
                var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
                return role is "1" or "2";
            }
        }
        private IActionResult? Guard() => IsAdminOrManager ? null : StatusCode(403,
            new { isSuccess = false, message = "Chỉ Admin hoặc Manager mới có quyền thực hiện" });

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] GetOpenInventoryListRequest req)
            => StatusCode((await _svc.GetListAsync(req)).StatusCode, await _svc.GetListAsync(req));

        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            var r = await _svc.GetSummaryAsync();
            return StatusCode(r.StatusCode, r);
        }

        [HttpPut("upsert")]
        public async Task<IActionResult> Upsert([FromBody] UpsertOpenInventoryRequest req)
        {
            var deny = Guard(); if (deny != null) return deny;
            var r = await _svc.UpsertAsync(req);
            return StatusCode(r.StatusCode, r);
        }

        [HttpDelete("{goodsId}")]
        public async Task<IActionResult> Delete(string goodsId)
        {
            var deny = Guard(); if (deny != null) return deny;
            var r = await _svc.DeleteAsync(goodsId);
            return StatusCode(r.StatusCode, r);
        }
    }
}
