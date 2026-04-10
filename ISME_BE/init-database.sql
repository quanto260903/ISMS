-- ============================================
-- ISMS Database Initialization Script
-- Target: SQL Server container (sa/Hi2Gamer)
-- ============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IndividualBusiness')
BEGIN
    CREATE DATABASE IndividualBusiness;
END
GO

USE IndividualBusiness;
GO

-- ============================================
-- 1. Users
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
CREATE TABLE Users (
    UserId NVARCHAR(16) NOT NULL,
    Username NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(256) NULL,
    Email NVARCHAR(256) NULL,
    IDCardNumber NVARCHAR(64) NULL,
    IssuedDate DATE NULL,
    IssuedBy NVARCHAR(255) NULL,
    NegotiatedSalary DECIMAL(18,0) NULL,
    InssuranceSalary DECIMAL(18,0) NULL,
    ContractType NVARCHAR(50) NULL,
    NumberOfDependent INT NOT NULL DEFAULT 0,
    RoleId INT NOT NULL DEFAULT 3,
    IsActive BIT NULL DEFAULT 1,
    CONSTRAINT PK__Users__1788CC4C6B23FC29 PRIMARY KEY (UserId)
);
GO

-- ============================================
-- 2. ActivityLogs
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLogs')
CREATE TABLE ActivityLogs (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId NVARCHAR(16) NULL,
    Action NVARCHAR(255) NULL,
    Description NVARCHAR(500) NULL,
    Module NVARCHAR(100) NULL,
    CreatedAt DATETIME NULL DEFAULT GETDATE(),
    CONSTRAINT PK__Activity__3214EC0727D45608 PRIMARY KEY (Id),
    CONSTRAINT FK_ActivityLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- ============================================
-- 3. Banks
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Banks')
CREATE TABLE Banks (
    BankId INT IDENTITY(1,1) NOT NULL,
    Logo NVARCHAR(255) NULL,
    ShortName NVARCHAR(50) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    BankDescription NVARCHAR(500) NULL,
    IsInactive BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK__Banks__AA08CB1327568829 PRIMARY KEY (BankId)
);
GO

-- ============================================
-- 4. BankAccounts
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BankAccounts')
CREATE TABLE BankAccounts (
    BankAccountId INT IDENTITY(1,1) NOT NULL,
    BankId INT NOT NULL,
    AccountNumber NVARCHAR(50) NOT NULL,
    AccountName NVARCHAR(255) NOT NULL,
    IsInactive BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK__BankAcco__4FC8E4A1B506C46A PRIMARY KEY (BankAccountId),
    CONSTRAINT UQ_BankAccounts_BankId_AccountNumber UNIQUE (BankId, AccountNumber)
);
GO

-- ============================================
-- 5. Customer
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customer')
CREATE TABLE Customer (
    CustomerId NVARCHAR(256) NOT NULL,
    CustomerName NVARCHAR(256) NULL,
    Address NVARCHAR(255) NULL,
    TaxId NVARCHAR(14) NULL,
    Phone NVARCHAR(12) NULL,
    IsCustomer BIT NULL DEFAULT 1,
    IsVendor BIT NULL DEFAULT 0,
    IsEnterprise BIT NULL DEFAULT 0,
    IsInactive BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK__Customer__A4AE64D8CD52BD2B PRIMARY KEY (CustomerId)
);
GO

-- ============================================
-- 6. GoodsCategory
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GoodsCategory')
CREATE TABLE GoodsCategory (
    GoodsGroupId NVARCHAR(50) NOT NULL,
    GoodsGroupName NVARCHAR(255) NOT NULL,
    IsInactive BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK__GoodsCat__609AEEF9ABA69ABD PRIMARY KEY (GoodsGroupId)
);
GO

-- ============================================
-- 7. Goods
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Goods')
CREATE TABLE Goods (
    GoodsId NVARCHAR(50) NOT NULL,
    GoodsName NVARCHAR(255) NOT NULL,
    GoodsGroupId NVARCHAR(50) NULL,
    Unit NVARCHAR(50) NOT NULL,
    MinimumStock INT NULL DEFAULT 0,
    FixedPurchasePrice DECIMAL(18,0) NULL,
    LastPurchasePrice DECIMAL(18,0) NULL,
    SalePrice DECIMAL(18,0) NULL,
    VATRate CHAR(2) NOT NULL DEFAULT '10',
    IsIncludeVAT BIT NOT NULL DEFAULT 0,
    IsPromotion BIT NOT NULL DEFAULT 0,
    IsInactive BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ItemOnHand INT NULL,
    CONSTRAINT PK__Goods__663DA92037CD9BDB PRIMARY KEY (GoodsId),
    CONSTRAINT FK_Goodss_GoodsGroups FOREIGN KEY (GoodsGroupId) REFERENCES GoodsCategory(GoodsGroupId)
);
GO

-- ============================================
-- 8. OpenBank
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OpenBank')
CREATE TABLE OpenBank (
    CreateDate DATETIME NOT NULL,
    VoucherNumber NVARCHAR(50) NULL,
    Debit_Amount0 DECIMAL(18,0) NULL,
    AccountNumber NVARCHAR(50) NOT NULL,
    Properties NVARCHAR(50) NULL,
    CONSTRAINT PK__OpenBank__CE101B31A6C7E435 PRIMARY KEY (CreateDate)
);
GO

-- ============================================
-- 9. OpenCash
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OpenCash')
CREATE TABLE OpenCash (
    CreateDate DATETIME NOT NULL,
    VoucherNumber NVARCHAR(50) NULL,
    Debit_Amount0 DECIMAL(18,0) NULL,
    Properties NVARCHAR(50) NULL,
    CONSTRAINT PK__OpenCash__CE101B31E474E686 PRIMARY KEY (CreateDate)
);
GO

-- ============================================
-- 10. OpenCustomer
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OpenCustomer')
CREATE TABLE OpenCustomer (
    CreateDate DATETIME NOT NULL,
    VoucherNumber NVARCHAR(50) NULL,
    CustomerDebitAmount0 DECIMAL(18,0) NULL,
    CustomerCreditAmount0 DECIMAL(18,0) NULL,
    VendorDebitAmount0 DECIMAL(18,0) NULL,
    VendorCreditAmount0 DECIMAL(18,0) NULL,
    CustomerId NVARCHAR(256) NULL,
    Properties NVARCHAR(50) NULL,
    CONSTRAINT PK__OpenCust__CE101B31996A32C5 PRIMARY KEY (CreateDate)
);
GO

-- ============================================
-- 11. OpenInventory
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OpenInventory')
CREATE TABLE OpenInventory (
    CreateDate DATETIME NOT NULL,
    VoucherNumber NVARCHAR(50) NULL,
    WarehouseId NVARCHAR(50) NULL,
    Unit NVARCHAR(50) NOT NULL,
    Quantity INT NULL,
    Debit_Amount0 DECIMAL(18,0) NULL,
    Properties NVARCHAR(50) NULL,
    GoodsId NVARCHAR(50) NULL,
    CONSTRAINT PK__OpenInve__CE101B318F81FB3E PRIMARY KEY (CreateDate)
);
GO

-- ============================================
-- 12. Units
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Units')
CREATE TABLE Units (
    Id INT IDENTITY(1,1) NOT NULL,
    Unit NVARCHAR(50) NULL,
    IsInactive BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK__Units__3214EC078DC82582 PRIMARY KEY (Id)
);
GO

-- ============================================
-- 13. Voucher
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Voucher')
CREATE TABLE Voucher (
    VoucherID NVARCHAR(50) NOT NULL,
    CustomerID NVARCHAR(50) NULL,
    CustomerName NVARCHAR(255) NULL,
    TaxCode NVARCHAR(50) NULL,
    Address NVARCHAR(255) NULL,
    PIC NVARCHAR(150) NULL,
    VoucherDescription NVARCHAR(500) NULL,
    VoucherDate DATE NULL,
    VoucherCode NVARCHAR(50) NULL,
    InvoiceType NVARCHAR(50) NULL,
    InvoiceId NVARCHAR(50) NULL,
    InvoiceDate DATE NULL,
    InvoiceNumber NVARCHAR(50) NULL,
    BankName NVARCHAR(255) NULL,
    BankAccountNumber NVARCHAR(50) NULL,
    CONSTRAINT PK__Voucher__3AEE79C18E9DB7D5 PRIMARY KEY (VoucherID)
);
GO

-- ============================================
-- 14. VoucherCodes
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VoucherCodes')
CREATE TABLE VoucherCodes (
    Id INT IDENTITY(1,1) NOT NULL,
    VoucherCode NVARCHAR(10) NOT NULL,
    DebitAccount1 NVARCHAR(20) NOT NULL,
    CreditAccount1 NVARCHAR(20) NOT NULL,
    DebitAccount2 NVARCHAR(20) NULL,
    CreditAccount2 NVARCHAR(20) NULL,
    BelongToScreen NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    CONSTRAINT PK__VoucherC__3214EC07F12EAABE PRIMARY KEY (Id)
);
GO

-- ============================================
-- 15. VoucherDetail
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VoucherDetail')
CREATE TABLE VoucherDetail (
    Id INT IDENTITY(1,1) NOT NULL,
    VoucherID NVARCHAR(50) NULL,
    GoodsId NVARCHAR(50) NULL,
    GoodsName NVARCHAR(255) NULL,
    Unit NVARCHAR(50) NULL,
    Quantity INT NULL,
    UnitPrice DECIMAL(18,0) NULL,
    Amount1 DECIMAL(18,0) NULL,
    DebitAccount1 NVARCHAR(50) NULL,
    CreditAccount1 NVARCHAR(50) NULL,
    DebitAccount2 NVARCHAR(50) NULL,
    CreditAccount2 NVARCHAR(50) NULL,
    Amount2 DECIMAL(18,0) NULL,
    Promotion DECIMAL(5,2) NULL,
    OffsetVoucher NVARCHAR(50) NULL,
    UserID NVARCHAR(16) NULL,
    CreatedDateTime DATETIME NULL DEFAULT GETDATE(),
    CONSTRAINT PK__VoucherD__3214EC07265E235B PRIMARY KEY (Id),
    CONSTRAINT FK_Detail_Header FOREIGN KEY (VoucherID) REFERENCES Voucher(VoucherID)
);
GO

-- ============================================
-- 16. StockTakeVouchers
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockTakeVouchers')
CREATE TABLE StockTakeVouchers (
    StockTakeVoucherId VARCHAR(50) NOT NULL,
    VoucherCode NVARCHAR(50) NOT NULL,
    VoucherDate DATE NOT NULL,
    StockTakeDate DATE NOT NULL,
    Purpose NVARCHAR(500) NULL,
    Member1 NVARCHAR(255) NULL,
    Position1 NVARCHAR(255) NULL,
    Member2 NVARCHAR(255) NULL,
    Position2 NVARCHAR(255) NULL,
    Member3 NVARCHAR(255) NULL,
    Position3 NVARCHAR(255) NULL,
    IsCompleted BIT NULL DEFAULT 0,
    CreatedDate DATETIME NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    CONSTRAINT PK__StockTak__604670B9049D1F92 PRIMARY KEY (StockTakeVoucherId)
);
GO

-- ============================================
-- 17. StockTakeDetails
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockTakeDetails')
CREATE TABLE StockTakeDetails (
    StockTakeDetailId INT IDENTITY(1,1) NOT NULL,
    StockTakeVoucherId VARCHAR(50) NOT NULL,
    GoodsId VARCHAR(50) NOT NULL,
    GoodsName NVARCHAR(255) NOT NULL,
    Unit NVARCHAR(50) NULL,
    BookQuantity DECIMAL(18,2) NOT NULL,
    ActualQuantity DECIMAL(18,2) NOT NULL,
    DifferenceQuantity DECIMAL(18,2) NOT NULL,
    CONSTRAINT PK__StockTak__6F1159AAD61EF5A1 PRIMARY KEY (StockTakeDetailId),
    CONSTRAINT FK_StockTakeDetails_Voucher FOREIGN KEY (StockTakeVoucherId) REFERENCES StockTakeVouchers(StockTakeVoucherId)
);
GO

-- ============================================
-- Seed: VoucherCodes (accounting mappings)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM VoucherCodes)
BEGIN
    INSERT INTO VoucherCodes (VoucherCode, DebitAccount1, CreditAccount1, BelongToScreen, Description) VALUES
    ('NK1', '156', '331', 'Import', N'Mua hàng nhập kho'),
    ('NK2', '156', '331', 'Import', N'Mua hàng trả lại'),
    ('NK3', '156', '3381', 'Import', N'Kiểm kê thừa'),
    ('NK4', '156', '331', 'Import', N'Mua hàng giảm giá'),
    ('NK5', '156', '331', 'Import', N'Nhập kho khác'),
    ('XH1', '632', '156', 'Export', N'Xuất bán hàng'),
    ('XH2', '632', '156', 'Export', N'Xuất bán trả lại'),
    ('XK1', '156', '156', 'Export', N'Chuyển kho nội bộ'),
    ('XK2', '632', '156', 'Export', N'Xuất trả hàng'),
    ('XK3', '1381', '156', 'Export', N'Kiểm kê thiếu');
END
GO

-- ============================================
-- Seed: Default Admin User
-- Password: Admin@123 (BCrypt hash)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM Users WHERE RoleId = 1)
BEGIN
    INSERT INTO Users (UserId, Username, PasswordHash, FullName, Email, NumberOfDependent, RoleId, IsActive)
    VALUES ('ADMIN001', 'admin@admin.com', '$2a$11$K7.XFG8xQdZz8e8Bq0K5fuHj3GiLm5Cjx5D0n.c7yjvHxnLqy5Iy', 'System Admin', 'admin@admin.com', 0, 1, 1);
END
GO

PRINT 'Database IndividualBusiness initialized successfully.';
GO
