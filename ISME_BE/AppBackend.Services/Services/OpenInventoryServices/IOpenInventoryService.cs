using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.OpenInventoryServices
{
    public interface IOpenInventoryService
    {
        Task<ResultModel<PagedResult<OpenInventoryRowDto>>> GetListAsync(GetOpenInventoryListRequest req);
        Task<ResultModel<OpenInventorySummaryDto>> GetSummaryAsync();
        Task<ResultModel<OpenInventoryRowDto>> UpsertAsync(UpsertOpenInventoryRequest req);
        Task<ResultModel<int>> DeleteAsync(string goodsId);
    }
}
