using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;

namespace AppBackend.Repositories.Repositories.UserRepo
{
    public interface IUserRepository
    {
        Task<(IEnumerable<User> Items, int Total)> GetListAsync(GetUserListRequest request);
        Task<User?> GetByIdAsync(string userId);
        Task<User?> GetByEmailAsync(string email);
        Task AddAsync(User user);
        Task<int> SaveChangesAsync();
    }
}
