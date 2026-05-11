using AppBackend.BusinessObjects.Dtos;

namespace AppBackend.Services.Services.DataLockServices
{
    public interface IDataLockService
    {
        /// <summary>
        /// Lấy thông tin khóa đang active của module.
        /// Trả về null nếu module không bị khóa.
        /// </summary>
        Task<DataLockResponse?> GetCurrentLockAsync(string module);

        /// <summary>
        /// Tạo khóa mới cho module.
        /// Throw InvalidOperationException nếu module đang bị khóa rồi.
        /// </summary>
        Task<DataLockResponse> LockAsync(
            string module, LockDataRequest request, string userId);

        /// <summary>
        /// Mở khóa module đang active.
        /// Throw KeyNotFoundException nếu không tìm thấy khóa.
        /// </summary>
        Task<DataLockResponse> UnlockAsync(string module, string userId);
    }
}