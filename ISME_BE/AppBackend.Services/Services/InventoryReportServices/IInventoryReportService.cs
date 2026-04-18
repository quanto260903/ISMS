using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.InventoryReportServices
{
    public interface IInventoryReportService
    {
        Task<ResultModel<InventorySummaryDto>> GetSummaryAsync(GetInventorySummaryRequest request);
    }
}
