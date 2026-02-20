using AppBackend.BusinessObjects.Dtos;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.ItemServices
{
    public class ItemService : IItemService
    {
        private readonly IItemRepository _itemRepository;

        public ItemService(IItemRepository itemRepository)
        {
            _itemRepository = itemRepository;
        }

        public async Task<ResultModel<List<WarehouseTransactionDto>>>
            GetItemWarehouseReportAsync(string goodsId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(goodsId))
                {
                    return new ResultModel<List<WarehouseTransactionDto>>
                    {
                        IsSuccess = false,
                        ResponseCode = "INVALID_GOODSID",
                        StatusCode = 400,
                        Data = null,
                        Message = "GoodsId is required"
                    };
                }

                var data = await _itemRepository
                    .GetWarehouseTransactionsAsync(goodsId);

                if (data == null || !data.Any())
                {
                    return new ResultModel<List<WarehouseTransactionDto>>
                    {
                        IsSuccess = false,
                        ResponseCode = "NOT_FOUND",
                        StatusCode = 404,
                        Data = new List<WarehouseTransactionDto>(),
                        Message = "No transactions found for this item"
                    };
                }

                return new ResultModel<List<WarehouseTransactionDto>>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 200,
                    Data = data,
                    Message = "Warehouse report retrieved successfully"
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
                keyword,
                limit,
                cancellationToken);
        }
    }

}
