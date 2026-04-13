using AppBackend.BusinessObjects.Constants;
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
    private readonly Mock<IDbContextTransaction> _transaction = new();
    private readonly ImportService _sut;

    public ImportServiceTests()
    {
        _unitOfWork.Setup(unit => unit.BeginTransactionAsync()).ReturnsAsync(_transaction.Object);
        _unitOfWork.Setup(unit => unit.SaveChangesAsync()).ReturnsAsync(1);
        _importRepo.Setup(repo => repo.GenerateVoucherIdAsync()).ReturnsAsync("NK000001");

        _sut = new ImportService(_importRepo.Object, _itemRepo.Object, _unitOfWork.Object);
    }

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
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync((Good?)null);
        var request = BuildRequest();

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("ITEM_NOT_FOUND", result.ResponseCode);
        Assert.Equal(404, result.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public async Task CreateInward_InvalidQuantity_ReturnsInvalidQuantity(int quantity)
    {
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        var request = BuildRequest(quantity: quantity);

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_QUANTITY", result.ResponseCode);
    }

    [Fact]
    public async Task CreateInward_NegativeUnitPrice_ReturnsInvalidPrice()
    {
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        var request = BuildRequest(unitPrice: -1m);

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("INVALID_PRICE", result.ResponseCode);
    }

    [Fact]
    public async Task CreateInward_Nk2_MissingReturnReason_ReturnsValidationError()
    {
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        var request = BuildRequest(
            voucherCode: "NK2",
            offsetVoucher: "BH000001");

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("MISSING_RETURN_REASON", result.ResponseCode);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task CreateInward_Nk2_ExceedsRemainingQty_ReturnsValidationError()
    {
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        _importRepo
            .Setup(repo => repo.GetSaleSourceDetailAsync("BH000001", "G001", null))
            .ReturnsAsync((1, 5));
        _importRepo
            .Setup(repo => repo.GetReturnedQuantityForSaleLineAsync(1, "BH000001", "G001", null))
            .ReturnsAsync(4);

        var request = BuildRequest(
            quantity: 2,
            voucherCode: "NK2",
            offsetVoucher: "BH000001",
            returnReason: "Khach tra",
            rootCause: "Het han");

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.False(result.IsSuccess);
        Assert.Equal("EXCEEDS_SOLD_QTY", result.ResponseCode);
    }

    [Fact]
    public async Task CreateInward_ValidNk1Request_AddsSellableStock()
    {
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        _importRepo.Setup(repo => repo.AddAsync(It.IsAny<Voucher>())).Returns(Task.CompletedTask);
        _importRepo.Setup(repo => repo.AddSellableStockAsync("G001", 5)).Returns(Task.CompletedTask);

        var request = BuildRequest();

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.True(result.IsSuccess);
        Assert.Equal("SUCCESS", result.ResponseCode);
        _importRepo.Verify(repo => repo.AddSellableStockAsync("G001", 5), Times.Once);
        _importRepo.Verify(repo => repo.AddQuarantineStockAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CreateInward_ValidNk2Request_AddsQuarantineStock()
    {
        _itemRepo.Setup(repo => repo.GetByIdAsync("G001")).ReturnsAsync(MakeGood("G001"));
        _importRepo.Setup(repo => repo.AddAsync(It.IsAny<Voucher>())).Returns(Task.CompletedTask);
        _importRepo
            .Setup(repo => repo.GetSaleSourceDetailAsync("BH000001", "G001", null))
            .ReturnsAsync((11, 5));
        _importRepo
            .Setup(repo => repo.GetReturnedQuantityForSaleLineAsync(11, "BH000001", "G001", null))
            .ReturnsAsync(1);
        _importRepo.Setup(repo => repo.AddQuarantineStockAsync("G001", 2)).Returns(Task.CompletedTask);

        var request = BuildRequest(
            quantity: 2,
            voucherCode: "NK2",
            offsetVoucher: "BH000001",
            returnReason: "Khach tra",
            rootCause: "Loi san pham");

        var result = await _sut.CreateInwardAsync(request, "user1");

        Assert.True(result.IsSuccess);
        Assert.Equal("SUCCESS", result.ResponseCode);
        _importRepo.Verify(repo => repo.AddQuarantineStockAsync("G001", 2), Times.Once);
        _importRepo.Verify(repo => repo.AddSellableStockAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetById_VoucherNotFound_ReturnsNotFound()
    {
        _importRepo.Setup(repo => repo.GetByIdAsync("NK999999")).ReturnsAsync((Voucher?)null);

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
        _importRepo.Setup(repo => repo.GetByIdAsync("NK000001")).ReturnsAsync(voucher);

        var result = await _sut.GetByIdAsync("NK000001");

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal("NK000001", result.Data!.VoucherId);
        Assert.Equal("NK1", result.Data.VoucherCode);
        Assert.Equal("NCC Test", result.Data.CustomerName);
    }

    [Fact]
    public async Task GetById_VoucherExists_MapsReturnMetadataCorrectly()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000002",
            VoucherCode = "NK2",
            VoucherDetails = new List<VoucherDetail>
            {
                new()
                {
                    GoodsId = "G001",
                    GoodsName = "Gao",
                    Quantity = 3,
                    UnitPrice = 50000m,
                    StockBucket = StockBucketConstants.Quarantine,
                    SourceVoucherId = "BH000001",
                    SourceVoucherDetailId = 12,
                    ReturnReason = "Khach tra",
                    RootCause = "Het han",
                }
            }
        };
        _importRepo.Setup(repo => repo.GetByIdAsync("NK000002")).ReturnsAsync(voucher);

        var result = await _sut.GetByIdAsync("NK000002");

        Assert.True(result.IsSuccess);
        Assert.Single(result.Data!.Items);
        var item = result.Data.Items[0];
        Assert.Equal("QUARANTINE", item.StockBucket);
        Assert.Equal("BH000001", item.SourceVoucherId);
        Assert.Equal(12, item.SourceVoucherDetailId);
        Assert.Equal("Khach tra", item.ReturnReason);
        Assert.Equal("Het han", item.RootCause);
    }

    [Fact]
    public async Task Delete_VoucherNotFound_ReturnsNotFound()
    {
        _importRepo.Setup(repo => repo.GetByIdAsync("NK999999")).ReturnsAsync((Voucher?)null);

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
            VoucherCode = "NK1",
            VoucherDetails = new List<VoucherDetail>()
        };
        _importRepo.Setup(repo => repo.GetByIdAsync("NK000001")).ReturnsAsync(voucher);
        _importRepo.Setup(repo => repo.HasDependentExportsAsync("NK000001")).ReturnsAsync(true);

        var result = await _sut.DeleteAsync("NK000001");

        Assert.False(result.IsSuccess);
        Assert.Equal("HAS_DEPENDENT_EXPORTS", result.ResponseCode);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task Delete_Nk1Voucher_DeductsSellableStock()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000001",
            VoucherCode = "NK1",
            VoucherDetails = new List<VoucherDetail>
            {
                new() { GoodsId = "G001", Quantity = 10 }
            }
        };
        _importRepo.Setup(repo => repo.GetByIdAsync("NK000001")).ReturnsAsync(voucher);
        _importRepo.Setup(repo => repo.HasDependentExportsAsync("NK000001")).ReturnsAsync(false);
        _importRepo.Setup(repo => repo.DeductSellableStockAsync("G001", 10)).Returns(Task.CompletedTask);
        _importRepo.Setup(repo => repo.DeleteAsync("NK000001")).Returns(Task.CompletedTask);

        var result = await _sut.DeleteAsync("NK000001");

        Assert.True(result.IsSuccess);
        Assert.Equal("SUCCESS", result.ResponseCode);
        _importRepo.Verify(repo => repo.DeductSellableStockAsync("G001", 10), Times.Once);
        _importRepo.Verify(repo => repo.DeductQuarantineStockAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        _importRepo.Verify(repo => repo.DeleteAsync("NK000001"), Times.Once);
    }

    [Fact]
    public async Task Delete_Nk2Voucher_DeductsQuarantineStock()
    {
        var voucher = new Voucher
        {
            VoucherId = "NK000002",
            VoucherCode = "NK2",
            VoucherDetails = new List<VoucherDetail>
            {
                new()
                {
                    GoodsId = "G001",
                    Quantity = 3,
                    StockBucket = StockBucketConstants.Quarantine
                }
            }
        };
        _importRepo.Setup(repo => repo.GetByIdAsync("NK000002")).ReturnsAsync(voucher);
        _importRepo.Setup(repo => repo.HasDependentExportsAsync("NK000002")).ReturnsAsync(false);
        _importRepo.Setup(repo => repo.DeductQuarantineStockAsync("G001", 3)).Returns(Task.CompletedTask);
        _importRepo.Setup(repo => repo.DeleteAsync("NK000002")).Returns(Task.CompletedTask);

        var result = await _sut.DeleteAsync("NK000002");

        Assert.True(result.IsSuccess);
        _importRepo.Verify(repo => repo.DeductQuarantineStockAsync("G001", 3), Times.Once);
        _importRepo.Verify(repo => repo.DeductSellableStockAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        _importRepo.Verify(repo => repo.DeleteAsync("NK000002"), Times.Once);
    }

    private static Good MakeGood(string id) => new()
    {
        GoodsId = id,
        GoodsName = $"Hang {id}"
    };

    private static ImportOrder BuildRequest(
        string goodsId = "G001",
        int quantity = 5,
        decimal unitPrice = 100m,
        string voucherCode = "NK1",
        string? offsetVoucher = null,
        string? returnReason = null,
        string? rootCause = null) => new()
        {
            VoucherId = "",
            VoucherCode = voucherCode,
            CustomerName = "Test partner",
            Items = new List<CreateInwardItemRequest>
            {
                new()
                {
                    GoodsId = goodsId,
                    Quantity = quantity,
                    UnitPrice = unitPrice,
                    OffsetVoucher = offsetVoucher,
                    SourceVoucherId = offsetVoucher,
                    ReturnReason = returnReason,
                    RootCause = rootCause,
                }
            }
        };
}
