using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsServices
{
    public interface IGoodsService
    {
        Task<ResultModel<PagedResult<GoodsListDto>>> GetListAsync(GetGoodsListRequest request);
        Task<ResultModel<GoodsDetailDto>> GetByIdAsync(string id);
        Task<ResultModel<List<GoodsSearchResult>>> SearchAsync(string keyword, int limit);
        Task<ResultModel<GoodsDetailDto>> CreateAsync(CreateGoodsRequest request);
        Task<ResultModel<GoodsDetailDto>> UpdateAsync(string id, UpdateGoodsRequest request);
        Task<ResultModel<int>> UpdateStatusAsync(string id, bool isInactive);
        Task<ResultModel<int>> DeleteAsync(string id);
    }
}
