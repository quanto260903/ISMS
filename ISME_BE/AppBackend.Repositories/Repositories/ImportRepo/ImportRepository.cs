using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.ImportRepo
{
    public class ImportRepository : IImportRepository
    {
        private readonly IndividualBusinessContext _context;

        public ImportRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Voucher voucher)
        {
            if (voucher == null)
                throw new ArgumentNullException(nameof(voucher));

            await _context.Vouchers.AddAsync(voucher);
        }

        public async Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(
          GetInwardListRequest request)
        {
            // Phiếu nhập kho = VoucherCode bắt đầu bằng "NK"
            var query = _context.Vouchers
                .Include(v => v.VoucherDetails)
                .Where(v => v.VoucherCode != null && v.VoucherCode.StartsWith("NK"))
                .AsQueryable();

            // ── Lọc ngày ──
            if (request.FromDate.HasValue)
                query = query.Where(v => v.VoucherDate >= request.FromDate);
            if (request.ToDate.HasValue)
                query = query.Where(v => v.VoucherDate <= request.ToDate);

            // ── Tìm kiếm ──
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(v =>
                    v.VoucherId.ToLower().Contains(kw) ||
                    (v.CustomerName != null && v.CustomerName.ToLower().Contains(kw)));
            }

            // ── Lọc theo loại phiếu ──
            if (!string.IsNullOrWhiteSpace(request.VoucherCode))
                query = query.Where(v => v.VoucherCode == request.VoucherCode);

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(v => v.VoucherDate)
                .ThenByDescending(v => v.VoucherId)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, total);
        }
        public async Task<Voucher?> GetByIdAsync(string voucherId)
        {
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v =>
                    v.VoucherId == voucherId &&
                    v.VoucherCode != null &&
                    v.VoucherCode.StartsWith("NK"));
        }

        public async Task UpdateAsync(Voucher voucher)
        {
            _context.Vouchers.Update(voucher);
        }

    }
}
