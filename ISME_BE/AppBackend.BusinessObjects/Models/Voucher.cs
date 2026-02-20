using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class Voucher
{
    public string VoucherId { get; set; } = null!;

    public string? CustomerId { get; set; }

    public string? CustomerName { get; set; }

    public string? TaxCode { get; set; }

    public string? Address { get; set; }

    public string? Pic { get; set; }

    public string? VoucherDescription { get; set; }

    public DateOnly? VoucherDate { get; set; }

    public string? VoucherCode { get; set; }

    public string? InvoiceType { get; set; }

    public string? InvoiceId { get; set; }

    public DateOnly? InvoiceDate { get; set; }

    public string? InvoiceNumber { get; set; }

    public string? BankName { get; set; }

    public string? BankAccountNumber { get; set; }

    public virtual ICollection<VoucherDetail> VoucherDetails { get; set; } = new List<VoucherDetail>();
}
