using AppBackend.BusinessObjects.Dtos;
using AppBackend.Repositories.Repositories.ActivityLogRepo;
using AppBackend.Services.ApiModels;
using Microsoft.Extensions.Logging;

namespace AppBackend.Services.Services.ActivityLogServices
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly IActivityLogRepository _repo;
        private readonly ILogger<ActivityLogService> _logger;

        public ActivityLogService(IActivityLogRepository repo, ILogger<ActivityLogService> logger)
        {
            _repo   = repo;
            _logger = logger;
        }

        // Không ném exception — logging thất bại không được ảnh hưởng nghiệp vụ chính
        public async Task LogAsync(string? userId, string action, string description, string module)
        {
            try
            {
                await _repo.WriteAsync(userId, action, description, module);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ActivityLog write failed: module={Module} action={Action}", module, action);
            }
        }

        public async Task<ResultModel<ActivityLogListResult>> GetListAsync(
            string? module, DateTime? fromDate, DateTime? toDate,
            string? keyword, int page, int pageSize)
        {
            try
            {
                var result = await _repo.GetPagedAsync(module, fromDate, toDate, keyword, page, pageSize);
                return new ResultModel<ActivityLogListResult>
                {
                    IsSuccess    = true,
                    ResponseCode = "SUCCESS",
                    StatusCode   = 200,
                    Data         = result,
                    Message      = "OK",
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<ActivityLogListResult>
                {
                    IsSuccess    = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode   = 500,
                    Data         = null,
                    Message      = ex.Message,
                };
            }
        }
    }
}
