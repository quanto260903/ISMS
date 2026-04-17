using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class ImportOrder
    {
        public string VoucherId { get; set; } = null!;

        public string? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public string? TaxCode { get; set; }

        public string? Address { get; set; }

        public string? VoucherDescription { get; set; }

        public DateOnly? VoucherDate { get; set; }

        public string? VoucherCode { get; set; }

        public string? InvoiceType { get; set; }

        public string? InvoiceId { get; set; }

        public DateOnly? InvoiceDate { get; set; }

        public string? InvoiceNumber { get; set; }

        public string? BankName { get; set; }

        public string? BankAccountNumber { get; set; }

        public List<CreateInwardItemRequest> Items { get; set; } = new();
    }

    public class CreateInwardItemRequest
    {

        public string? GoodsId { get; set; }

        public string? GoodsName { get; set; }

        public string? Unit { get; set; }

        public int? Quantity { get; set; }

        public decimal? UnitPrice { get; set; }

        public decimal? Amount1 { get; set; }

        public string? DebitAccount1 { get; set; }

        public string? CreditAccount1 { get; set; }

        public string? DebitAccount2 { get; set; }

        public string? CreditAccount2 { get; set; }

        public decimal? Promotion { get; set; }

        public string? OffsetVoucher { get; set; }

        public string? UserId { get; set; }
        public DateTime? CreatedDateTime { get; set; }
    }

    public class InwardListDto
    {
        public string VoucherId { get; set; } = null!;
        public string? VoucherCode { get; set; }   // NK1/NK2/NK3/NK4/NK5
        public string? InvoiceNumber { get; set; }   // Số hóa đơn (-- nếu null)
        public DateOnly? VoucherDate { get; set; }   // Thời gian
        public string? CustomerName { get; set; }   // Đối tượng (NCC/Khách)
        public decimal TotalAmount { get; set; }   // Tổng tiền hàng
        public int ItemCount { get; set; }   // Số dòng chi tiết
    }

    /// <summary>Bộ lọc danh sách phiếu nhập kho</summary>
    public class InwardSearchResult
    {
        public string VoucherId { get; set; } = null!;
        public string? VoucherDate { get; set; }
        public string? CustomerName { get; set; }
        public decimal TotalAmount { get; set; }
        public int ItemCount { get; set; }
    }

    public class GetInwardListRequest
    {
        /// <summary>Từ ngày (mặc định: đầu tháng hiện tại)</summary>
        public DateOnly? FromDate { get; set; }

        /// <summary>Đến ngày (mặc định: hôm nay)</summary>
        public DateOnly? ToDate { get; set; }

        /// <summary>Tìm theo số phiếu hoặc tên đối tượng</summary>
        public string? Keyword { get; set; }

        /// <summary>Lọc theo lý do nhập (NK1-NK5), null = tất cả</summary>
        public string? VoucherCode { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public decimal GrandTotal { get; set; } // Tổng tiền cuối bảng
    }
}
