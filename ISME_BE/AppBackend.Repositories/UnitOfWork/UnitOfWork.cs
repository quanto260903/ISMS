
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.UserRepo;

using AppBackend.Repositories.UnitOfWork;

namespace SWS.Repositories.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IndividualBusinessContext _context;

        private IUserRepository? _userRepository;
        public UnitOfWork(IndividualBusinessContext context)
        {
            _context = context;
        }

        public IUserRepository Users =>
            _userRepository ??= new UserRepository(_context);


        public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

        public void Dispose() => _context?.Dispose();
    }
}
