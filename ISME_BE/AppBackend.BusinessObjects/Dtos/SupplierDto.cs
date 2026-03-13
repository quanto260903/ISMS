using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.BusinessObjects.Dtos
{
    // ── Giữ nguyên từ cũ (dùng cho dropdown search) ──
    public class SupplierSearchResult
    {
        public string SupplierId { get; set; } = null!;
        public string? SupplierName { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }

    // ── Response: dòng trong danh sách ──
    public class SupplierListDto
    {
        public string SupplierId { get; set; } = null!;
        public string? SupplierName { get; set; }
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; }
        public bool IsInactive { get; set; }
    }

    // ── Response: chi tiết ──
    public class SupplierDetailDto
    {
        public string SupplierId { get; set; } = null!;
        public string? SupplierName { get; set; }
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; }
        public bool IsInactive { get; set; }
    }

    // ── Request: tạo mới (mở rộng từ cũ) ──
    public class CreateSupplierRequest
    {
        public string SupplierId { get; set; } = null!;
        public string SupplierName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; } = false;
    }

    // ── Request: cập nhật ──
    public class UpdateSupplierRequest
    {
        public string SupplierName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? TaxId { get; set; }
        public string? Address { get; set; }
        public bool IsEnterprise { get; set; }
    }

    // ── Request: lọc danh sách ──
    public class GetSupplierListRequest
    {
        public string? Keyword { get; set; }
        public bool? IsInactive { get; set; }
        public bool? IsEnterprise { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
