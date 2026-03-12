using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Repositories.Repositories.AuditRepo
{
    public class AuditRepository : IAuditRepository
    {
        private readonly IndividualBusinessContext _context;

        public AuditRepository(IndividualBusinessContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Voucher voucher)
        {
            if (voucher == null) throw new ArgumentNullException(nameof(voucher));
            await _context.Vouchers.AddAsync(voucher);
        }

        public async Task UpdateAsync(Voucher voucher)
        {
            _context.Vouchers.Update(voucher);
        }

        public async Task<Voucher?> GetByIdAsync(string voucherId)
        {
            return await _context.Vouchers
                .Include(v => v.VoucherDetails)
                .FirstOrDefaultAsync(v =>
                    v.VoucherId == voucherId &&
                    v.VoucherCode != null &&
                    v.VoucherCode.StartsWith("KK"));
        }

        public async Task<(IEnumerable<Voucher> Items, int Total)> GetListAsync(
            GetAuditListRequest request)
        {
            var query = _context.Vouchers
                .Include(v => v.VoucherDetails)
                .Where(v => v.VoucherCode != null && v.VoucherCode.StartsWith("KK"))
                .AsQueryable();

            // ── Lọc ngày theo VoucherDate (DateOnly) ──
            if (request.FromDate.HasValue)
            {
                var from = DateOnly.FromDateTime(request.FromDate.Value);
                query = query.Where(v => v.VoucherDate >= from);
            }
            if (request.ToDate.HasValue)
            {
                var to = DateOnly.FromDateTime(request.ToDate.Value);
                query = query.Where(v => v.VoucherDate <= to);
            }

            // ── Tìm kiếm theo mã phiếu hoặc người lập (lưu ở VoucherDetails.UserId) ──
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.Trim().ToLower();
                query = query.Where(v =>
                    v.VoucherId.ToLower().Contains(kw) ||
                    v.VoucherDetails.Any(d => d.UserId != null &&
                                             d.UserId.ToLower().Contains(kw)));
            }

            // ── Lọc theo kho ──
            // Kho kiểm kê lưu ở VoucherDescription (header) hoặc CustomerId
            // Ở đây ta lưu WarehouseId vào CustomerId để tận dụng field sẵn có
            if (!string.IsNullOrWhiteSpace(request.WarehouseId))
                query = query.Where(v => v.CustomerId == request.WarehouseId);

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(v => v.VoucherDate)
                .ThenByDescending(v => v.VoucherId)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return (items, total);
        }
    }
}
