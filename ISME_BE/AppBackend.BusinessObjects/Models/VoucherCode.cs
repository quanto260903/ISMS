using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class VoucherCode
{
    public int Id { get; set; }

    public string VoucherCode1 { get; set; } = null!;

    public string DebitAccount1 { get; set; } = null!;

    public string CreditAccount1 { get; set; } = null!;

    public string? DebitAccount2 { get; set; }

    public string? CreditAccount2 { get; set; }

    public string BelongToScreen { get; set; } = null!;

    public string? Description { get; set; }
}
