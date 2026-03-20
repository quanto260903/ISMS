using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class ExportOrder
    {
        public string VoucherId { get; set; } = null!;
        public string? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? TaxCode { get; set; }
        public string? Address { get; set; }
        public string? VoucherDescription { get; set; }
        public DateOnly? VoucherDate { get; set; }
        public string? VoucherCode { get; set; }  // XH1, XH2
        public string? InvoiceType { get; set; }
        public string? InvoiceId { get; set; }
        public DateOnly? InvoiceDate { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public List<CreateExportItemRequest> Items { get; set; } = new();
    }

    public class CreateExportItemRequest
    {
        public string? GoodsId { get; set; }

        public string? GoodsName { get; set; }

        public string? Unit { get; set; }

        public int? Quantity { get; set; }

        public decimal? UnitPrice { get; set; }

        public decimal? Amount1 { get; set; }

        public string? DebitAccount1 { get; set; }

        public string? CreditAccount1 { get; set; }

        public string? CreditWarehouseId { get; set; }

        public string? DebitAccount2 { get; set; }

        public string? CreditAccount2 { get; set; }

        public decimal? Amount2 { get; set; }

        public decimal? Promotion { get; set; }

        public decimal? Vat { get; set; }

        public string? OffsetVoucher { get; set; }

        public string? UserId { get; set; }

        public DateTime? CreatedDateTime { get; set; }
    }

    public class ExportListDto
    {
        public string VoucherId { get; set; } = null!;
        public string? VoucherCode { get; set; }   // XH1, XH2
        public string? InvoiceNumber { get; set; }
        public DateOnly? VoucherDate { get; set; }
        public string? CustomerName { get; set; }
        public decimal TotalAmount { get; set; }
        public int ItemCount { get; set; }
    }

    public class GetExportListRequest
    {
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
        public string? Keyword { get; set; }
        public string? VoucherCode { get; set; }  // lọc theo XH1/XH2, null = tất cả
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
    public class FifoAllocationDto
    {
        public string InboundVoucherCode { get; set; } = null!;
        public int AllocatedQty { get; set; }
        public string? WarehouseId { get; set; }
    }
    public class InboundStockDto
    {
        public string InboundVoucherCode { get; set; } = null!; // VD: NK000001
        public int RemainingQty { get; set; }          // Tồn còn lại
        public string? WarehouseId { get; set; }          // Kho nhập
        public string? VoucherDate { get; set; }          // Ngày nhập (dd/MM/yyyy)
    }
}
