# Product Requirement Document (PRD)

## I. Record of Changes

| Date       | A* | M | D | In charge   | Change Description |
|------------|----|---|---|-------------|-------------------|
| 15/03/2026 | A  |   |   | QuyenNTT   | Generated PRD from project reports, formatted spacing, corrected typos, translated Vietnamese comments to English |

*A - Added M - Modified D - Deleted

## 1. Introduction

The Inventory and Sales Management Solution for SMEs (ISMS) is a web-based software system designed to support warehouse management, sales, purchasing, and basic accounting operations for small and medium-sized enterprises (SMEs). The system provides a centralized platform to manage inventory, purchase and sales transactions, customer and supplier information, payments, and related financial records. By integrating warehouse operations with purchasing and sales workflows, ISMS enables businesses to maintain accurate stock levels, monitor financial obligations, and generate management reports efficiently.

The primary purpose of ISMS is to design and implement a structured and reliable software solution that improves data accuracy, operational efficiency, and traceability of warehouse-related transactions. The system supports multiple types of business documents, including purchase invoices, sales invoices, stock transfers, inventory adjustments, and payment records, while preserving historical data for auditing and reconciliation purposes.

The system is developed as an academic software engineering project, with the objective of applying modern web technologies, structured system analysis, and database design principles to a real-world warehouse and business management scenario.

## 2. Objectives

- Provide centralized management of warehouse inventory across one or multiple warehouses.
- Support complete purchase and sales workflows, including orders, invoices, returns, and payments.
- Maintain accurate inventory balances through real-time stock updates.
- Preserve historical transaction data using document-based data snapshots for auditing and traceability.
- Manage customer and supplier balances, including receivables and payables.
- Support role-based access control for administrators, managers, and operational staff.
- Generate operational and financial reports such as inventory summaries, sales reports, and debt reports.
- Integrate AI voice search for product queries and inventory information retrieval.

## 3. Features

### F-01 Product Management
This feature manages product master data used throughout the system.
Functions include:
- Create, update, and maintain product information (product code, name, category, unit, purchase price, sale price, tax rate).
- Activate or deactivate products.
- View product details and related transaction history.

Key value: Provides a consistent and reliable data foundation for inventory, purchasing, and sales operations.

### F-02 Inventory Management
This feature supports real-time monitoring and control of inventory quantities across one or multiple warehouses.
Functions include:
- View current stock levels by product and warehouse.
- Automatically update inventory through purchase, sales, return, transfer, and inventory adjustment transactions.
- Track inventory movement history for auditing and reconciliation purposes.

Key value: Ensures inventory accuracy, transparency, and traceability of stock movements.

### F-03 Purchase Management
This feature manages purchasing activities and inbound warehouse transactions.
Functions include:
- Create and manage purchase orders.
- Create purchase invoices with supplier and goods information.
- Record purchase returns.
- Update inventory quantities based on approved purchase documents.

Key value: Supports controlled and auditable inbound inventory processes while ensuring accurate recording of purchase transactions.

### F-04 Sales Management
This feature manages sales activities and outbound warehouse transactions.
Functions include:
- Create and manage sales orders.
- Create sales invoices for goods issuance.
- Record sales returns.
- Validate stock availability before confirming sales transactions.
- Deduct inventory quantities upon invoice confirmation.

Key value: Prevents stock shortages and ensures accurate recording of revenue-related transactions.

### F-05 Partner Management
This feature manages customer and supplier information used throughout the system.
Functions include:
- Create and update customer and supplier profiles.
- Manage partner categories.
- Activate or deactivate partners for operational use.

Key value: Ensures consistent and reliable partner data for purchasing, sales, and payment operations.

### F-06 Payment and Debt Management
This feature supports the management of cash flow, receivables, and payables.
Functions include:
- Record customer payments and supplier payments.
- Support cash and bank payment methods.
- Track outstanding receivables and payables.
- View detailed and summary debt reports.

Key value: Improves financial transparency and supports effective cash flow management.

### F-07 Warehouse Transfer and Adjustment
This feature supports internal warehouse operations.
Functions include:
- Create and manage stock transfer documents between warehouses.
- Perform inventory adjustments and stocktaking.
- Record inventory discrepancies and adjustment reasons.

Key value: Ensures accurate inventory records across multiple storage locations.

### F-08 Reporting and Business Monitoring
This feature provides reporting capabilities for warehouse and business operations.
Functions include:
- Generate inventory reports (summary and detailed).
- Generate purchase and sales reports.
- Generate receivable and payable reports.
- Support data export for accounting and compliance purposes.

Key value: Supports operational monitoring, management reporting, and compliance with tax and regulatory requirements.

### F-09 User and System Management
This feature ensures secure and controlled system operation.
Functions include:
- Manage user accounts and role-based access control.
- Configure system parameters and master settings.
- View system activity logs for auditing and accountability.

Key value: Ensures system security, data integrity, and maintainability.

### F-10 AI Voice Integration
This feature enables voice-based interactions for inventory queries.
Functions include:
- Voice-enabled product search.
- Voice commands for retrieving inventory information.
- Speech-to-text conversion for warehouse queries.
- Voice-triggered stock check requests.

Key value: Enhances user experience and accessibility for warehouse operations.

## 4. Functional Requirements

### User Authentication
- User registration, login, logout.
- Authentication result handling.
- Role-based access control (Admin, Warehouse Keeper, Manager, Staff).
- Staff dashboard and admin dashboard displays.
- Login credential validation.

