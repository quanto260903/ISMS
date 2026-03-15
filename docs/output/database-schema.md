# Database Schema

## Overview

The ISMS database is designed using relational database principles with normalized tables for optimal data integrity and performance. The schema supports multi-warehouse inventory management, comprehensive transaction tracking, and financial reporting.

## Database Design Principles

- **Normalization**: 3NF to reduce data redundancy
- **Referential Integrity**: Foreign key constraints
- **Indexing**: Strategic indexes for query performance
- **Auditing**: Comprehensive audit trails
- **Scalability**: Support for multiple warehouses and high transaction volumes

## Core Tables

### Users & Security

#### Users
```sql
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    RoleId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    LastLoginDate DATETIME2 NULL,
    PasswordResetToken NVARCHAR(255) NULL,
    PasswordResetExpiry DATETIME2 NULL,
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);

CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_RoleId ON Users(RoleId);
```

#### Roles
```sql
CREATE TABLE Roles (
    RoleId INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) UNIQUE NOT NULL,
    Description NVARCHAR(255),
    Permissions NVARCHAR(MAX), -- JSON array of permissions
    CreatedDate DATETIME2 DEFAULT GETUTCDATE()
);
```

#### UserSessions
```sql
CREATE TABLE UserSessions (
    SessionId NVARCHAR(255) PRIMARY KEY,
    UserId INT NOT NULL,
    LoginTime DATETIME2 DEFAULT GETUTCDATE(),
    LogoutTime DATETIME2 NULL,
    IPAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
```

### Master Data

#### Products
```sql
CREATE TABLE Products (
    ProductId INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode NVARCHAR(50) UNIQUE NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    CategoryId INT NOT NULL,
    Unit NVARCHAR(20) NOT NULL, -- e.g., 'pcs', 'kg', 'liter'
    PurchasePrice DECIMAL(18,2) DEFAULT 0,
    SalePrice DECIMAL(18,2) NOT NULL,
    MinStockLevel INT DEFAULT 0,
    MaxStockLevel INT NULL,
    TaxRate DECIMAL(5,4) DEFAULT 0, -- e.g., 0.1000 for 10%
    IsActive BIT DEFAULT 1,
    Description NVARCHAR(500),
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT,
    ModifiedDate DATETIME2 DEFAULT GETUTCDATE(),
    ModifiedBy INT,
    FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_Products_ProductCode ON Products(ProductCode);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_IsActive ON Products(IsActive);
```

#### Categories
```sql
CREATE TABLE Categories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) UNIQUE NOT NULL,
    Description NVARCHAR(255),
    ParentCategoryId INT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (ParentCategoryId) REFERENCES Categories(CategoryId)
);
```

#### Warehouses
```sql
CREATE TABLE Warehouses (
    WarehouseId INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseCode NVARCHAR(20) UNIQUE NOT NULL,
    WarehouseName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(100),
    Country NVARCHAR(100),
    PostalCode NVARCHAR(20),
    Phone NVARCHAR(20),
    ManagerId INT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    FOREIGN KEY (ManagerId) REFERENCES Users(UserId)
);

CREATE INDEX IX_Warehouses_WarehouseCode ON Warehouses(WarehouseCode);
```

#### Customers
```sql
CREATE TABLE Customers (
    CustomerId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerCode NVARCHAR(50) UNIQUE NOT NULL,
    CustomerName NVARCHAR(255) NOT NULL,
    ContactPerson NVARCHAR(100),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),
    Mobile NVARCHAR(20),
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(100),
    Country NVARCHAR(100),
    PostalCode NVARCHAR(20),
    TaxId NVARCHAR(50),
    CreditLimit DECIMAL(18,2) DEFAULT 0,
    PaymentTerms NVARCHAR(100), -- e.g., 'Net 30', 'COD'
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_Customers_CustomerCode ON Customers(CustomerCode);
CREATE INDEX IX_Customers_IsActive ON Customers(IsActive);
```

#### Suppliers
```sql
CREATE TABLE Suppliers (
    SupplierId INT IDENTITY(1,1) PRIMARY KEY,
    SupplierCode NVARCHAR(50) UNIQUE NOT NULL,
    SupplierName NVARCHAR(255) NOT NULL,
    ContactPerson NVARCHAR(100),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),
    Mobile NVARCHAR(20),
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(100),
    Country NVARCHAR(100),
    PostalCode NVARCHAR(20),
    TaxId NVARCHAR(50),
    PaymentTerms NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_Suppliers_SupplierCode ON Suppliers(SupplierCode);
CREATE INDEX IX_Suppliers_IsActive ON Suppliers(IsActive);
```

