using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.ExportServices
{
    public interface IExportServices
    {
        Task<ResultModel<int>> CreateExportAsync(ExportOrder request, string userId);
        Task<ResultModel<int>> UpdateExportAsync(ExportOrder request, string userId);
        Task<ResultModel<ExportOrder>> GetByIdAsync(string voucherId);
        Task<ResultModel<PagedResult<ExportListDto>>> GetListAsync(GetExportListRequest request);
    }
}
