using AppBackend.BusinessObjects.Dtos;
using AppBackend.Repositories.Repositories.GoodsRepo;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.InventoryReportServices
{
    public class InventoryReportService : IInventoryReportService
    {
        private readonly IGoodsRepository _goodsRepo;

        public InventoryReportService(IGoodsRepository goodsRepo)
            => _goodsRepo = goodsRepo;

        public async Task<ResultModel<InventorySummaryDto>> GetSummaryAsync(GetInventorySummaryRequest request)
        {
            try
            {
                if (request.FromDate > request.ToDate)
                    return new ResultModel<InventorySummaryDto>
                    {
                        IsSuccess  = false,
                        StatusCode = 400,
                        Message    = "Ngày bắt đầu không được lớn hơn ngày kết thúc",
                    };

                var data = await _goodsRepo.GetInventorySummaryAsync(
                    request.FromDate, request.ToDate, request.Keyword);

                return new ResultModel<InventorySummaryDto>
                {
                    IsSuccess  = true,
                    StatusCode = 200,
                    Data       = data,
                    Message    = "Tạo báo cáo tổng hợp tồn kho thành công",
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<InventorySummaryDto>
                {
                    IsSuccess  = false,
                    StatusCode = 500,
                    Message    = ex.Message,
                };
            }
        }
    }
}
