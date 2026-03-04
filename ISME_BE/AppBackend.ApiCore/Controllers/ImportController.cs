using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.ImportServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly IImportServices _importService;

        public ImportController(IImportServices importService)
        {
            _importService = importService;
        }
        /// <summary>
        /// Thêm mới phiếu nhập kho
        /// </summary>
        [HttpPost("add-inward")]
        public async Task<IActionResult> AddInward([FromBody] ImportOrder request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ResultModel<int>
                {
                    IsSuccess = false,
                    ResponseCode = "INVALID_MODEL",
                    StatusCode = 400,
                    Data = 0,
                    Message = "Dữ liệu không hợp lệ"
                });

            string userId = User?.Identity?.Name ?? "SYSTEM";
            var result = await _importService.CreateInwardAsync(request, userId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
