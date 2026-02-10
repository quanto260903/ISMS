using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class Bank
{
    public int BankId { get; set; }

    public string? Logo { get; set; }

    public string ShortName { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? BankDescription { get; set; }

    public bool IsInactive { get; set; }
}
