using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.UserRepo;

namespace AppBackend.Repositories.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }
        IImportRepository Import { get; }
        Task<int> SaveChangesAsync();
    }
}
