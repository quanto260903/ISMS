using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.Repositories.Repositories.UserRepo
{
    public class UserRepository : IUserRepository
    {
        private readonly IndividualBusinessContext _context;
        public UserRepository(IndividualBusinessContext context)
            => _context = context;

        public async Task<(IEnumerable<User> Items, int Total)> GetListAsync(
            GetUserListRequest request)
        {
            var query = _context.Users
                .Where(u => u.RoleId != RoleConstants.Admin)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(u =>
                    u.FullName!.ToLower().Contains(kw) ||
                    u.Email!.ToLower().Contains(kw) ||
                    u.UserId.ToLower().Contains(kw));
            }

            if (request.RoleId.HasValue)
                query = query.Where(u => u.RoleId == request.RoleId.Value);

            if (request.IsActive.HasValue)
                query = query.Where(u => u.IsActive == request.IsActive.Value);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(u => u.IsActive)
                .ThenBy(u => u.FullName)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<User?> GetByIdAsync(string userId)
            => await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        public async Task<User?> GetByEmailAsync(string email)
            => await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email.Trim().ToLower());

        public async Task AddAsync(User user)
            => await _context.Users.AddAsync(user);

        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}
