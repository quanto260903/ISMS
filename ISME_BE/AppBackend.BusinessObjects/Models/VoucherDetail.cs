using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class VoucherDetail
{
    public int Id { get; set; }

    public string? VoucherId { get; set; }

    public string? GoodsId { get; set; }

    public string? GoodsName { get; set; }

    public string? Unit { get; set; }

    public int? Quantity { get; set; }

    public decimal? UnitPrice { get; set; }

    public decimal? Amount1 { get; set; }

    public string? DebitAccount1 { get; set; }

    public string? DebitWarehouseId { get; set; }

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

    public virtual Warehouse? CreditWarehouse { get; set; }

    public virtual Warehouse? DebitWarehouse { get; set; }

    public virtual Voucher? Voucher { get; set; }
}
