using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public interface ISaleGoodsRepository
    {
        Task AddAsync(Voucher sale);
    }
}
