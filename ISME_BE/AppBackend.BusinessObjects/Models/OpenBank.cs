using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class OpenBank
{
    public DateTime CreateDate { get; set; }

    public decimal? DebitAmount0 { get; set; }

    public string AccountNumber { get; set; } = null!;

    public string? Properties { get; set; }
}
