using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;
using AppBackend.Repositories.Repositories.UserRepo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.GoodsRepo
{
    public class SaleGoodsRepository : ISaleGoodsRepository
    {
        private readonly IndividualBusinessContext _context;

        public SaleGoodsRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Voucher voucher)
        {
            if (voucher == null)
                throw new ArgumentNullException(nameof(voucher));

            await _context.Vouchers.AddAsync(voucher);
        }
    }
}
