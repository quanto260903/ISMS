# Implementation Plan: Export Product from Warehouse

## Overview
This implementation plan addresses the gaps identified in the use case analysis for export functionality (2.2.1-2.2.11). The plan focuses on implementing missing business logic, inventory management, approval workflows, and quality assurance.

## Priority Classification

### Priority 1 (Critical) - Core Business Logic
**Timeline**: Sprint 1-2
**Risk**: High - Affects system integrity

### Priority 2 (High) - Workflow Management
**Timeline**: Sprint 3-4
**Risk**: Medium - Affects user workflows

### Priority 3 (Medium) - Reporting & UX
**Timeline**: Sprint 5-6
**Risk**: Low - Enhances usability

### Priority 4 (Low) - Advanced Features
**Timeline**: Sprint 7+
**Risk**: Low - Nice-to-have features

## Required Services & APIs

### Priority 1: Inventory Management Service

#### Backend Services
**IInventoryService** - Interface for inventory operations
```csharp
public interface IInventoryService
{
    Task<ResultModel<bool>> VerifyStockAsync(string goodsId, string warehouseId, decimal quantity);
    Task<ResultModel<bool>> UpdateStockAsync(string goodsId, string warehouseId, decimal quantity, string operation);
    Task<ResultModel<InventoryItem>> GetStockAsync(string goodsId, string warehouseId);
    Task<ResultModel<bool>> ReserveStockAsync(string goodsId, string warehouseId, decimal quantity, string referenceId);
    Task<ResultModel<bool>> ReleaseStockAsync(string referenceId);
}
```

**InventoryService** - Implementation
- Verify stock availability before export
- Update inventory quantities after successful export
- Handle stock reservations for pending exports
- Maintain inventory audit trail

#### API Endpoints
```
GET    /api/Inventory/{goodsId}/{warehouseId}     - Get current stock
POST   /api/Inventory/verify                       - Verify stock availability
PUT    /api/Inventory/update                       - Update stock levels
POST   /api/Inventory/reserve                      - Reserve stock for export
DELETE /api/Inventory/reserve/{referenceId}       - Release stock reservation
```

### Priority 1: Export Workflow Service

#### Backend Services
**IExportWorkflowService** - Handle approval and status management
```csharp
public interface IExportWorkflowService
{
    Task<ResultModel<bool>> SubmitForApprovalAsync(string voucherId, string submittedBy);
    Task<ResultModel<bool>> ApproveExportAsync(string voucherId, string approvedBy);
    Task<ResultModel<bool>> RejectExportAsync(string voucherId, string rejectedBy, string reason);
    Task<ResultModel<bool>> CancelExportAsync(string voucherId, string cancelledBy, string reason);
    Task<ResultModel<ExportStatus>> GetExportStatusAsync(string voucherId);
}
```

**ExportStatusService** - Status tracking and validation
- Manage export statuses: Draft, PendingApproval, Approved, Rejected, Completed, Cancelled
- Validate state transitions
- Send notifications to relevant users

#### API Endpoints
```
POST   /api/Export/{voucherId}/submit             - Submit for approval
POST   /api/Export/{voucherId}/approve            - Approve export
POST   /api/Export/{voucherId}/reject             - Reject export
POST   /api/Export/{voucherId}/cancel             - Cancel export
GET    /api/Export/{voucherId}/status             - Get export status
GET    /api/Export/pending-approval               - Get pending approvals
```

### Priority 2: Order Integration Service

#### Backend Services
**IOrderIntegrationService** - Link exports to customer orders
```csharp
public interface IOrderIntegrationService
{
    Task<ResultModel<OrderDetails>> GetOrderDetailsAsync(string orderId);
    Task<ResultModel<bool>> ValidateOrderForExportAsync(string orderId);
    Task<ResultModel<bool>> LinkExportToOrderAsync(string voucherId, string orderId);
    Task<ResultModel<bool>> UpdateOrderStatusAsync(string orderId, OrderStatus status);
}
```

#### API Endpoints
```
GET    /api/Orders/{orderId}                       - Get order details
POST   /api/Export/{voucherId}/link-order/{orderId} - Link export to order
PUT    /api/Orders/{orderId}/status                - Update order status
```

### Priority 2: Document Management Service

