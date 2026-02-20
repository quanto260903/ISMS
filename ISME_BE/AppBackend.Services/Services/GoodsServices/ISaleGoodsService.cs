using AppBackend.BusinessObjects.Dtos.PayOs;
using AppBackend.Services.ApiModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppBackend.Services.Services.GoodsServices
{
    public interface ISaleGoodsService
    {
        Task<ResultModel<int>> CreateSaleAsync(CreateSaleRequest request, string userId);
    }
}
