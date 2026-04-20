using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.Repositories.Repositories.ActivityLogRepo
{
    public class ActivityLogRepository : IActivityLogRepository
    {
        private readonly IndividualBusinessContext _context;

        public ActivityLogRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task WriteAsync(string? userId, string action, string description, string module)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId      = userId,
                Action      = action,
                Description = description,
                Module      = module,
                CreatedAt   = DateTime.Now,
            });
            await _context.SaveChangesAsync();
        }

        public async Task<ActivityLogListResult> GetPagedAsync(
            string? module, DateTime? fromDate, DateTime? toDate,
            string? keyword, int page, int pageSize)
        {
            var query = _context.ActivityLogs
                .Include(a => a.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(module))
                query = query.Where(a => a.Module == module);

            if (fromDate.HasValue)
                query = query.Where(a => a.CreatedAt >= fromDate.Value);

            if (toDate.HasValue)
            {
                var toEnd = toDate.Value.Date.AddDays(1); // bao gồm cả cuối ngày
                query = query.Where(a => a.CreatedAt < toEnd);
            }

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(a =>
                    (a.Description != null && a.Description.ToLower().Contains(kw)) ||
                    (a.Action      != null && a.Action.ToLower().Contains(kw))      ||
                    (a.UserId      != null && a.UserId.ToLower().Contains(kw))      ||
                    (a.User != null && a.User.FullName != null &&
                     a.User.FullName.ToLower().Contains(kw)));
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new ActivityLogDto
                {
                    Id           = a.Id,
                    UserId       = a.UserId,
                    UserFullName = a.User != null ? a.User.FullName : null,
                    Action       = a.Action,
                    Description  = a.Description,
                    Module       = a.Module,
                    CreatedAt    = a.CreatedAt,
                })
                .ToListAsync();

            return new ActivityLogListResult
            {
                Items    = items,
                Total    = total,
                Page     = page,
                PageSize = pageSize,
            };
        }
    }
}