#### Backend Services
**IDocumentService** - Handle printing and document generation
```csharp
public interface IDocumentService
{
    Task<ResultModel<byte[]>> GenerateExportReceiptPdfAsync(string voucherId);
    Task<ResultModel<byte[]>> GenerateExportReportExcelAsync(ExportReportRequest request);
    Task<ResultModel<bool>> PrintDocumentAsync(string voucherId, string printerId);
}
```

#### API Endpoints
```
GET    /api/Documents/export-receipt/{voucherId}/pdf    - Generate PDF receipt
GET    /api/Documents/export-report/excel              - Generate Excel report
POST   /api/Documents/print/{voucherId}                - Print document
```

### Priority 3: Advanced Search Service

#### Backend Services
**IExportSearchService** - Enhanced search capabilities
```csharp
public interface IExportSearchService
{
    Task<ResultModel<PagedResult<ExportSearchResult>>> SearchExportsAsync(ExportSearchRequest request);
    Task<ResultModel<List<string>>> GetSearchSuggestionsAsync(string keyword, SearchField field);
}
```

#### API Endpoints
```
GET    /api/Export/search                          - Advanced search
GET    /api/Export/suggestions/{field}            - Search suggestions
```

## Database Schema Updates

### New Tables
```sql
-- Export approval workflow
CREATE TABLE ExportApprovals (
    ApprovalId UNIQUEIDENTIFIER PRIMARY KEY,
    VoucherId NVARCHAR(50) NOT NULL,
    SubmittedBy NVARCHAR(100) NOT NULL,
    SubmittedDate DATETIME2 NOT NULL,
    ApprovedBy NVARCHAR(100),
    ApprovedDate DATETIME2,
    RejectedBy NVARCHAR(100),
    RejectedDate DATETIME2,
    RejectionReason NVARCHAR(500),
    Status NVARCHAR(20) NOT NULL, -- Pending, Approved, Rejected
    FOREIGN KEY (VoucherId) REFERENCES Vouchers(VoucherId)
);

-- Inventory reservations
CREATE TABLE InventoryReservations (
    ReservationId UNIQUEIDENTIFIER PRIMARY KEY,
    GoodsId NVARCHAR(50) NOT NULL,
    WarehouseId NVARCHAR(50) NOT NULL,
    Quantity DECIMAL(18,2) NOT NULL,
    ReferenceId NVARCHAR(100) NOT NULL, -- VoucherId or OrderId
    ReferenceType NVARCHAR(20) NOT NULL, -- Export, Order
    ReservedDate DATETIME2 NOT NULL,
    ReleasedDate DATETIME2,
    Status NVARCHAR(20) NOT NULL, -- Active, Released
    FOREIGN KEY (GoodsId) REFERENCES Goods(GoodsId),
    FOREIGN KEY (WarehouseId) REFERENCES Warehouses(WarehouseId)
);

-- Order-Export linkage
CREATE TABLE OrderExports (
    LinkId UNIQUEIDENTIFIER PRIMARY KEY,
    OrderId NVARCHAR(50) NOT NULL,
    VoucherId NVARCHAR(50) NOT NULL,
    LinkedDate DATETIME2 NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId),
    FOREIGN KEY (VoucherId) REFERENCES Vouchers(VoucherId)
);
```

### Updated Tables
```sql
-- Add status column to Vouchers
ALTER TABLE Vouchers ADD Status NVARCHAR(20) DEFAULT 'Draft';

-- Add approval workflow columns
ALTER TABLE Vouchers ADD RequiresApproval BIT DEFAULT 0;
ALTER TABLE Vouchers ADD ApprovedBy NVARCHAR(100);
ALTER TABLE Vouchers ADD ApprovedDate DATETIME2;
```

## Frontend Implementation Plan

### Priority 1: Inventory Integration
- Add stock verification before export creation
- Real-time inventory updates
- Stock reservation UI for pending exports
- Inventory alerts and warnings

### Priority 2: Approval Workflow UI
- Approval dashboard for managers
- Status indicators on export lists
- Approval/rejection actions
- Notification system

### Priority 2: Order Integration UI
- Order selection in export creation
- Order details display
- Order status updates
- Order-export linking

