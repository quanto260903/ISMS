using AppBackend.Attributes;
using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services;
using AppBackend.Services.ApiModels;
using AppBackend.Services.Services.UserServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppBackend.Api.Controllers
{
    /// <summary>
    /// APIs for managing users (Register, Login, Query Users)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }
        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<ActionResult<ResultModel<UserDto>>> GetUserById(int userId)
        {
            var result = await _userService.GetUserByIdAsync(userId);
            if (!result.IsSuccess)
                return NotFound(result.Message);

            return Ok(result);
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ResultModel<UserDto>>> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateUserAsync(request);
            if (!result.IsSuccess)
                return BadRequest(result.Message);

            return CreatedAtAction(nameof(GetUserById), new { userId = result.Data.UserId }, result); // Trả về 201 Created
        }

        /// <summary>
        /// Update user
        /// </summary>
        [HttpPut("{userId}")]
        public async Task<ActionResult<ResultModel<UserDto>>> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
        {
            var result = await _userService.UpdateUserAsync(userId, request);
            if (!result.IsSuccess)
                return NotFound(result.Message);

            return Ok(result);
        }

        /// <summary>
        /// Delete user
        /// </summary>
        [HttpDelete("{userId}")]
        public async Task<ActionResult<ResultModel>> DeleteUser(int userId)
        {
            var result = await _userService.DeleteUserAsync(userId);
            if (!result.IsSuccess)
                return NotFound(result.Message);

            return NoContent(); // Trả về 204 No Content
        }

        /// <summary>
        /// Get all users
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ResultModel<List<UserDto>>>> GetAllUsers()
        {
            var result = await _userService.GetAllUsersAsync();
            return Ok(result);
        }
    }
}