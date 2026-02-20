
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.Repositories.UserRepo;

using AppBackend.Repositories.UnitOfWork;

namespace SWS.Repositories.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IndividualBusinessContext _context;

        private IUserRepository? _userRepository;
        private IItemRepository? _itemRepository;
        public UnitOfWork(IndividualBusinessContext context)
        {
            _context = context;
        }

        public IUserRepository Users =>
            _userRepository ??= new UserRepository(_context);
        public IItemRepository Item =>
            _itemRepository ??= new ItemRepository(_context);

        public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

        public void Dispose() => _context?.Dispose();
    }
}
