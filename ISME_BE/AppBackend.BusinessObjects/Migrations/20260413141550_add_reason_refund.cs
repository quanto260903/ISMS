using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AppBackend.BusinessObjects.Migrations
{
    /// <inheritdoc />
    public partial class add_reason_refund : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BankAccounts",
                columns: table => new
                {
                    BankAccountId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BankId = table.Column<int>(type: "int", nullable: false),
                    AccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AccountName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsInactive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__BankAcco__4FC8E4A1B506C46A", x => x.BankAccountId);
                });

            migrationBuilder.CreateTable(
                name: "Banks",
                columns: table => new
                {
                    BankId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Logo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ShortName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    BankDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsInactive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Banks__AA08CB1327568829", x => x.BankId);
                });

            migrationBuilder.CreateTable(
                name: "Customer",
                columns: table => new
                {
                    CustomerId = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CustomerName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TaxId = table.Column<string>(type: "nvarchar(14)", maxLength: 14, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: true),
                    IsCustomer = table.Column<bool>(type: "bit", nullable: true, defaultValue: true),
                    IsVendor = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    IsEnterprise = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    IsInactive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Customer__A4AE64D8CD52BD2B", x => x.CustomerId);
                });

            migrationBuilder.CreateTable(
                name: "GoodsCategory",
                columns: table => new
                {
                    GoodsGroupId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GoodsGroupName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsInactive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__GoodsCat__609AEEF9ABA69ABD", x => x.GoodsGroupId);
                });

            migrationBuilder.CreateTable(
                name: "OpenBank",
                columns: table => new
                {
                    CreateDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    VoucherNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Debit_Amount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Properties = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OpenBank__CE101B31A6C7E435", x => x.CreateDate);
                });

            migrationBuilder.CreateTable(
                name: "OpenCash",
                columns: table => new
                {
                    CreateDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    VoucherNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Debit_Amount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    Properties = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OpenCash__CE101B31E474E686", x => x.CreateDate);
                });

            migrationBuilder.CreateTable(
                name: "OpenCustomer",
                columns: table => new
                {
                    CreateDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    VoucherNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CustomerDebitAmount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    CustomerCreditAmount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    VendorDebitAmount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    VendorCreditAmount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    CustomerId = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Properties = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OpenCust__CE101B31996A32C5", x => x.CreateDate);
                });

            migrationBuilder.CreateTable(
                name: "OpenInventory",
                columns: table => new
                {
                    CreateDate = table.Column<DateTime>(type: "datetime", nullable: false),
                    VoucherNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: true),
                    Debit_Amount0 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    Properties = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GoodsId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OpenInve__CE101B318F81FB3E", x => x.CreateDate);
                });

            migrationBuilder.CreateTable(
                name: "StockTakeVouchers",
                columns: table => new
                {
                    StockTakeVoucherId = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    VoucherCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    VoucherDate = table.Column<DateOnly>(type: "date", nullable: false),
                    StockTakeDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Member1 = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Position1 = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Member2 = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Position2 = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Member3 = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Position3 = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    CreatedBy = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__StockTak__604670B9049D1F92", x => x.StockTakeVoucherId);
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsInactive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Units__3214EC078DC82582", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    Username = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IDCardNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    IssuedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    IssuedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    NegotiatedSalary = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    InssuranceSalary = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    ContractType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NumberOfDependent = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: true, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Users__1788CC4C6B23FC29", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "Voucher",
                columns: table => new
                {
                    VoucherID = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CustomerID = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TaxCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PIC = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    VoucherDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    VoucherDate = table.Column<DateOnly>(type: "date", nullable: true),
                    VoucherCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    InvoiceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    InvoiceId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    InvoiceDate = table.Column<DateOnly>(type: "date", nullable: true),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Voucher__3AEE79C18E9DB7D5", x => x.VoucherID);
                });

            migrationBuilder.CreateTable(
                name: "VoucherCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VoucherCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DebitAccount1 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreditAccount1 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DebitAccount2 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreditAccount2 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    BelongToScreen = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__VoucherC__3214EC07F12EAABE", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Goods",
                columns: table => new
                {
                    GoodsId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GoodsName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    GoodsGroupId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MinimumStock = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    FixedPurchasePrice = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    LastPurchasePrice = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    SalePrice = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    VATRate = table.Column<string>(type: "char(2)", unicode: false, fixedLength: true, maxLength: 2, nullable: false, defaultValue: "10"),
                    IsIncludeVAT = table.Column<bool>(type: "bit", nullable: false),
                    IsPromotion = table.Column<bool>(type: "bit", nullable: false),
                    IsInactive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    ItemOnHand = table.Column<int>(type: "int", nullable: true),
                    QuarantineOnHand = table.Column<int>(type: "int", nullable: true, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Goods__663DA92037CD9BDB", x => x.GoodsId);
                    table.ForeignKey(
                        name: "FK_Goodss_GoodsGroups",
                        column: x => x.GoodsGroupId,
                        principalTable: "GoodsCategory",
                        principalColumn: "GoodsGroupId");
                });

            migrationBuilder.CreateTable(
                name: "StockTakeDetails",
                columns: table => new
                {
                    StockTakeDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StockTakeVoucherId = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    GoodsId = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    GoodsName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BookQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ActualQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DifferenceQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__StockTak__6F1159AAD61EF5A1", x => x.StockTakeDetailId);
                    table.ForeignKey(
                        name: "FK_StockTakeDetails_Voucher",
                        column: x => x.StockTakeVoucherId,
                        principalTable: "StockTakeVouchers",
                        principalColumn: "StockTakeVoucherId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                    Action = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Activity__3214EC0727D45608", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityLogs_Users",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "VoucherDetail",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VoucherID = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GoodsId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GoodsName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: true),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    Amount1 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    DebitAccount1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreditAccount1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DebitAccount2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreditAccount2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Amount2 = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    Promotion = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    OffsetVoucher = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    StockBucket = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SourceVoucherId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SourceVoucherDetailId = table.Column<int>(type: "int", nullable: true),
                    ReturnReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    RootCause = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    UserID = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__VoucherD__3214EC07265E235B", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Detail_Header",
                        column: x => x.VoucherID,
                        principalTable: "Voucher",
                        principalColumn: "VoucherID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_UserId",
                table: "ActivityLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UQ_BankAccounts_BankId_AccountNumber",
                table: "BankAccounts",
                columns: new[] { "BankId", "AccountNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Goods_GoodsGroupId",
                table: "Goods",
                column: "GoodsGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_StockTakeDetails_StockTakeVoucherId",
                table: "StockTakeDetails",
                column: "StockTakeVoucherId");

            migrationBuilder.CreateIndex(
                name: "IX_VoucherDetail_VoucherID",
                table: "VoucherDetail",
                column: "VoucherID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityLogs");

            migrationBuilder.DropTable(
                name: "BankAccounts");

            migrationBuilder.DropTable(
                name: "Banks");

            migrationBuilder.DropTable(
                name: "Customer");

            migrationBuilder.DropTable(
                name: "Goods");

            migrationBuilder.DropTable(
                name: "OpenBank");

            migrationBuilder.DropTable(
                name: "OpenCash");

            migrationBuilder.DropTable(
                name: "OpenCustomer");

            migrationBuilder.DropTable(
                name: "OpenInventory");

            migrationBuilder.DropTable(
                name: "StockTakeDetails");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "VoucherCodes");

            migrationBuilder.DropTable(
                name: "VoucherDetail");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "GoodsCategory");

            migrationBuilder.DropTable(
                name: "StockTakeVouchers");

            migrationBuilder.DropTable(
                name: "Voucher");
        }
    }
}
