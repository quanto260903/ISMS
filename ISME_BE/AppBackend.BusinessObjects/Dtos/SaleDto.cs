using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    public class CreateSaleRequest
    {
        public string VoucherId { get; set; } = null!;

        public string? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public string? TaxCode { get; set; }

        public string? Address { get; set; }

        public string? VoucherDescription { get; set; }

        public DateOnly? VoucherDate { get; set; }

        public string? VoucherCode { get; set; }

        public string? BankName { get; set; }

        public string? BankAccountNumber { get; set; }

        public List<CreateSaleItemRequest> Items { get; set; }
    }
    public class CreateSaleItemRequest
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

    public class SaleVoucherLookupDto
    {
        public string VoucherId { get; set; } = null!;
        public string? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public DateOnly? VoucherDate { get; set; }
        public List<SaleVoucherDetailDto> Items { get; set; } = new();
    }

    public class SaleVoucherDetailDto
    {
        public int SaleVoucherDetailId { get; set; }
        public string? GoodsId { get; set; }
        public string? GoodsName { get; set; }
        public string? Unit { get; set; }
        public int? SoldQty { get; set; }
        public int? ReturnedQty { get; set; }
        public int? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Amount1 { get; set; }
        public decimal? Vat { get; set; }
        public decimal? Promotion { get; set; }
        public string? DebitAccount1 { get; set; }
        public string? CreditAccount1 { get; set; }
        public string? CreditWarehouseId { get; set; }
    }
}
