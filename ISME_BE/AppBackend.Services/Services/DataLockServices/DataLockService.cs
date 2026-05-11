using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.DataLockRepo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.DataLockServices
{
    public class DataLockService : IDataLockService
    {
        private readonly IDataLockRepository _repo;

        public DataLockService(IDataLockRepository repo)
        {
            _repo = repo;
        }

        public async Task<DataLockResponse> LockAsync(string module, LockDataRequest request, string userId)
        {
            // Kiểm tra nếu module đang bị khóa
            var existing = await _repo.GetActiveLockAsync(module);
            if (existing != null)
                throw new InvalidOperationException(
                    $"Module '{module}' đang bị khóa đến ngày {existing.LockedUntilDate:dd/MM/yyyy} bởi {existing.LockedByUserId}.");

            var newLock = new DataLock
            {
                Module = module.ToUpper(),
                LockedUntilDate = request.LockedUntilDate,
                Reason = request.Reason,
                LockedByUserId = userId,
                IsActive = true,
                LockedAt = DateTime.Now
            };

            var created = await _repo.CreateLockAsync(newLock);
            return ToResponse(created);
        }

        public async Task<DataLockResponse> UnlockAsync(string module, string userId)
        {
            var lock_ = await _repo.GetActiveLockAsync(module)
                ?? throw new KeyNotFoundException($"Không tìm thấy khóa đang hoạt động cho module '{module}'.");

            lock_.IsActive = false;
            lock_.UnlockedByUserId = userId;
            lock_.UnlockedAt = DateTime.Now;

            var updated = await _repo.UpdateLockAsync(lock_);
            return ToResponse(updated);
        }

        public async Task<DataLockResponse?> GetCurrentLockAsync(string module)
        {
            var lock_ = await _repo.GetActiveLockAsync(module);
            return lock_ == null ? null : ToResponse(lock_);
        }

        // -----------------------------------------------
        private static DataLockResponse ToResponse(DataLock x) => new(
            x.DataLockId,
            x.Module,
            x.LockedUntilDate,
            x.IsActive,
            x.Reason,
            x.LockedByUserId,
            x.LockedAt,
            x.UnlockedByUserId,
            x.UnlockedAt
        );
    }
}
