using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.GoodsRepo;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsServices
{
    public class GoodsService : IGoodsService
    {
        private readonly IGoodsRepository _repo;
        public GoodsService(IGoodsRepository repo) => _repo = repo;

        // ── Map ───────────────────────────────────────────────
        private static GoodsListDto MapToList(Good g) => new()
        {
            GoodsId = g.GoodsId,
            GoodsName = g.GoodsName,
            GoodsGroupId = g.GoodsGroupId,
            GoodsGroupName = g.GoodsGroup?.GoodsGroupName,
            Unit = g.Unit,
            SalePrice = g.SalePrice,
            FixedPurchasePrice = g.FixedPurchasePrice,
            Vatrate = g.Vatrate,
            IsIncludeVat = g.IsIncludeVat,
            IsPromotion = g.IsPromotion,
            IsInactive = g.IsInactive,
            ItemOnHand = g.ItemOnHand,
            QuarantineOnHand = g.QuarantineOnHand,
            CreatedDate = g.CreatedDate,
        };

        private static GoodsDetailDto MapToDetail(Good g) => new()
        {
            GoodsId = g.GoodsId,
            GoodsName = g.GoodsName,
            GoodsGroupId = g.GoodsGroupId,
            GoodsGroupName = g.GoodsGroup?.GoodsGroupName,
            Unit = g.Unit,
            MinimumStock = g.MinimumStock,
            FixedPurchasePrice = g.FixedPurchasePrice,
            LastPurchasePrice = g.LastPurchasePrice,
            SalePrice = g.SalePrice,
            Vatrate = g.Vatrate,
            IsIncludeVat = g.IsIncludeVat,
            IsPromotion = g.IsPromotion,
            IsInactive = g.IsInactive,
            ItemOnHand = g.ItemOnHand,
            QuarantineOnHand = g.QuarantineOnHand,
            CreatedDate = g.CreatedDate,
        };

        // ── Danh sách ─────────────────────────────────────────
        public async Task<ResultModel<PagedResult<GoodsListDto>>> GetListAsync(
            GetGoodsListRequest request)
        {
            try
            {
                var (items, total) = await _repo.GetListAsync(request);
                return Ok(new PagedResult<GoodsListDto>
                {
                    Items = items.Select(MapToList).ToList(),
                    Total = total,
                    Page = request.Page,
                    PageSize = request.PageSize,
                }, "OK");
            }
            catch (Exception ex) { return Error<PagedResult<GoodsListDto>>(ex); }
        }

        // ── Chi tiết ──────────────────────────────────────────
        public async Task<ResultModel<GoodsDetailDto>> GetByIdAsync(string id)
        {
            try
            {
                var g = await _repo.GetByIdAsync(id);
                if (g == null)
                    return Fail<GoodsDetailDto>(404, "NOT_FOUND", $"Không tìm thấy hàng hóa: {id}");
                return Ok(MapToDetail(g), "OK");
            }
            catch (Exception ex) { return Error<GoodsDetailDto>(ex); }
        }

        // ── Tìm kiếm dropdown ────────────────────────────────
        public async Task<ResultModel<List<GoodsSearchResult>>> SearchAsync(
            string keyword, int limit)
        {
            try
            {
                var results = await _repo.SearchAsync(keyword, limit);
                return Ok(results, "OK");
            }
            catch (Exception ex) { return Error<List<GoodsSearchResult>>(ex); }
        }

        // ── Tạo mới ───────────────────────────────────────────
        public async Task<ResultModel<GoodsDetailDto>> CreateAsync(CreateGoodsRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.GoodsId))
                    return Fail<GoodsDetailDto>(400, "MISSING_ID", "Mã hàng không được để trống");
                if (string.IsNullOrWhiteSpace(request.GoodsName))
                    return Fail<GoodsDetailDto>(400, "MISSING_NAME", "Tên hàng không được để trống");
                if (string.IsNullOrWhiteSpace(request.Unit))
                    return Fail<GoodsDetailDto>(400, "MISSING_UNIT", "Đơn vị tính không được để trống");

                if (await _repo.ExistsAsync(request.GoodsId.Trim().ToUpper()))
                    return Fail<GoodsDetailDto>(409, "DUPLICATE_ID",
                        $"Mã hàng '{request.GoodsId}' đã tồn tại");

                var entity = new Good
                {
                    GoodsId = request.GoodsId.Trim().ToUpper(),
                    GoodsName = request.GoodsName.Trim(),
                    GoodsGroupId = request.GoodsGroupId,
                    Unit = request.Unit.Trim(),
                    MinimumStock = request.MinimumStock,
                    FixedPurchasePrice = request.FixedPurchasePrice,
                    LastPurchasePrice = request.FixedPurchasePrice,  // khởi tạo = giá mua cố định
                    SalePrice = request.SalePrice,
                    Vatrate = request.Vatrate,
                    IsIncludeVat = request.IsIncludeVat,
                    IsPromotion = request.IsPromotion,
                    IsInactive = false,
                    CreatedDate = DateTime.Now,
                    ItemOnHand = 0,
                    QuarantineOnHand = 0,
                };

                await _repo.AddAsync(entity);
                await _repo.SaveChangesAsync();

                // Reload để lấy GoodsGroup name
                var created = await _repo.GetByIdAsync(entity.GoodsId);

                return new ResultModel<GoodsDetailDto>
                {
                    IsSuccess = true,
                    ResponseCode = "SUCCESS",
                    StatusCode = 201,
                    Data = MapToDetail(created!),
                    Message = $"Tạo hàng hóa '{entity.GoodsName}' thành công",
                };
            }
            catch (Exception ex) { return Error<GoodsDetailDto>(ex); }
        }

        // ── Cập nhật ──────────────────────────────────────────
        public async Task<ResultModel<GoodsDetailDto>> UpdateAsync(
            string id, UpdateGoodsRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.GoodsName))
                    return Fail<GoodsDetailDto>(400, "MISSING_NAME", "Tên hàng không được để trống");
                if (string.IsNullOrWhiteSpace(request.Unit))
                    return Fail<GoodsDetailDto>(400, "MISSING_UNIT", "Đơn vị tính không được để trống");

                var g = await _repo.GetByIdAsync(id);
                if (g == null)
                    return Fail<GoodsDetailDto>(404, "NOT_FOUND", $"Không tìm thấy hàng hóa: {id}");

                g.GoodsName = request.GoodsName.Trim();
                g.GoodsGroupId = request.GoodsGroupId;
                g.Unit = request.Unit.Trim();
                g.MinimumStock = request.MinimumStock;
                g.FixedPurchasePrice = request.FixedPurchasePrice;
                g.SalePrice = request.SalePrice;
                g.Vatrate = request.Vatrate;
                g.IsIncludeVat = request.IsIncludeVat;
                g.IsPromotion = request.IsPromotion;

                await _repo.SaveChangesAsync();

                var updated = await _repo.GetByIdAsync(id);
                return Ok(MapToDetail(updated!), "Cập nhật thành công");
            }
            catch (Exception ex) { return Error<GoodsDetailDto>(ex); }
        }

        // ── Đổi trạng thái ────────────────────────────────────
        public async Task<ResultModel<int>> UpdateStatusAsync(string id, bool isInactive)
        {
            try
            {
                var g = await _repo.GetByIdAsync(id);
                if (g == null)
                    return Fail<int>(404, "NOT_FOUND", $"Không tìm thấy hàng hóa: {id}");

                g.IsInactive = isInactive;
                var rows = await _repo.SaveChangesAsync();
                var action = isInactive ? "ngừng kinh doanh" : "kích hoạt";
                return Ok(rows, $"Đã {action} hàng hóa '{g.GoodsName}'");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        // ── Xóa ───────────────────────────────────────────────
        public async Task<ResultModel<int>> DeleteAsync(string id)
        {
            try
            {
                var g = await _repo.GetByIdAsync(id);
                if (g == null)
                    return Fail<int>(404, "NOT_FOUND", $"Không tìm thấy hàng hóa: {id}");

                if ((g.ItemOnHand ?? 0) > 0 || (g.QuarantineOnHand ?? 0) > 0)
                    return Fail<int>(409, "HAS_STOCK",
                        $"Hàng hóa đang có tồn bán được {(g.ItemOnHand ?? 0)} và tồn cách ly {(g.QuarantineOnHand ?? 0)}, không thể xóa");

                var rows = await _repo.DeleteAsync(id);
                return Ok(rows, $"Đã xóa hàng hóa '{g.GoodsName}'");
            }
            catch (Exception ex) { return Error<int>(ex); }
        }

        private static ResultModel<T> Ok<T>(T data, string msg) => new()
        { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = data, Message = msg };
        private static ResultModel<T> Fail<T>(int code, string rc, string msg) => new()
        { IsSuccess = false, ResponseCode = rc, StatusCode = code, Data = default, Message = msg };
        private static ResultModel<T> Error<T>(Exception ex) => new()
        { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
    }
}
