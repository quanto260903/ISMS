using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ItemRepo
{
    public interface IItemRepository
    {
        Task<Good> GetByIdAsync(string itemId);
        Task<List<WarehouseTransactionDto>> GetWarehouseTransactionsAsync(string goodsId);

        /// <summary>
        /// Tìm kiếm sản phẩm theo GoodsId có chứa chuỗi keyword.
        /// Chỉ trả về sản phẩm đang hoạt động (IsActive = true).
        /// Giới hạn tối đa <paramref name="limit"/> kết quả cho dropdown.
        /// </summary>
        Task<IEnumerable<GoodsSearchDto>> SearchByIdAsync(
            string keyword,
            int limit = 10,
            CancellationToken cancellationToken = default);
    }

}

