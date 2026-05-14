using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.DataLockRepo
{
    public class DataLockRepository : IDataLockRepository
    {
        private readonly IndividualBusinessContext _db;

        public DataLockRepository(IndividualBusinessContext db)
        {
            _db = db;
        }

        public async Task<DataLock?> GetActiveLockAsync(string module)
        {
            return await _db.DataLocks
                .Where(x => x.Module == module && x.IsActive)
                .OrderByDescending(x => x.LockedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<DataLock> CreateLockAsync(DataLock dataLock)
        {
            _db.DataLocks.Add(dataLock);
            await _db.SaveChangesAsync();
            return dataLock;
        }

        public async Task<DataLock> UpdateLockAsync(DataLock dataLock)
        {
            _db.DataLocks.Update(dataLock);
            await _db.SaveChangesAsync();
            return dataLock;
        }
    }
}
