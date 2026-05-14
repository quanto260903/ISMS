using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.ActivityLogServices
{
    public static class ActivityModule
    {
        public const string Import    = "NHAP_KHO";
        public const string Export    = "XUAT_KHO";
        public const string Sale      = "BAN_HANG";
        public const string User      = "NGUOI_DUNG";
        public const string StockTake = "KIEM_KE";
    }

    public interface IActivityLogService
    {
        // Ghi log — không ném exception, chỉ log lỗi nội bộ
        Task LogAsync(string? userId, string action, string description, string module);

        Task<ResultModel<ActivityLogListResult>> GetListAsync(
            string? module, DateTime? fromDate, DateTime? toDate,
            string? keyword, int page, int pageSize);
    }
}
