using AppBackend.BusinessObjects.Dtos;

namespace AppBackend.Repositories.Repositories.ActivityLogRepo
{
    public interface IActivityLogRepository
    {
        Task WriteAsync(string? userId, string action, string description, string module);
        Task<ActivityLogListResult> GetPagedAsync(
            string? module, DateTime? fromDate, DateTime? toDate,
            string? keyword, int page, int pageSize);
    }
}
