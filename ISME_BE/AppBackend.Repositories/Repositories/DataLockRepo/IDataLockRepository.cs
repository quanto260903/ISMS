using AppBackend.BusinessObjects.Models;

namespace AppBackend.Repositories.Repositories.DataLockRepo
{
    public interface IDataLockRepository
    {
        /// <summary>Lấy lock đang active (IsActive = true) của module</summary>
        Task<DataLock?> GetActiveLockAsync(string module);

        /// <summary>Tạo bản ghi khóa mới</summary>
        Task<DataLock> CreateLockAsync(DataLock dataLock);

        /// <summary>Cập nhật bản ghi khóa (dùng khi mở khóa)</summary>
        Task<DataLock> UpdateLockAsync(DataLock dataLock);
    }
}