using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.OpenInventoryRepo;
using AppBackend.Services.ApiModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.OpenInventoryServices
{
    public class OpenInventoryService : IOpenInventoryService
    {
        private readonly IOpenInventoryRepository _repo;
        private readonly IndividualBusinessContext _ctx;

        public OpenInventoryService(IOpenInventoryRepository repo, IndividualBusinessContext ctx)
        { _repo = repo; _ctx = ctx; }

        private static OpenInventoryRowDto Map(OpenInventory oi, string name) => new()
        {
            GoodsId = oi.GoodsId!,
            GoodsName = name,
            Unit = oi.Unit,
            Quantity = oi.Quantity ?? 0,
            DebitAmount0 = oi.DebitAmount0 ?? 0,
            TotalValue = (oi.Quantity ?? 0) * (oi.DebitAmount0 ?? 0),
            Properties = oi.Properties,
            CreateDate = oi.CreateDate,
        };

        public async Task<ResultModel<PagedResult<OpenInventoryRowDto>>> GetListAsync(
            GetOpenInventoryListRequest req)
        {
            try
            {
                var (items, total) = await _repo.GetListAsync(req);
                var ids = items.Select(x => x.GoodsId).Distinct().ToList();
                var nameMap = await _ctx.Goods
                    .Where(g => ids.Contains(g.GoodsId))
                    .ToDictionaryAsync(g => g.GoodsId, g => g.GoodsName);

                return Ok(new PagedResult<OpenInventoryRowDto>
                {
                    Items = items.Select(oi => Map(oi, nameMap.GetValueOrDefault(oi.GoodsId ?? "", oi.GoodsId ?? ""))).ToList(),
                    Total = total,
                    Page = req.Page,
                    PageSize = req.PageSize,
                }, "OK");
            }
            catch (Exception ex) { return Err<PagedResult<OpenInventoryRowDto>>(ex); }
        }

        public async Task<ResultModel<OpenInventorySummaryDto>> GetSummaryAsync()
        {
            try { return Ok(await _repo.GetSummaryAsync(), "OK"); }
            catch (Exception ex) { return Err<OpenInventorySummaryDto>(ex); }
        }

        public async Task<ResultModel<OpenInventoryRowDto>> UpsertAsync(UpsertOpenInventoryRequest req)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.GoodsId))
                    return Fail<OpenInventoryRowDto>(400, "MISSING_GOODS", "Mã hàng không được rỗng");
                if (string.IsNullOrWhiteSpace(req.Unit))
                    return Fail<OpenInventoryRowDto>(400, "MISSING_UNIT", "Đơn vị tính không được rỗng");
                if (req.Quantity < 0)
                    return Fail<OpenInventoryRowDto>(400, "INVALID_QTY", "Số lượng không được âm");

                var existing = await _repo.GetByGoodsIdAsync(req.GoodsId);
                if (existing != null)
                {
                    existing.Unit = req.Unit;
                    existing.Quantity = req.Quantity;
                    existing.DebitAmount0 = req.DebitAmount0;
                    existing.Properties = req.Properties;
                }
                else
                {
                    await _repo.AddAsync(new OpenInventory
                    {
                        GoodsId = req.GoodsId,
                        Unit = req.Unit,
                        Quantity = req.Quantity,
                        DebitAmount0 = req.DebitAmount0,
                        Properties = req.Properties,
                        CreateDate = DateTime.Now,
                    });
                }

                await _repo.SaveChangesAsync();

                var goodsName = (await _ctx.Goods.FindAsync(req.GoodsId))?.GoodsName ?? req.GoodsId;
                return Ok(new OpenInventoryRowDto
                {
                    GoodsId = req.GoodsId,
                    GoodsName = goodsName,
                    Unit = req.Unit,
                    Quantity = req.Quantity,
                    DebitAmount0 = req.DebitAmount0,
                    TotalValue = req.Quantity * req.DebitAmount0,
                    Properties = req.Properties,
                    CreateDate = DateTime.Now,
                }, existing != null ? "Cập nhật thành công" : "Thêm mới thành công");
            }
            catch (Exception ex) { return Err<OpenInventoryRowDto>(ex); }
        }

        public async Task<ResultModel<int>> DeleteAsync(string goodsId)
        {
            try
            {
                var rows = await _repo.DeleteByGoodsIdAsync(goodsId);
                return rows == 0
                    ? Fail<int>(404, "NOT_FOUND", "Không tìm thấy bản ghi")
                    : Ok(rows, "Đã xóa thành công");
            }
            catch (Exception ex) { return Err<int>(ex); }
        }

        private static ResultModel<T> Ok<T>(T d, string m) => new() { IsSuccess = true, ResponseCode = "SUCCESS", StatusCode = 200, Data = d, Message = m };
        private static ResultModel<T> Fail<T>(int c, string r, string m) => new() { IsSuccess = false, ResponseCode = r, StatusCode = c, Data = default, Message = m };
        private static ResultModel<T> Err<T>(Exception ex) => new() { IsSuccess = false, ResponseCode = "EXCEPTION", StatusCode = 500, Data = default, Message = ex.Message };
    }
}