### Priority 3: Document Management UI
- Print preview functionality
- PDF generation and download
- Excel export for reports
- Document templates

### Priority 3: Enhanced Search UI
- Advanced search filters
- Search suggestions
- Saved search queries
- Export search results

## Unit Test Implementation

### Service Layer Tests
```csharp
[TestFixture]
public class ExportServiceTests
{
    [Test]
    public async Task CreateExport_WithValidData_ShouldSucceed()
    [Test]
    public async Task CreateExport_WithInsufficientStock_ShouldFail()
    [Test]
    public async Task ApproveExport_WithValidApproval_ShouldUpdateStatus()
    [Test]
    public async Task CancelExport_ShouldRestoreInventory()
}
```

### API Layer Tests
```csharp
[TestFixture]
public class ExportControllerTests
{
    [Test]
    public async Task PostCreateExport_ValidRequest_ReturnsCreated()
    [Test]
    public async Task PutUpdateExport_InvalidId_ReturnsBadRequest()
    [Test]
    public async Task GetExportList_WithFilters_ReturnsFilteredResults()
}
```

### Integration Tests
```csharp
[TestFixture]
public class ExportWorkflowIntegrationTests
{
    [Test]
    public async Task FullExportWorkflow_CompleteProcess_UpdatesAllSystems()
    [Test]
    public async Task ExportWithOrder_OrderStatusUpdatesCorrectly()
}
```

## Implementation Timeline

### Sprint 1: Inventory Management Foundation
- Implement IInventoryService and InventoryService
- Add inventory verification to export creation
- Create inventory API endpoints
- Unit tests for inventory service

### Sprint 2: Export Workflow Core
- Implement IExportWorkflowService
- Add approval workflow to export process
- Update export status management
- Database schema updates

### Sprint 3: Order Integration
- Implement IOrderIntegrationService
- Add order selection to export UI
- Order status updates
- Integration tests

### Sprint 4: Document Management
- Implement IDocumentService
- Add print and PDF generation
- Excel export functionality
- Document UI components

### Sprint 5: Enhanced Search & Reporting
- Implement advanced search service
- Add search UI components
- Report generation improvements
- Performance optimization

### Sprint 6: Quality Assurance
- Complete unit test coverage
- Integration testing
- Performance testing
- Security review

## Success Criteria

### Functional Completeness
- [ ] All use cases 2.2.1-2.2.11 fully implemented
- [ ] Inventory accuracy maintained
- [ ] Approval workflow functional
- [ ] All CRUD operations working
- [ ] Reporting and export features available

### Quality Metrics
- [ ] Unit test coverage > 90% for service layer
- [ ] Integration tests pass for all workflows
- [ ] Performance: < 2s response time for typical operations
- [ ] Security: All endpoints properly authorized

### User Acceptance
- [ ] Warehouse staff can complete full export workflow
- [ ] Managers can approve/reject requests
- [ ] Inventory updates correctly
- [ ] Reports generate accurately

## Risk Mitigation

### Technical Risks
- **Data Consistency**: Implement database transactions for multi-table updates
- **Performance**: Add database indexes and caching for frequently accessed data
- **Concurrency**: Use optimistic locking for inventory updates

### Business Risks
- **Inventory Accuracy**: Implement double-check mechanisms and audit trails
- **Workflow Interruptions**: Add error recovery and manual override capabilities
- **User Adoption**: Provide training and clear documentation

## Dependencies

### External Dependencies
- PDF generation library (iTextSharp or similar)
- Excel export library (EPPlus or similar)
- Print service integration

### Internal Dependencies
- User management system for approvals
- Notification system for workflow updates
- Audit logging system

## Monitoring & Maintenance

### Key Metrics
- Export transaction success rate
- Inventory discrepancy reports
- Approval workflow completion time
- System performance under load

### Maintenance Tasks
- Regular inventory reconciliation
- Cleanup of old reservations
- Archive completed transactions
- Update document templates

## Conclusion

This implementation plan provides a comprehensive roadmap to address all identified gaps in the export functionality. By following the priority-based approach, the system will achieve production readiness while maintaining code quality and user experience standards.</content>
<parameter name="filePath">d:\Quyen\ISMS\_bmad-output\implementation-artifacts\implementation-plan.md