### Inventory Management

#### Inventory
```sql
CREATE TABLE Inventory (
    InventoryId INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    WarehouseId INT NOT NULL,
    Quantity DECIMAL(18,2) DEFAULT 0,
    ReservedQuantity DECIMAL(18,2) DEFAULT 0, -- Quantity allocated for orders
    AvailableQuantity AS (Quantity - ReservedQuantity) PERSISTED,
    LastUpdated DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedBy INT,
    UNIQUE(ProductId, WarehouseId),
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId),
    FOREIGN KEY (WarehouseId) REFERENCES Warehouses(WarehouseId),
    FOREIGN KEY (UpdatedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_Inventory_ProductId ON Inventory(ProductId);
CREATE INDEX IX_Inventory_WarehouseId ON Inventory(WarehouseId);
CREATE INDEX IX_Inventory_AvailableQuantity ON Inventory(AvailableQuantity);
```

#### InventoryTransactions
```sql
CREATE TABLE InventoryTransactions (
    TransactionId INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT NOT NULL,
    WarehouseId INT NOT NULL,
    TransactionType NVARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUST', 'TRANSFER'
    Quantity DECIMAL(18,2) NOT NULL,
    PreviousQuantity DECIMAL(18,2) NOT NULL,
    NewQuantity DECIMAL(18,2) NOT NULL,
    ReferenceType NVARCHAR(50), -- 'PURCHASE_RECEIPT', 'SALES_INVOICE', 'ADJUSTMENT', etc.
    ReferenceId INT,
    TransactionDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT NOT NULL,
    Notes NVARCHAR(500),
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId),
    FOREIGN KEY (WarehouseId) REFERENCES Warehouses(WarehouseId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_InventoryTransactions_ProductId ON InventoryTransactions(ProductId);
CREATE INDEX IX_InventoryTransactions_WarehouseId ON InventoryTransactions(WarehouseId);
CREATE INDEX IX_InventoryTransactions_TransactionDate ON InventoryTransactions(TransactionDate);
CREATE INDEX IX_InventoryTransactions_ReferenceType ON InventoryTransactions(ReferenceType, ReferenceId);
```

### Transaction Documents

#### Documents
```sql
CREATE TABLE Documents (
    DocumentId INT IDENTITY(1,1) PRIMARY KEY,
    DocumentType NVARCHAR(20) NOT NULL, -- 'PURCHASE_ORDER', 'PURCHASE_INVOICE', 'SALES_ORDER', 'SALES_INVOICE', etc.
    DocumentNumber NVARCHAR(50) UNIQUE NOT NULL,
    DocumentDate DATETIME2 NOT NULL,
    DueDate DATETIME2 NULL,
    Status NVARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'
    ReferenceDocumentId INT NULL, -- For linking related documents
    CustomerId INT NULL,
    SupplierId INT NULL,
    WarehouseId INT NULL,
    Subtotal DECIMAL(18,2) DEFAULT 0,
    TaxAmount DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    PaidAmount DECIMAL(18,2) DEFAULT 0,
    BalanceAmount AS (TotalAmount - PaidAmount) PERSISTED,
    Notes NVARCHAR(1000),
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT NOT NULL,
    ApprovedDate DATETIME2 NULL,
    ApprovedBy INT NULL,
    ModifiedDate DATETIME2 DEFAULT GETUTCDATE(),
    ModifiedBy INT NULL,
    FOREIGN KEY (ReferenceDocumentId) REFERENCES Documents(DocumentId),
    FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId),
    FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId),
    FOREIGN KEY (WarehouseId) REFERENCES Warehouses(WarehouseId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId),
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_Documents_DocumentType ON Documents(DocumentType);
CREATE INDEX IX_Documents_DocumentNumber ON Documents(DocumentNumber);
CREATE INDEX IX_Documents_Status ON Documents(Status);
CREATE INDEX IX_Documents_DocumentDate ON Documents(DocumentDate);
CREATE INDEX IX_Documents_CustomerId ON Documents(CustomerId);
CREATE INDEX IX_Documents_SupplierId ON Documents(SupplierId);
```

