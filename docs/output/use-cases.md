# Use Cases

## Overview

This document describes the key use cases for the Inventory and Sales Management Solution for SMEs (ISMS). Use cases are organized by actor and feature area.

## Actors

- **Administrator**: System configuration, user management, master data setup
- **Manager**: Reporting, monitoring, business oversight
- **Warehouse Staff**: Daily warehouse operations, inventory management
- **Sales Staff**: Customer transactions, order processing
- **Purchasing Staff**: Supplier transactions, procurement

## Authentication Use Cases

### UC-01: User Registration
**Actor**: Guest User
**Description**: Allows new users to register accounts in the system
**Preconditions**: None
**Postconditions**: User account created and pending verification
**Main Flow**:
1. User accesses registration page
2. User provides required information (email, password, etc.)
3. System validates input
4. System creates account
5. System sends verification email

### UC-02: User Login
**Actor**: Registered User
**Description**: Authenticates users and grants system access
**Preconditions**: Valid user account exists
**Postconditions**: User authenticated and session established
**Main Flow**:
1. User enters credentials
2. System validates credentials
3. System establishes session
4. User redirected to dashboard

### UC-03: Password Reset
**Actor**: Registered User
**Description**: Allows password recovery via email verification
**Preconditions**: Valid email associated with account
**Postconditions**: Password reset and user notified

## Product Management Use Cases

### UC-04: Create Product
**Actor**: Administrator
**Description**: Adds new products to the system
**Preconditions**: User has admin privileges
**Postconditions**: Product added to catalog
**Main Flow**:
1. Admin selects "Add Product"
2. Admin enters product details
3. System validates data
4. Product saved to database

### UC-05: Update Product
**Actor**: Administrator
**Description**: Modifies existing product information
**Preconditions**: Product exists in system
**Postconditions**: Product information updated

### UC-06: Search Products
**Actor**: All Users
**Description**: Finds products by various criteria
**Preconditions**: Products exist in system
**Postconditions**: Matching products displayed

## Inventory Management Use Cases

### UC-07: View Stock Levels
**Actor**: Warehouse Staff, Manager
**Description**: Displays current inventory quantities
**Preconditions**: User has appropriate permissions
**Postconditions**: Stock information displayed

### UC-08: Stock Taking
**Actor**: Warehouse Staff
**Description**: Performs physical inventory count
**Preconditions**: Warehouse access authorized
**Postconditions**: Physical count recorded and compared to system

### UC-09: Inventory Adjustment
**Actor**: Warehouse Staff
**Description**: Corrects inventory discrepancies
**Preconditions**: Discrepancy identified
**Postconditions**: Inventory records updated

## Purchase Management Use Cases

### UC-10: Create Purchase Order
**Actor**: Purchasing Staff
**Description**: Initiates procurement from suppliers
**Preconditions**: Supplier and products defined
**Postconditions**: Purchase order created

### UC-11: Receive Goods
**Actor**: Warehouse Staff
**Description**: Records goods received from suppliers
**Preconditions**: Purchase order exists
**Postconditions**: Inventory increased, receipt recorded

### UC-12: Purchase Invoice
**Actor**: Purchasing Staff
**Description**: Records supplier invoices for payment
**Preconditions**: Goods received
**Postconditions**: Payables recorded

### UC-13: Purchase Return
**Actor**: Purchasing Staff
**Description**: Processes returns to suppliers
**Preconditions**: Valid purchase invoice exists
**Postconditions**: Inventory decreased, return recorded

## Sales Management Use Cases

### UC-14: Create Sales Order
**Actor**: Sales Staff
**Description**: Captures customer purchase requests
**Preconditions**: Customer and products defined
**Postconditions**: Sales order created

### UC-15: Create Sales Invoice
**Actor**: Sales Staff
**Description**: Records customer sales and revenue
**Preconditions**: Stock available, customer defined
**Postconditions**: Inventory decreased, receivables recorded

