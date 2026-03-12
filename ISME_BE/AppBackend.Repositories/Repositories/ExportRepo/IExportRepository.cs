using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ExportRepo
{
    public interface IExportRepository
    {
        Task AddAsync(Voucher voucher);
        Task UpdateAsync(Voucher voucher);
        Task<Voucher?> GetByIdAsync(string voucherId);
        Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(GetExportListRequest request);
    }
}
