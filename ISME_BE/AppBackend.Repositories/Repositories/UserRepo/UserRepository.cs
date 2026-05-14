using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.Repositories.Repositories.UserRepo
{
    public class UserRepository : IUserRepository
    {
        private readonly IndividualBusinessContext _context;

        public UserRepository(IndividualBusinessContext context)
            => _context = context;

        // ── Danh sách user ────────────────────────────────────
        public async Task<(IEnumerable<User> Items, int Total)> GetListAsync(
            GetUserListRequest request)
        {
            // ✅ Include UserRoles để MapToList dùng được u.UserRoles
            var query = _context.Users
                .Include(u => u.UserRoles)
                // ✅ Lọc bỏ Admin: kiểm tra trong bảng UserRoles thay vì u.RoleId
                .Where(u => !u.UserRoles.Any(r => r.RoleId == RoleConstants.Admin))
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(u =>
                    u.FullName!.ToLower().Contains(kw) ||
                    u.Email!.ToLower().Contains(kw) ||
                    u.UserId.ToLower().Contains(kw));
            }

            // ✅ Lọc theo role: kiểm tra trong UserRoles thay vì u.RoleId
            if (request.RoleId.HasValue)
                query = query.Where(u =>
                    u.UserRoles.Any(r => r.RoleId == request.RoleId.Value));

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

        // ── Chi tiết 1 user ───────────────────────────────────
        public async Task<User?> GetByIdAsync(string userId)
            // ✅ Include UserRoles để service dùng được u.UserRoles
            => await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.UserId == userId);

        // ── Tìm theo email ────────────────────────────────────
        public async Task<User?> GetByEmailAsync(string email)
            => await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Email == email.Trim().ToLower());

        // ── Thêm user mới ─────────────────────────────────────
        public async Task AddAsync(User user)
            => await _context.Users.AddAsync(user);

        // ✅ Xóa toàn bộ UserRoles của 1 user (dùng trước khi gán roles mới)
        // Không gọi SaveChanges ở đây — để service gọi sau cùng 1 lần
        public async Task RemoveUserRolesAsync(string userId)
        {
            var roles = await _context.UserRoles
                .Where(r => r.UserId == userId)
                .ToListAsync();

            _context.UserRoles.RemoveRange(roles);
        }

        // ── Lưu thay đổi ─────────────────────────────────────
        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();
    }
}