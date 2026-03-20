
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.Repositories.StockTakeRepo;
using AppBackend.Repositories.Repositories.UserRepo;
using Microsoft.EntityFrameworkCore.Storage;

using AppBackend.Repositories.UnitOfWork;

namespace SWS.Repositories.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IndividualBusinessContext _context;

        private IUserRepository? _userRepository;
        private IItemRepository? _itemRepository;
        private IImportRepository? _importRepository;
        private IStockTakeVoucherRepository? _stockTakeVouchers;
        private IStockTakeDetailRepository? _stockTakeDetails;
        public UnitOfWork(IndividualBusinessContext context)
        {
            _context = context;
        }

        public IUserRepository Users =>
            _userRepository ??= new UserRepository(_context);
        public IItemRepository Item =>
            _itemRepository ??= new ItemRepository(_context);
        public IImportRepository Import =>
            _importRepository ??= new ImportRepository(_context);
        public IStockTakeVoucherRepository StockTakeVouchers
            => _stockTakeVouchers ??= new StockTakeVoucherRepository(_context);

        public IStockTakeDetailRepository StockTakeDetails
            => _stockTakeDetails ??= new StockTakeDetailRepository(_context);
        public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

        public async Task<IDbContextTransaction> BeginTransactionAsync()
            => await _context.Database.BeginTransactionAsync();

        public void Dispose() => _context?.Dispose();
    }
}
