using AppBackend.BusinessObjects.Dtos;
using AppBackend.BusinessObjects.Models;
using AppBackend.Repositories.Repositories.ImportRepo;
using AppBackend.Repositories.Repositories.ItemRepo;
using AppBackend.Repositories.UnitOfWork;
using AppBackend.Services.Services.ImportServices;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;

namespace AppBackend.Tests;

public class ImportServiceTests
{
    private readonly Mock<IImportRepository> _importRepo = new();
    private readonly Mock<IItemRepository> _itemRepo = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IDbContextTransaction> _tx = new();
    private readonly ImportService _sut;

    public ImportServiceTests()
    {
        _unitOfWork.Setup(u => u.BeginTransactionAsync()).ReturnsAsync(_tx.Object);
        _unitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _importRepo.Setup(r => r.GenerateVoucherIdAsync()).ReturnsAsync("NK000001");

        _sut = new ImportService(_importRepo.Object, _itemRepo.Object, _unitOfWork.Object);
    }

    // ──────────────────────────────────────────
    // CreateInwardAsync – validation cases
    // ──────────────────────────────────────────

    [Fact]
    public async Task CreateInward_EmptyGoodsId_ReturnsInvalidItem()
    {
        var request = BuildRequest(goodsId: "");

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_ITEM", result.ResponseCode);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task CreateInward_GoodsNotFound_ReturnsItemNotFound()
    {
        _itemRepo.Setup(r => r.GetByIdAsync("G001")).ReturnsAsync((Good?)null);
        var request = BuildRequest(goodsId: "G001");

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("ITEM_NOT_FOUND", result.ResponseCode);
        Assert.Equal(404, result.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task CreateInward_InvalidQuantity_ReturnsInvalidQuantity(int qty)
    {
        _itemRepo.Setup(r => r.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        var request = BuildRequest(goodsId: "G001", quantity: qty);

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_QUANTITY", result.ResponseCode);
    }

    [Fact]
    public async Task CreateInward_NegativeUnitPrice_ReturnsInvalidPrice()
    {
        _itemRepo.Setup(r => r.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        var request = BuildRequest(goodsId: "G001", quantity: 10, unitPrice: -1m);

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_PRICE", result.ResponseCode);
    }

    [Fact]
    public async Task CreateInward_NK2_AlreadyReturned_ReturnsDuplicateReturn()
    {
        _itemRepo.Setup(r => r.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        _importRepo.Setup(r => r.IsAlreadyReturnedAsync("XK000001")).ReturnsAsync(true);

        var request = BuildRequest(goodsId: "G001", quantity: 5, unitPrice: 100m,
            voucherCode: "NK2", offsetVoucher: "XK000001");

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("DUPLICATE_RETURN", result.ResponseCode);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task CreateInward_ValidRequest_ReturnsSuccess()
    {
        _itemRepo.Setup(r => r.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        _importRepo.Setup(r => r.AddAsync(It.IsAny<Voucher>())).Returns(Task.CompletedTask);
        _importRepo.Setup(r => r.AddStockAsync("G001", 5)).Returns(Task.CompletedTask);

        var request = BuildRequest(goodsId: "G001", quantity: 5, unitPrice: 100m);

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.True(result.IsSuccess);
        Assert.Equal("SUCCESS", result.ResponseCode);
        Assert.Equal(200, result.StatusCode);
    }

    // ──────────────────────────────────────────
    // GetByIdAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task GetById_VoucherNotFound_ReturnsNotFound()
    {
        _importRepo.Setup(r => r.GetByIdAsync("NK999999")).ReturnsAsync((Voucher?)null);

        var result = await _sut.GetByIdAsync("NK999999");

        Assert.False(result.IsSuccess);
        Assert.Equal("NOT_FOUND", result.ResponseCode);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task GetById_VoucherExists_MapsHeaderFieldsCorrectly()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000001",
            VoucherCode = "NK1",
            CustomerName = "NCC Test",
            VoucherDate = new DateOnly(2026, 3, 1),
            VoucherDetails = new List<VoucherDetail>()
        };
        _importRepo.Setup(r => r.GetByIdAsync("NK000001")).ReturnsAsync(voucher);

        var result = await _sut.GetByIdAsync("NK000001");

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal("NK000001", result.Data!.VoucherId);
        Assert.Equal("NK1", result.Data.VoucherCode);
        Assert.Equal("NCC Test", result.Data.CustomerName);
    }

    [Fact]
    public async Task GetById_VoucherExists_MapsDetailItemsCorrectly()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000001",
            VoucherCode = "NK1",
            VoucherDetails = new List<VoucherDetail>
            {
                new() { GoodsId = "G001", GoodsName = "Gạo", Quantity = 10, UnitPrice = 50_000m }
            }
        };
        _importRepo.Setup(r => r.GetByIdAsync("NK000001")).ReturnsAsync(voucher);

        var result = await _sut.GetByIdAsync("NK000001");

        Assert.Single(result.Data!.Items);
        var item = result.Data.Items[0];
        Assert.Equal("G001", item.GoodsId);
        Assert.Equal(10, item.Quantity);
        Assert.Equal(50_000m, item.UnitPrice);
    }

    // ──────────────────────────────────────────
    // DeleteAsync
    // ──────────────────────────────────────────

    [Fact]
    public async Task Delete_VoucherNotFound_ReturnsNotFound()
    {
        _importRepo.Setup(r => r.GetByIdAsync("NK999999")).ReturnsAsync((Voucher?)null);

        var result = await _sut.DeleteAsync("NK999999");

        Assert.False(result.IsSuccess);
        Assert.Equal("NOT_FOUND", result.ResponseCode);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task Delete_HasDependentExports_ReturnsHasDependentExports()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000001",
            VoucherDetails = new List<VoucherDetail>()
        };
        _importRepo.Setup(r => r.GetByIdAsync("NK000001")).ReturnsAsync(voucher);
        _importRepo.Setup(r => r.HasDependentExportsAsync("NK000001")).ReturnsAsync(true);

        var result = await _sut.DeleteAsync("NK000001");

        Assert.False(result.IsSuccess);
        Assert.Equal("HAS_DEPENDENT_EXPORTS", result.ResponseCode);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task Delete_ValidVoucher_DeductsStockAndDeletes()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000001",
            VoucherDetails = new List<VoucherDetail>
            {
                new() { GoodsId = "G001", Quantity = 10 }
            }
        };
        _importRepo.Setup(r => r.GetByIdAsync("NK000001")).ReturnsAsync(voucher);
        _importRepo.Setup(r => r.HasDependentExportsAsync("NK000001")).ReturnsAsync(false);
        _importRepo.Setup(r => r.DeductStockAsync("G001", 10)).Returns(Task.CompletedTask);
        _importRepo.Setup(r => r.DeleteAsync("NK000001")).Returns(Task.CompletedTask);

        var result = await _sut.DeleteAsync("NK000001");

        Assert.True(result.IsSuccess);
        Assert.Equal("SUCCESS", result.ResponseCode);
        _importRepo.Verify(r => r.DeductStockAsync("G001", 10), Times.Once);
        _importRepo.Verify(r => r.DeleteAsync("NK000001"), Times.Once);
    }

    // ──────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────

    private static Good MakeGood(string id) => new() { GoodsId = id, GoodsName = $"Hàng {id}" };

    private static ImportOrder BuildRequest(
        string goodsId = "G001",
        int quantity = 5,
        decimal unitPrice = 100m,
        string voucherCode = "NK1",
        string? offsetVoucher = null) => new()
        {
            VoucherId = "",
            VoucherCode = voucherCode,
            Items = new List<CreateInwardItemRequest>
            {
                new()
                {
                    GoodsId = goodsId,
                    Quantity = quantity,
                    UnitPrice = unitPrice,
                    OffsetVoucher = offsetVoucher
                }
            }
        };
}
