using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class UserRole
{
    public string UserId { get; set; } = null!;

    public int RoleId { get; set; }

    public virtual User User { get; set; } = null!;
}