#### DocumentLines
```sql
CREATE TABLE DocumentLines (
    DocumentLineId INT IDENTITY(1,1) PRIMARY KEY,
    DocumentId INT NOT NULL,
    LineNumber INT NOT NULL,
    ProductId INT NOT NULL,
    Description NVARCHAR(255),
    Quantity DECIMAL(18,2) NOT NULL,
    Unit NVARCHAR(20) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    DiscountPercent DECIMAL(5,4) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    TaxPercent DECIMAL(5,4) DEFAULT 0,
    TaxAmount DECIMAL(18,2) DEFAULT 0,
    LineTotal DECIMAL(18,2) NOT NULL,
    WarehouseId INT NULL,
    Notes NVARCHAR(255),
    FOREIGN KEY (DocumentId) REFERENCES Documents(DocumentId),
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId),
    FOREIGN KEY (WarehouseId) REFERENCES Warehouses(WarehouseId),
    UNIQUE(DocumentId, LineNumber)
);

CREATE INDEX IX_DocumentLines_DocumentId ON DocumentLines(DocumentId);
CREATE INDEX IX_DocumentLines_ProductId ON DocumentLines(ProductId);
```

### Payment Management

#### Payments
```sql
CREATE TABLE Payments (
    PaymentId INT IDENTITY(1,1) PRIMARY KEY,
    DocumentId INT NOT NULL,
    PaymentDate DATETIME2 NOT NULL,
    PaymentMethod NVARCHAR(20) NOT NULL, -- 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD'
    PaymentReference NVARCHAR(100), -- Cheque number, transaction ID, etc.
    BankAccountId INT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(3) DEFAULT 'VND',
    ExchangeRate DECIMAL(10,4) DEFAULT 1,
    Notes NVARCHAR(500),
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT NOT NULL,
    FOREIGN KEY (DocumentId) REFERENCES Documents(DocumentId),
    FOREIGN KEY (BankAccountId) REFERENCES BankAccounts(BankAccountId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_Payments_DocumentId ON Payments(DocumentId);
CREATE INDEX IX_Payments_PaymentDate ON Payments(PaymentDate);
```

#### BankAccounts
```sql
CREATE TABLE BankAccounts (
    BankAccountId INT IDENTITY(1,1) PRIMARY KEY,
    BankName NVARCHAR(100) NOT NULL,
    AccountNumber NVARCHAR(50) UNIQUE NOT NULL,
    AccountName NVARCHAR(100) NOT NULL,
    Branch NVARCHAR(100),
    Currency NVARCHAR(3) DEFAULT 'VND',
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
```

### System Configuration

#### SystemSettings
```sql
CREATE TABLE SystemSettings (
    SettingId INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) UNIQUE NOT NULL,
    SettingValue NVARCHAR(MAX),
    SettingType NVARCHAR(20) DEFAULT 'STRING', -- 'STRING', 'NUMBER', 'BOOLEAN', 'JSON'
    Description NVARCHAR(255),
    IsSystem BIT DEFAULT 0, -- System settings cannot be deleted
    ModifiedDate DATETIME2 DEFAULT GETUTCDATE(),
    ModifiedBy INT,
    FOREIGN KEY (ModifiedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_SystemSettings_SettingKey ON SystemSettings(SettingKey);
```

#### AuditLogs
```sql
CREATE TABLE AuditLogs (
    AuditLogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(100) NOT NULL,
    RecordId INT NOT NULL,
    Action NVARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    OldValues NVARCHAR(MAX), -- JSON of old values
    NewValues NVARCHAR(MAX), -- JSON of new values
    ChangedBy INT NOT NULL,
    ChangedDate DATETIME2 DEFAULT GETUTCDATE(),
    IPAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    FOREIGN KEY (ChangedBy) REFERENCES Users(UserId)
);

CREATE INDEX IX_AuditLogs_TableName ON AuditLogs(TableName);
CREATE INDEX IX_AuditLogs_RecordId ON AuditLogs(RecordId);
CREATE INDEX IX_AuditLogs_ChangedDate ON AuditLogs(ChangedDate);
CREATE INDEX IX_AuditLogs_ChangedBy ON AuditLogs(ChangedBy);
```

### Tax and Accounting

#### TaxRates
```sql
CREATE TABLE TaxRates (
    TaxRateId INT IDENTITY(1,1) PRIMARY KEY,
    TaxCode NVARCHAR(20) UNIQUE NOT NULL,
    TaxName NVARCHAR(100) NOT NULL,
    Rate DECIMAL(5,4) NOT NULL, -- e.g., 0.1000 for 10%
    IsActive BIT DEFAULT 1,
    EffectiveFrom DATETIME2 DEFAULT GETUTCDATE(),
    EffectiveTo DATETIME2 NULL,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE(),
    CreatedBy INT,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
```

