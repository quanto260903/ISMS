using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class DataLock
{
    public int DataLockId { get; set; }

    public string Module { get; set; } = null!;

    public DateOnly LockedUntilDate { get; set; }

    public bool IsActive { get; set; }

    public string? Reason { get; set; }

    public string LockedByUserId { get; set; } = null!;

    public DateTime LockedAt { get; set; }

    public string? UnlockedByUserId { get; set; }

    public DateTime? UnlockedAt { get; set; }

    public virtual User LockedByUser { get; set; } = null!;

    public virtual User? UnlockedByUser { get; set; }
}
