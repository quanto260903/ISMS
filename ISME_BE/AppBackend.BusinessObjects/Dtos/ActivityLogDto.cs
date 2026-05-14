using System;
using System.Collections.Generic;

namespace AppBackend.BusinessObjects.Dtos
{
    public class ActivityLogDto
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? Action { get; set; }
        public string? Description { get; set; }
        public string? Module { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class ActivityLogListResult
    {
        public List<ActivityLogDto> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
