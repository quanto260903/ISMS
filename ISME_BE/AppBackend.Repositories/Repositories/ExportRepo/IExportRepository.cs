// ============================================================
//  IExportRepository.cs
// ============================================================
using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;

namespace AppBackend.Repositories.Repositories.ExportRepo
{
    public interface IExportRepository
    {
        Task AddAsync(Voucher voucher);
        Task UpdateAsync(Voucher voucher);
        Task<Voucher?> GetByIdAsync(string voucherId);
        Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(GetExportListRequest request);

        Task<int> GetCurrentStockAsync(string goodsId);

        // FIFO nâng cấp: trả về danh sách phân bổ (phiếu nhập → số lượng)
        // thay vì chỉ 1 phiếu nhập đơn lẻ
        Task<List<FifoAllocation>> GetFifoAllocationsAsync(string goodsId, int requiredQty);

        /// <summary>
        /// Trả về số lượng còn tồn của một mặt hàng trong phiếu nhập cụ thể.
        /// inboundVoucherId: VoucherId của phiếu nhập (= giá trị lưu trong OffsetVoucher của phiếu xuất).
        /// excludeVoucherId: bỏ qua phiếu xuất này khi tính "đã xuất" (dùng khi Update).
        /// </summary>
        Task<int> GetRemainingQtyForInboundAsync(
            string goodsId, string inboundVoucherId, string? excludeVoucherId = null);

        Task AddStockAsync(string goodsId, int quantity);    // hoàn tồn kho khi hủy/sửa
        Task DeductStockAsync(string goodsId, int quantity); // trừ tồn kho khi xuất
        Task<string> GenerateVoucherIdAsync();
    }

    // Kết quả phân bổ FIFO cho 1 dòng hàng
    public class FifoAllocation
    {
        public string InboundVoucherCode { get; set; } = null!; // phiếu nhập đối trừ
        public int AllocatedQty { get; set; }          // số lượng lấy từ phiếu này
        public string? WarehouseId { get; set; }          // kho của phiếu nhập
    }
}