using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsCategoryServices
{
    public interface IGoodsCategoryService
    {
        Task<ResultModel<PagedResult<GoodsCategoryListDto>>> GetListAsync(GetGoodsCategoryListRequest request);
        Task<ResultModel<GoodsCategoryDetailDto>> GetByIdAsync(string id);
        Task<ResultModel<GoodsCategoryDetailDto>> CreateAsync(CreateGoodsCategoryRequest request);
        Task<ResultModel<GoodsCategoryDetailDto>> UpdateAsync(string id, UpdateGoodsCategoryRequest request);
        Task<ResultModel<int>> UpdateStatusAsync(string id, UpdateGoodsCategoryStatusRequest request);
        Task<ResultModel<int>> DeleteAsync(string id);
    }
}
