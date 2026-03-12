using AppBackend.BusinessObjects.Dtos;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.SupplierServices
{
    public interface ISupplierService
    {
        Task<ResultModel<List<SupplierSearchResult>>> SearchAsync(string keyword, int limit = 10);
        Task<ResultModel<SupplierSearchResult>> CreateAsync(CreateSupplierRequest request);
    }
}
