using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.SupplierRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.SupplierServices
{
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _repo;
        public SupplierService(ISupplierRepository repo) => _repo = repo;

        // ── Map ───────────────────────────────────────────────
        private static SupplierListDto MapToList(Customer c) => new()
        {
            SupplierId = c.CustomerId,
            SupplierName = c.CustomerName,
            Phone = c.Phone,
            TaxId = c.TaxId,
            Address = c.Address,
            IsEnterprise = c.IsEnterprise ?? false,
            IsInactive = c.IsInactive,
        };

        private static SupplierDetailDto MapToDetail(Customer c) => new()
        {
            SupplierId = c.CustomerId,
            SupplierName = c.CustomerName,
            Phone = c.Phone,
            TaxId = c.TaxId,
            Address = c.Address,
            IsEnterprise = c.IsEnterprise ?? false,
            IsInactive = c.IsInactive,
        };

        // ── Search dropdown (giữ nguyên) ─────────────────────
        public async Task<ResultModel<List<SupplierSearchResult>>> SearchAsync(
            string keyword, int limit)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                    return Ok(new List<SupplierSearchResult>(), "Keyword rỗng");

                var data = await _repo.SearchAsync(keyword.Trim(), limit);
                return Ok(data, $"Tìm thấy {data.Count} nhà cung cấp");
            }
            catch (Exception ex) { return Error<List<SupplierSearchResult>>(ex); }
        }

        // ── Danh sách ─────────────────────────────────────────
        public async Task<ResultModel<PagedResult<SupplierListDto>>> GetListAsync(
            GetSupplierListRequest request)
        {
            try
            {
                var (items, total) = await _repo.GetListAsync(request);
                return Ok(new PagedResult<SupplierListDto>
                {
                    Items = items.Select(MapToList).ToList(),
                    Total = total,
                    Page = request.Page,
                    PageSize = request.PageSize,
                }, "OK");
            }
            catch (Exception ex) { return Error<PagedResult<SupplierListDto>>(ex); }
        }

        // ── Chi tiết ──────────────────────────────────────────
        public async Task<ResultModel<SupplierDetailDto>> GetByIdAsync(string id)
        {
            try
            {
                var c = await _repo.GetByIdAsync(id);
                if (c == null)
                    return Fail<SupplierDetailDto>(404, "NOT_FOUND",
                        $"Không tìm thấy nhà cung cấp: {id}");
                return Ok(MapToDetail(c), "OK");
            }
            catch (Exception ex) { return Error<SupplierDetailDto>(ex); }
        }

        // ── Tạo mới ───────────────────────────────────────────
        public async Task<ResultModel<SupplierDetailDto>> CreateAsync(
            CreateSupplierRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.SupplierId))
                    return Fail<SupplierDetailDto>(400, "MISSING_ID",
                        "Mã nhà cung cấp không được để trống");

                if (string.IsNullOrWhiteSpace(request.SupplierName))
                    return Fail<SupplierDetailDto>(400, "MISSING_NAME",
                        "Tên nhà cung cấp không được để trống");

                if (await _repo.ExistsAsync(request.SupplierId.Trim().ToUpper()))
                    return Fail<SupplierDetailDto>(409, "DUPLICATE_ID",
                        $"Mã '{request.SupplierId}' đã tồn tại");

                var entity = new Customer
                {
                    CustomerId = request.SupplierId.Trim().ToUpper(),
                    CustomerName = request.SupplierName.Trim(),
                    Phone = request.Phone?.Trim(),
                    TaxId = request.TaxId?.Trim(),
                    Address = request.Address?.Trim(),
                    IsVendor = true,
                    IsCustomer = false,
                    IsEnterprise = request.IsEnterprise,
                    IsInactive = false,
                };

                await _repo.AddAsync(entity);
                await _repo.SaveChangesAsync();

                return new ResultModel<SupplierDetailDto>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 201,
                    Data = MapToDetail(entity),
                    Message = $"Tạo nhà cung cấp '{entity.CustomerName}' thành công",
                };
            }
            catch (Exception ex) { return Error<SupplierDetailDto>(ex); }
        }

        // ── Cập nhật ──────────────────────────────────────────
        public async Task<ResultModel<SupplierDetailDto>> UpdateAsync(
            string id, UpdateSupplierRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.SupplierName))
                    return Fail<SupplierDetailDto>(400, "MISSING_NAME",
                        "Tên nhà cung cấp không được để trống");

                var entity = await _repo.GetByIdAsync(id);
                if (entity == null)
                    return Fail<SupplierDetailDto>(404, "NOT_FOUND",
                        $"Không tìm thấy nhà cung cấp: {id}");

                entity.CustomerName = request.SupplierName.Trim();
                entity.Phone = request.Phone?.Trim();
                entity.TaxId = request.TaxId?.Trim();
                entity.Address = request.Address?.Trim();
                entity.IsEnterprise = request.IsEnterprise;

                await _repo.SaveChangesAsync();
                return Ok(MapToDetail(entity), "Cập nhật thành công");
            }
            catch (Exception ex) { return Error<SupplierDetailDto>(ex); }
        }

        // ── Đổi trạng thái ────────────────────────────────────
        public async Task<ResultModel<int>> UpdateStatusAsync(string id, bool isInactive)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy nhà cung cấp: {id}");

                entity.IsInactive = isInactive;
                var rows = await _repo.SaveChangesAsync();
                var action = isInactive ? "ngừng hợp tác" : "kích hoạt";
                return Ok(rows, $"Đã {action} nhà cung cấp '{entity.CustomerName}'");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        // ── Xóa ───────────────────────────────────────────────
        public async Task<ResultModel<int>> DeleteAsync(string id)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null)
                    return Fail<int>(404, "NOT_FOUND",
                        $"Không tìm thấy nhà cung cấp: {id}");

                var rows = await _repo.DeleteAsync(id);
                return Ok(rows, $"Đã xóa nhà cung cấp '{entity.CustomerName}'");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        // ── Result helpers ────────────────────────────────────
        private static ResultModel<T> Ok<T>(T data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };
        private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };
        private static ResultModel<T> Error<T>(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
    }
}
