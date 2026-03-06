using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ImportRepo
{
    public interface IImportRepository
    {
        Task AddAsync(Voucher voucher);

        Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(
          GetInwardListRequest request);
    }
}
