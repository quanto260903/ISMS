using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    // ── Dòng chi tiết ────────────────────────────────────────
    public class StockTakeVoucherListDto
    {
        public string StockTakeVoucherId { get; set; }
        public string VoucherCode { get; set; }
        public DateTime VoucherDate { get; set; }
        public DateTime StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public bool? IsCompleted { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    // DTO chi tiết phiếu kiểm kê
    public class StockTakeVoucherDetailDto
    {
        public string StockTakeVoucherId { get; set; }
        public string VoucherCode { get; set; }
        public DateTime VoucherDate { get; set; }
        public DateTime StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public string? Member1 { get; set; }
        public string? Position1 { get; set; }
        public string? Member2 { get; set; }
        public string? Position2 { get; set; }
        public string? Member3 { get; set; }
        public string? Position3 { get; set; }
        public bool? IsCompleted { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public List<StockTakeDetailDto> StockTakeDetails { get; set; } = new();
    }

    // DTO tạo mới phiếu kiểm kê
    public class CreateStockTakeVoucherDto
    {
        public DateTime VoucherDate { get; set; }
        public DateTime StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public string? Member1 { get; set; }
        public string? Position1 { get; set; }
        public string? Member2 { get; set; }
        public string? Position2 { get; set; }
        public string? Member3 { get; set; }
        public string? Position3 { get; set; }
        public string? CreatedBy { get; set; }
        public List<CreateStockTakeDetailDto> StockTakeDetails { get; set; } = new();
    }

    // DTO cập nhật phiếu kiểm kê
    public class UpdateStockTakeVoucherDto
    {
        public DateTime VoucherDate { get; set; }
        public DateTime StockTakeDate { get; set; }
        public string? Purpose { get; set; }
        public string? Member1 { get; set; }
        public string? Position1 { get; set; }
        public string? Member2 { get; set; }
        public string? Position2 { get; set; }
        public string? Member3 { get; set; }
        public string? Position3 { get; set; }
        public List<CreateStockTakeDetailDto> StockTakeDetails { get; set; } = new();
    }

    // DTO chi tiết hàng hóa trong phiếu
    public class StockTakeDetailDto
    {
        public int StockTakeDetailId { get; set; }
        public string GoodsId { get; set; }
        public string GoodsName { get; set; }
        public string? Unit { get; set; }
        public decimal BookQuantity { get; set; }
        public decimal ActualQuantity { get; set; }
        public decimal DifferenceQuantity { get; set; }
    }

    // DTO tạo mới dòng hàng hóa
    public class CreateStockTakeDetailDto
    {
        public string GoodsId { get; set; }
        public string GoodsName { get; set; }
        public string? Unit { get; set; }
        public decimal BookQuantity { get; set; }
        public decimal ActualQuantity { get; set; }
    }

    // Response sau khi xử lý phiếu kiểm kê
    public class ProcessStockTakeResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string? ImportVoucherId { get; set; }   // Phiếu nhập nếu thừa
        public string? ExportVoucherId { get; set; }   // Phiếu xuất nếu thiếu
    }
}
