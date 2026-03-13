

using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.UserServices
{
    public interface IUserService
    {
        Task<ResultModel<PagedResult<UserListDto>>> GetListAsync(GetUserListRequest request);
        Task<ResultModel<UserDetailDto>> GetByIdAsync(string userId);
        Task<ResultModel<UserDetailDto>> CreateUserAsync(CreateUserRequest request, string adminId);
        Task<ResultModel<UserDetailDto>> UpdateUserAsync(string userId, UpdateUserRequest request, string adminId);
        Task<ResultModel<int>> UpdateRoleAsync(string userId, UpdateRoleRequest request, string adminId);
        Task<ResultModel<int>> ResetPasswordAsync(string userId, ResetPasswordRequest request, string adminId);
        Task<ResultModel<int>> UpdateStatusAsync(string userId, UpdateStatusRequest request, string adminId);
    }
}