### Product & Inventory Management
- Product creation, update, status change.
- Product list and product detail view.
- Product search functionality.
- Real-time inventory tracking.
- Available stock quantity checking.
- Updated inventory quantity after transactions.
- Stock in/stock out updates.
- Inventory adjustment and discrepancy handling.
- Adjustment document generation and tracking.
- Warehouse inventory view.
- Warehouse selection for inventory operations.
- Item quantity data management.
- Cycle count creation, execution, and approval.
- Expiry management and near-expiration notifications.

### Inbound Operations
- Supplier selection for inbound orders.
- Receiving list creation.
- Inbound receipt processing.
- Verifying received quantities.
- Recording inbound receipt data.
- Defect reporting/returned order handling.
- Document code and status generation for inbound transactions.
- Approval request submission for inbound operations.

### Outbound Operations
- Outbound order creation.
- Order approval workflow.
- Pick list generation.
- Picking and packing workflow.
- Delivery confirmation.
- Order cancellation request.
- Order amendment handling.
- Transfer order creation between warehouses.
- Cart management (add/remove items, update quantities).
- Discount application.
- Customer selection for orders.
- Sales invoice generation (invoice code and status).
- Payment processing (cash/bank transfer).
- Payment confirmation.
- Sales total calculation (subtotal, discount, grand total).

### Master Data Management (Admin)
- Product management.
- Customer management.
- Supplier management.
- Warehouse management.
- Product list and detail management.
- Customer list and detail management.
- Supplier list and detail management.
- Warehouse list and detail management.
- Operation result handling (success/error feedback).

### Search & Reporting
- Product search.
- Inventory report request.
- Inbound-Outbound transaction reports.
- Stock discrepancy reports.
- Sales revenue reports (by day).
- Sales performance reports by product.
- Best-selling products reports.
- Profit reports.
- Export reports to data files (report export).
- Activity logs.

## 5. Non-Functional Requirements

### Performance and Responsiveness
- Under typical warehouse load (~10 outbound orders/day, ~15–20 inbound shipments/year ~1000 items each).

### Security
- Authentication, authorization, audit logs.

### Data Accuracy and Consistency
- Between product, inventory, and transaction modules.

### Usability
- User-friendly interface for non-accounting users.
- Minimal learning curve.

### Performance
- Response times for transactions (average, maximum).
- Throughput: transactions per second.
- Capacity: number of customers or transactions.
- Resource utilization: memory, disk, communications.

## 6. User Stories

### As a Warehouse Staff
- I want to create inward vouchers so that goods received can be recorded.
- I want to view inward voucher lists with filtering.
- I want to update inward vouchers for corrections.

### As a Sales Staff
- I want to add new sales so that customer transactions are recorded.
- I want to check inventory before selling.
- I want to generate invoices.

### As a Manager
- I want to view inventory summaries.
- I want to generate sales reports.
- I want to monitor activity logs.

### As an Admin
- I want to manage VAT tax rates.
- I want to enter initial balances.
- I want to manage user accounts.

## 7. Acceptance Criteria

### Functional Testing
- All functional test cases executed.
- 100% of critical and high-severity defects resolved.
- Functional coverage ≥ 95%.

### Integration Testing
- Data consistency across modules.
- All major workflows execute without interruption.
- No blocker-level defects.

### System Testing
- End-to-end processes under real warehouse scenarios.
- Handling large inbound shipments (≈1000 products/batch).
- Processing 10 orders/day with full picking/packing workflows.
- All critical defects resolved.
- System satisfies functional and non-functional requirements.

### Unit Testing
- All core functions pass with ≥ 90% success rate.
- No critical or high-severity defects.

## 8. Business Rules

- Document Number must be unique.
- Only one payment option can be selected.
- Document Date defaults to current date.
- Invoice Date defaults to Document Date.
- Supplier and Item fields must support search-on-key-press.
- Historical supplier data must not change when master data is updated.
- Opening balance is calculated based on inventory quantities before the From Date.
- Closing balance is calculated as: On hand items Quantity + Inward Quantity − Outward Quantity.
- Inventory values are calculated using the selling unit price.
- Each product category appears only once per warehouse table.
- If pay by cash, voucherID = BH1.
- If pay by bank, voucherID = BH2.
- If unpaid, voucherID = BH3.

## 9. System Messages

- MSG01: No search results.
- MSG09: Incorrect username or password. Please check again.
- MSG10: The field is required.
- MSG11: Email has not been verified.
- MSG12: Account is blocked/inactive.
- MSG13: Account locked for 30 minutes due to multiple failed attempts.

## 10. Constraints & Assumptions

- Testing based on simulated warehouse data: 15–20 inbound batches/year, each ~1000 products, 10 outbound orders/day.
- Internet stability and warehouse Wi-Fi assumed adequate.
- Hardware (PCs, scanners) provided by warehouse team.
- Voice command functionality uses third-party AI APIs subject to their response time.

## 11. Limitations & Exclusions

- LI-01: Supports standard workflows; customized processes may require manual adaptation.
- LI-02: Inventory updates depend on user-confirmed transactions.
- LI-03: Supports logical warehouse management but not real-time physical tracking.
- LI-04: Performance may decrease with large volumes or concurrent users.
- LI-05: Financial calculations support household businesses under revenue-based tax.
- EX-01: Advanced accounting functions excluded.
- EX-02: Automatic tax declaration and electronic invoice integration excluded.
- EX-03: Integration with external systems excluded.
- EX-04: Transportation management excluded.
- EX-05: Offline usage excluded.
