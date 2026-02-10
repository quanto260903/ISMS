using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Models;

public partial class User
{
    public string UserId { get; set; } = null!;

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? IdcardNumber { get; set; }

    public DateOnly? IssuedDate { get; set; }

    public string? IssuedBy { get; set; }

    public decimal? NegotiatedSalary { get; set; }

    public decimal? InssuranceSalary { get; set; }

    public string? ContractType { get; set; }

    public int NumberOfDependent { get; set; }

    public int RoleId { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
