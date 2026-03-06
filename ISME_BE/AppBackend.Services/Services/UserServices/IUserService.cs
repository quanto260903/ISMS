

using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.UserServices
{
    public interface IUserService
    {
        Task<ResultModel<UserDto>> GetUserByIdAsync(int userId);
        Task<ResultModel<UserDto>> CreateUserAsync(CreateUserRequest request);
        Task<ResultModel<UserDto>> UpdateUserAsync(int userId, UpdateUserRequest request);
        Task<ResultModel> DeleteUserAsync(int userId);
        Task<ResultModel<List<UserDto>>> GetAllUsersAsync();
    }
}
