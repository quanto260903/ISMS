using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.StockTakeRepo;
using AppBackend.Repositories.Repositories.UserRepo;

namespace AppBackend.Repositories.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }
        IImportRepository Import { get; }
        IStockTakeVoucherRepository StockTakeVouchers { get; }
        IStockTakeDetailRepository StockTakeDetails { get; }
        Task<int> SaveChangesAsync();
    }
}
