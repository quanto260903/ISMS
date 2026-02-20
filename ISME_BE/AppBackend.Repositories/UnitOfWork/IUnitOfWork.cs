using AppBackend.Repositories.Repositories.UserRepo;

namespace AppBackend.Repositories.UnitOfWork
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }
        Task<int> SaveChangesAsync();
    }
}