#### AccountingCodes
```sql
CREATE TABLE AccountingCodes (
    AccountingCodeId INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(20) UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Type NVARCHAR(20) NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    Category NVARCHAR(50),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_AccountingCodes_Code ON AccountingCodes(Code);
CREATE INDEX IX_AccountingCodes_Type ON AccountingCodes(Type);
```

## Views

### Inventory Summary View
```sql
CREATE VIEW vw_InventorySummary AS
SELECT
    p.ProductId,
    p.ProductCode,
    p.ProductName,
    c.CategoryName,
    w.WarehouseId,
    w.WarehouseName,
    i.Quantity,
    i.AvailableQuantity,
    p.Unit,
    p.SalePrice,
    (i.Quantity * p.SalePrice) AS TotalValue,
    i.LastUpdated
FROM Products p
JOIN Categories c ON p.CategoryId = c.CategoryId
JOIN Inventory i ON p.ProductId = i.ProductId
JOIN Warehouses w ON i.WarehouseId = w.WarehouseId
WHERE p.IsActive = 1 AND w.IsActive = 1;
```

### Sales Summary View
```sql
CREATE VIEW vw_SalesSummary AS
SELECT
    YEAR(d.DocumentDate) AS Year,
    MONTH(d.DocumentDate) AS Month,
    COUNT(*) AS InvoiceCount,
    SUM(d.TotalAmount) AS TotalSales,
    SUM(d.TaxAmount) AS TotalTax,
    AVG(d.TotalAmount) AS AverageInvoice
FROM Documents d
WHERE d.DocumentType = 'SALES_INVOICE'
  AND d.Status = 'COMPLETED'
GROUP BY YEAR(d.DocumentDate), MONTH(d.DocumentDate);
```

## Stored Procedures

### Update Inventory Procedure
```sql
CREATE PROCEDURE sp_UpdateInventory
    @ProductId INT,
    @WarehouseId INT,
    @QuantityChange DECIMAL(18,2),
    @TransactionType NVARCHAR(20),
    @ReferenceType NVARCHAR(50),
    @ReferenceId INT,
    @UserId INT,
    @Notes NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentQuantity DECIMAL(18,2);
    DECLARE @NewQuantity DECIMAL(18,2);
    
    -- Get current quantity
    SELECT @CurrentQuantity = Quantity
    FROM Inventory
    WHERE ProductId = @ProductId AND WarehouseId = @WarehouseId;
    
    -- Calculate new quantity
    SET @NewQuantity = ISNULL(@CurrentQuantity, 0) + @QuantityChange;
    
    -- Update or insert inventory
    IF EXISTS (SELECT 1 FROM Inventory WHERE ProductId = @ProductId AND WarehouseId = @WarehouseId)
    BEGIN
        UPDATE Inventory
        SET Quantity = @NewQuantity,
            LastUpdated = GETUTCDATE(),
            UpdatedBy = @UserId
        WHERE ProductId = @ProductId AND WarehouseId = @WarehouseId;
    END
    ELSE
    BEGIN
        INSERT INTO Inventory (ProductId, WarehouseId, Quantity, LastUpdated, UpdatedBy)
        VALUES (@ProductId, @WarehouseId, @NewQuantity, GETUTCDATE(), @UserId);
    END
    
    -- Log transaction
    INSERT INTO InventoryTransactions (
        ProductId, WarehouseId, TransactionType, Quantity,
        PreviousQuantity, NewQuantity, ReferenceType, ReferenceId,
        CreatedBy, Notes
    )
    VALUES (
        @ProductId, @WarehouseId, @TransactionType, @QuantityChange,
        ISNULL(@CurrentQuantity, 0), @NewQuantity, @ReferenceType, @ReferenceId,
        @UserId, @Notes
    );
END
```

## Data Types and Constraints

- **Money Fields**: DECIMAL(18,2) for currency values
- **Quantity Fields**: DECIMAL(18,2) for precise quantities
- **Percentage Fields**: DECIMAL(5,4) for rates (0.0000 to 1.0000)
- **String Fields**: NVARCHAR with appropriate lengths
- **Date Fields**: DATETIME2 for high precision
- **Boolean Fields**: BIT for true/false values

## Backup and Recovery

- **Full Backup**: Weekly
- **Differential Backup**: Daily
- **Transaction Log Backup**: Every 15 minutes
- **Retention**: 30 days for daily backups, 1 year for weekly backups

## Performance Optimization

- **Partitioning**: Transaction tables partitioned by date
- **Archiving**: Old transaction data moved to archive tables
- **Indexing Strategy**: Covering indexes for common queries
- **Statistics**: Auto-update statistics enabled
- **Query Optimization**: Regular query performance monitoring