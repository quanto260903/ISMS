using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class OpenCustomer
{
    public DateTime CreateDate { get; set; }

    public decimal? CustomerDebitAmount0 { get; set; }

    public decimal? CustomerCreditAmount0 { get; set; }

    public decimal? VendorDebitAmount0 { get; set; }

    public decimal? VendorCreditAmount0 { get; set; }

    public string? CustomerId { get; set; }

    public string? Properties { get; set; }
}
