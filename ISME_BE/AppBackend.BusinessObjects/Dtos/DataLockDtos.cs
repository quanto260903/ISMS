using System;

namespace AppBackend.BusinessObjects.Dtos
{
    // -------------------------------------------------------
    // Request: Tạo khóa mới
    // POST /api/data-locks/{module}/lock
    // -------------------------------------------------------
    public class LockDataRequest
    {
        /// <summary>
        /// Khóa toàn bộ chứng từ có VoucherDate &lt;= LockedUntilDate.
        /// Cho phép ngày quá khứ — đây là nghiệp vụ chính của tính năng.
        /// </summary>
        public DateOnly LockedUntilDate { get; set; }

        /// <summary>Lý do khóa (không bắt buộc)</summary>
        public string? Reason { get; set; }
    }

    // -------------------------------------------------------
    // Response: Thông tin khóa trả về cho frontend
    // Khớp với DataLock entity và cách gọi ToResponse() trong Service
    // -------------------------------------------------------
    public record DataLockResponse(
        int DataLockId,
        string Module,
        DateOnly LockedUntilDate,
        bool IsActive,
        string? Reason,
        string LockedByUserId,
        DateTime LockedAt,
        string? UnlockedByUserId,
        DateTime? UnlockedAt
    );
}