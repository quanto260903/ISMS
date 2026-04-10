using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.DashboardServices;

public interface IDashboardService
{
    Task<ResultModel<DashboardOverviewDto>> GetOverviewAsync();
    Task<ResultModel<List<TrendAnalysisDto>>> GetTrendAnalysisAsync(DateOnly startDate, DateOnly endDate);
    Task<ResultModel<List<PeriodComparisonDto>>> GetPeriodComparisonAsync(string periodType, int count);
    Task<ResultModel<List<ValueVsQuantityDto>>> GetValueVsQuantityAsync();
    Task<ResultModel<List<Top10StructureDto>>> GetTop10StructureAsync();
    Task<ResultModel<List<WarehouseBalanceDto>>> GetWarehouseBalanceAsync();
    Task<ResultModel<List<MinimumStockAlertDto>>> GetMinimumStockAlertsAsync();
    Task<ResultModel<List<ExpiryAnalysisDto>>> GetExpiryAnalysisAsync(int daysThreshold);
    Task<ResultModel<List<DeadStockDto>>> GetDeadStockReportAsync();
}
