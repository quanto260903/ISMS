using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class StockTakeVoucher
{
    public string StockTakeVoucherId { get; set; } = null!;

    public string VoucherCode { get; set; } = null!;

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

    public DateTime? CreatedDate { get; set; }

    public string? CreatedBy { get; set; }

    public virtual ICollection<StockTakeDetail> StockTakeDetails { get; set; } = new List<StockTakeDetail>();
}
