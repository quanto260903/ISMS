using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Generic;
using AppBackend.Repositories.Repositories.UserRepo;
using Microsoft.EntityFrameworkCore;
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

        public async Task<Voucher?> GetByVoucherIdAsync(string voucherId)
        {
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v =>
                    v.VoucherId == voucherId &&
                    v.VoucherCode != null &&
                    (v.VoucherCode.StartsWith("BH") || v.VoucherCode.StartsWith("XH"))); // Hỗ trợ cả dữ liệu mới và seed legacy
        }

        public async Task<int> GetReturnedQtyForSaleDetailAsync(
            int saleVoucherDetailId,
            string saleVoucherId,
            string goodsId)
        {
            return await _context.VoucherDetails
                .Where(d =>
                    d.Voucher != null &&
                    d.Voucher.VoucherCode == "NK2" &&
                    (
                        d.SourceVoucherDetailId == saleVoucherDetailId ||
                        (
                            d.SourceVoucherDetailId == null &&
                            (d.SourceVoucherId == saleVoucherId || d.OffsetVoucher == saleVoucherId) &&
                            d.GoodsId == goodsId
                        )
                    ))
                .AsNoTracking()
                .SumAsync(d => d.Quantity ?? 0);
        }
    }
}
