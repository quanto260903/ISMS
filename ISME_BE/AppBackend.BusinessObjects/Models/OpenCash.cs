using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class OpenCash
{
    public DateTime CreateDate { get; set; }

    public string? VoucherNumber { get; set; }

    public decimal? DebitAmount0 { get; set; }

    public string? Properties { get; set; }
}
