using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class BankAccount
{
    public int BankAccountId { get; set; }

    public int BankId { get; set; }

    public string AccountNumber { get; set; } = null!;

    public string AccountName { get; set; } = null!;

    public bool IsInactive { get; set; }
}