### UC-16: Sales Return
**Actor**: Sales Staff
**Description**: Processes customer returns
**Preconditions**: Valid sales invoice exists
**Postconditions**: Inventory increased, return recorded

## Payment Processing Use Cases

### UC-17: Record Payment
**Actor**: Sales/Purchasing Staff
**Description**: Records cash or bank payments
**Preconditions**: Outstanding invoice exists
**Postconditions**: Payment recorded, balances updated

### UC-18: Payment Reminder
**Actor**: System
**Description**: Notifies customers of overdue payments
**Preconditions**: Overdue receivables exist
**Postconditions**: Reminder sent

## Warehouse Operations Use Cases

### UC-19: Warehouse Transfer
**Actor**: Warehouse Staff
**Description**: Moves inventory between warehouses
**Preconditions**: Multiple warehouses configured
**Postconditions**: Inventory transferred between locations

### UC-20: Picking and Packing
**Actor**: Warehouse Staff
**Description**: Prepares orders for shipment
**Preconditions**: Sales order approved
**Postconditions**: Order ready for delivery

### UC-21: Shipping Confirmation
**Actor**: Warehouse Staff
**Description**: Records completed shipments
**Preconditions**: Order picked and packed
**Postconditions**: Order status updated to shipped

## Reporting Use Cases

### UC-22: Generate Sales Report
**Actor**: Manager
**Description**: Creates sales performance reports
**Preconditions**: Sales data exists
**Postconditions**: Report generated and available

### UC-23: Generate Inventory Report
**Actor**: Manager
**Description**: Creates inventory status reports
**Preconditions**: Inventory data exists
**Postconditions**: Report generated

### UC-24: Generate Financial Report
**Actor**: Manager
**Description**: Creates profit and loss statements
**Preconditions**: Transaction data exists
**Postconditions**: Financial report generated

## AI Voice Integration Use Cases

### UC-25: Voice Product Search
**Actor**: Warehouse Staff
**Description**: Searches products using voice commands
**Preconditions**: Voice recognition enabled
**Postconditions**: Search results displayed

### UC-26: Voice Inventory Query
**Actor**: Warehouse Staff
**Description**: Queries stock levels via voice
**Preconditions**: Voice recognition enabled
**Postconditions**: Inventory information provided

## System Administration Use Cases

### UC-27: User Management
**Actor**: Administrator
**Description**: Manages user accounts and permissions
**Preconditions**: Admin privileges
**Postconditions**: User accounts updated

### UC-28: System Configuration
**Actor**: Administrator
**Description**: Configures system settings
**Preconditions**: Admin privileges
**Postconditions**: System settings updated

### UC-29: View System Logs
**Actor**: Administrator
**Description**: Monitors system activity
**Preconditions**: Admin privileges
**Postconditions**: Logs displayed

## Use Case Diagram

```
[User] --> (Login)
[User] --> (Register)
[Admin] --> (User Management)
[Admin] --> (System Configuration)
[Manager] --> (Generate Reports)
[Warehouse Staff] --> (Receive Goods)
[Warehouse Staff] --> (Pick Orders)
[Sales Staff] --> (Create Sales Order)
[Sales Staff] --> (Process Payment)
[Purchasing Staff] --> (Create Purchase Order)
[Purchasing Staff] --> (Process Supplier Payment)
```

## Business Rules Referenced

- BR-01: Document numbers must be unique
- BR-02: Only one payment option can be selected
- BR-03: Document date defaults to current date
- BR-04: Invoice date defaults to document date
- BR-05: Search fields support key-press search
- BR-06: Historical data remains unchanged when master data updates
- BR-07: Opening balance calculation
- BR-08: Closing balance calculation
- BR-09: Inventory valuation using selling price
- BR-10: Product categories appear once per warehouse
- BR-11: Cash payment voucher ID = BH1
- BR-12: Bank payment voucher ID = BH2
- BR-13: Unpaid voucher ID = BH3