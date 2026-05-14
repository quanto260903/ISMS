using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.Services.DataLockServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppBackend.ApiCore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DataLocksController : ControllerBase
    {
        private readonly IDataLockService _service;

        public DataLocksController(IDataLockService service)
        {
            _service = service;
        }

        // Thử nhiều claim key để đọc được userId
        private string CurrentUserId
        {
            get
            {
                var userId =
                    User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                    User.FindFirstValue("sub") ??
                    User.FindFirstValue("userId") ??
                    User.FindFirstValue("UserId") ??
                    User.FindFirstValue("nameid") ??
                    User.Identity?.Name;

                if (string.IsNullOrEmpty(userId))
                {
                    var allClaims = string.Join(", ",
                        User.Claims.Select(c => $"{c.Type}={c.Value}"));
                    throw new UnauthorizedAccessException(
                        $"Không tìm thấy UserId trong token. Claims: [{allClaims}]");
                }

                return userId;
            }
        }

        // GET /api/DataLocks/{module}
        [HttpGet("{module}")]
        public async Task<IActionResult> GetCurrentLock(string module)
        {
            var result = await _service.GetCurrentLockAsync(module.ToUpper());
            if (result == null)
                return Ok(new { isLocked = false, data = (object?)null });
            return Ok(new { isLocked = true, data = result });
        }

        // POST /api/DataLocks/{module}/lock
        [HttpPost("{module}/lock")]
        public async Task<IActionResult> LockData(string module, [FromBody] LockDataRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var result = await _service.LockAsync(module.ToUpper(), request, CurrentUserId);
                return CreatedAtAction(nameof(GetCurrentLock), new { module }, result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // POST /api/DataLocks/{module}/unlock
        [HttpPost("{module}/unlock")]
        public async Task<IActionResult> UnlockData(string module)
        {
            try
            {
                var result = await _service.UnlockAsync(module.ToUpper(), CurrentUserId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}