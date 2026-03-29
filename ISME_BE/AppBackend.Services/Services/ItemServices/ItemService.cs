using AppBackend.BusinessObjects.Dtos;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Services.ApiModels;

namespace AppBackend.Services.Services.ItemServices
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _itemRepository;

        public ItemService(IItemRepository itemRepository)
        {
            _itemRepository = itemRepository;
        }

        // Thêm asOfDate? — null = không giới hạn ngày (dùng cho báo cáo tổng quát)
        // Có ngày = lọc phiếu nhập hợp lệ tại thời điểm tạo phiếu xuất
        public async Task<ResultModel<List<WarehouseTransactionDto>>>
            GetItemWarehouseReportAsync(string goodsId, DateOnly? asOfDate = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(goodsId))
                    return new ResultModel<List<WarehouseTransactionDto>>
                    {
                        IsSuccess = false,
                        ResponseCode = "INVALID_GOODSID",
                        StatusCode = 400,
                        Data = null,
                        Message = "GoodsId is required"
                    };

                var data = await _itemRepository
                    .GetWarehouseTransactionsAsync(goodsId, asOfDate);

                // Trả về list rỗng thay vì 404 để frontend hiển thị
                // "Không còn tồn kho" thay vì xử lý lỗi
                return new ResultModel<List<WarehouseTransactionDto>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = data ?? new List<WarehouseTransactionDto>(),
                    Message = data == null || !data.Any()
                        ? "No transactions found for this item"
                        : "Warehouse report retrieved successfully"
                };
            }
            catch (Exception ex)
            {
                return new ResultModel<List<WarehouseTransactionDto>>
                {
                    IsSuccess = false,
                    ResponseCode = "EXCEPTION",
                    StatusCode = 500,
                    Data = null,
                    Message = ex.Message
                };
            }
        }

        public async Task<IEnumerable<GoodsSearchDto>> SearchGoodsAsync(
            string keyword,
            int limit = 10,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return new List<GoodsSearchDto>();

            return await _itemRepository.SearchByIdAsync(
                keyword, limit, cancellationToken);
        }
    }
}