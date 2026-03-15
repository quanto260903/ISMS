# CAPSTONE PROJECT REPORT
## Report 5 – Software Test Documentation

– Hanoi, Jan 2025 –
## Table of Contents
I. Record of Changes        3
II. Testing Documentation        4
1. Scope of Testing        4
2. Test Strategy        4
2.1 Testing Types        4
2.2 Test Levels        4
2.3 Supporting Tools        4
3. Test Plan        4
3.1 Test Environment        4
3.2 Test Milestones        5
4. Test Cases        5
5. Test Reports        5


________________


## I. Record of Changes
Date
	A*
M, D
	In charge
	Change Description
	15/03






















































































































































	*A - Added M - Modified D - Deleted
________________


II. Testing Documentation
1. Scope of Testing
1.1 In-Scope Features
The testing scope covers all functional and non-functional components of the Inventory and Sales Management Solution for SMEs (ISMS). Core modules to be tested include:
Functional Scope
1. User Management
   1. User registration, login, logout
   2. Authentication result handling
   3. Role-based access control (Admin, Warehouse Keeper, Manager, Staff)
   4. Staff dashboard and admin dashboard displays
   5. Login credential validation
2. Product & Inventory Management
   1. Product creation, update, status change
   2. Product list and product detail view
   3. Product search functionality
   4. Real-time inventory tracking
   5. Available stock quantity checking
   6. Updated inventory quantity after transactions
   7. Stock in / stock out updates
   8. Inventory adjustment and discrepancy handling
   9. Adjustment document generation and tracking
   10. Warehouse inventory view
   11. Warehouse selection for inventory operations
   12. Item quantity data management
   13. Cycle count creation, execution, and approval
   14. Expiry management and near-expiration notifications
3. Inbound Operations
   1. Supplier selection for inbound orders
   2. Receiving list creation
   3. Inbound receipt processing
   4. Verifying received quantities
   5. Recording inbound receipt data
   6. Defect reporting / returned order handling
   7. Document code and status generation for inbound transactions
   8. Approval request submission for inbound operations
4. Outbound Operations
   1. Outbound order creation
   2. Order approval workflow
   3. Pick list generation
   4. Picking and packing workflow
   5. Delivery confirmation
   6. Order cancellation request
   7. Order amendment handling
   8. Transfer order creation between warehouses
   9. Cart management (add/remove items, update quantities)
   10. Discount application
   11. Customer selection for orders
   12. Sales invoice generation (invoice code and status)
   13. Payment processing (cash / bank transfer)
   14. Payment confirmation
   15. Sales total calculation (subtotal, discount, grand total)
5. Master Data Management (Admin)
   1. Product management
   2. Customer management
   3. Supplier management
   4. Warehouse management
   5. Product list and detail management
   6. Customer list and detail management
   7. Supplier list and detail management
   8. Warehouse list and detail management
   9. Operation result handling (success/error feedback)
6. Search & Reporting
   1. Product search
   2. Inventory report request
   3. Inbound–Outbound transaction reports
   4. Stock discrepancy reports
   5. Sales revenue reports (by day)
   6. Sales performance reports by product
   7. Best-selling products reports
   8. Profit reports
   9. Export reports to data files (report export)
   10. Activity logs
7. AI Voice Integration
   1. Voice-enabled product search
   2. Voice commands for retrieving inventory information
   3. Speech-to-text conversion for warehouse queries
   4. Voice-triggered stock check requests
Non-Functional Scope
1. Performance and responsiveness under typical warehouse load (~ 10 outbound orders/day, ~ 15–20 inbound shipments/year ~1000 items each)
2. Security: authentication, authorization, audit logs
3. Data accuracy and consistency between product, inventory, and transaction modules


1.2 Out-of-Scope
The following are not included in the current testing scope:
* Mobile application
* Integration with external accounting, payment,... systems
* Automated hardware testing (barcode scanner hardware, IoT devices)
* Real warehouse robotics or conveyor integrations
* Real cycle count with physical products
1.3 Testing Levels
1. Unit Testing
1. Performed by: Testers - Nguyen Thai Thuc Quyen, To Minh Quan
2. Focus:
   1. Individual functions, services using mock data
   2. Validation rules, business logic rules (e.g., reorder point triggers)
3. Inputs: Code modules, unit test scripts
4. Acceptance Criteria:
   1. All core functions pass with ≥ 90% success rate
   2. No critical or high-severity defects
2. Integration Testing
1. Performed by: Developers + Testers
2. Focus:
   1. Interaction between modules: Product ↔ Inventory, Inventory ↔ Orders
   2. Role-based access flows
   3. Workflow correctness (Receiving → Stock Update → Picking → Delivery)
3. Inputs: Integrated modules, test scenarios
4. Acceptance Criteria:
   1. Data consistency across modules
   2. All major workflows execute without interruption
   3. No blocker-level defects
3. System Testing
1. Performed by: Testers - Nguyen Thai Thuc Quyen
2. Focus:
   1. End-to-end processes under real warehouse scenarios
   2. Handling large inbound shipments (≈1000 products/batch)
   3. Processing 10 orders/day with full picking/packing workflows
3. Input: Full system in staging environment
4. Acceptance Criteria:
   1. System behaves correctly for all functional and non-functional requirements
   2. Key modules meet performance thresholds
   3. All critical defects resolved
1.4 Constraints & Assumptions
1. Testing will be based on simulated warehouse data representing:
   1. 15–20 inbound batches/year
   2. Each batch ~1000 products
   3. 10 outbound orders/day
2. Internet stability and warehouse Wi-Fi performance are assumed adequate
3. Hardware (PCs, scanners) provided by the warehouse team
4. Voice command functionality uses third-party AI APIs subject to their response time



2. Test Strategy
This Test Strategy defines the overall approach for verifying the quality of the Inventory and Sales Management Solution for SMEs (ISMS). It includes the selected testing types, test levels, test techniques, completion criteria, and tools applied throughout the project.
The strategy ensures that all functional and non-functional requirements—covering inbound operations, outbound operations, inventory management, cycle counts, user management, reporting, and the AI voice search module—are tested thoroughly before deployment.
Testing will be executed across Unit Testing, Integration Testing, and System Testing, with each level aligned to the project’s development iterations and deliverables.
Supporting test tools include:
* Visual Studio, NUnit, Moq for unit testing
* Postman for API-level functional and integration testing
* Microsoft SQL Server for database verification
* Google Sheets for test cases
* GitHub
Constraints and assumptions remain consistent with the project model—including simulated warehouse data reflecting inbound/outbound transaction volumes.


2.1 Testing Types
1. Functional Testing
Objective: Verify that all system features behave according to the Software Requirements Specification (SRS), including product management, stock updates, inbound/outbound workflows, search functions, and reporting.
Technique:
* Black-box testing
* Requirement-based test design
* Scenario testing using real warehouse workflows
Completion Criteria:
* All functional test cases executed
* 100% of critical and high-severity defects resolved
* Functional coverage ≥ 95%
2. Integration Testing
Objective: Ensure correct data flow and interaction between modules such as Product - Inventory, Inventory - Order, Order - Returned Orders, and Returned Orders - Stock Adjustment.
Technique:
* API testing via Postman
* Database validation
* Workflow sequence validation
Completion Criteria:
* All integrated workflows pass with consistent data
* No failed API endpoints
* No mismatch between UI-shown data and database records
Test Level: Performed at Integration Test Level after unit-tested modules are combined.
3. System Testing
Objective: Validate the entire system end-to-end under realistic warehouse operations, including inbound shipments (≈1000 products/batch), outbound order processing (≈10 orders/day), and cycle count operations.
Technique:
* End-to-end business scenario testing
* UI and process validation
* Realistic data simulation
Completion Criteria:
* All critical business processes executed successfully
* No critical or major defects remain
* System satisfies both functional and non-functional requirements
Test Level: Performed at System Test Level in staging/testing environment.
2.2 Test Levels
<List out and describe here the testing levels which you would execute in your project. Besides, clearly state the test types which are performed in each test level that you plan for this project>
Type of Tests
	Test Level
	Unit
	Integration
	System
	Acceptance
	API Testing
	X




UI/UX Testing

	X
	X


Integration Testing

	x
	X


Functional testing

	x




2.3 Supporting Tools
<List of the test supporting tools which will be employed for this project>
Purpose
	Tool
	Vendor/In-house
	Version
	API Testing
	Postman
	Vendor


	UI/UX Testing
	Chrome, Microsoft Edge
	Vendor
	Latest
	Integration Testing
	Chrome, Microsoft Edge, Selenium
	Vendor
	Latest
	Manage defects log, test cases
	Google Sheets
	Vendor
	Latest


3. Test Plan
3.1 Test Environment
[List and provide the details about the tools (software, hardware, infrastructure) which the project would use for testing. The information can be provided in the table format as below]
Purpose
	Tool
	Provider
	Version
	Write Test Cases 
	Google Sheet 
	Google
	Latest
	Write Test Report
	Documents
	Google Sheet,
Google Docs
	Google
	Latest
	Unit Test
	Visual Studio
	Microsoft
	2022
	API Testing
	Postman
	Postman
	v11
	System tests
	Chrome, Edge, Coc Coc
	Google, Microsoft 
	Latest


3.2 Test Milestones
[Separate test milestones, which should be identified to communicate project status accomplishments. The information can be provided in the table format as below]
Milestone Task
	Start Date
	End Date
	Iteration 1
	Unit Testing
	12/10/2025
	22/10/2025
	Integration Testing
	30/10/2025
	08/11/2025
	Iteration 2
	Unit Testing
	6/11/2025
	14/11/2025
	Integration Testing
	15/11/2025
	25/11/2025
	Iteration 3
	Unit Testing
	19/11/2025
	25/11/2025
	Integration Testing
	22/11/2025
	29/11/2025


4. Test Cases
4.1 Unit Test
Report5.1_UnitTest.xlsx
4.2 Integration Test
Report5.2_IntegrationTest.xlsx
4.3 System Test
Report5.3_System Test.xlsx


5. Test Reports
This Test Strategy defines the overall approach for verifying the quality of the Inventory and Sales Management Solution for SMEs (ISMS). It includes the selected testing types, test levels, test techniques, completion criteria, and tools applied throughout the project.
The strategy ensures that all functional and non-functional requirements—covering inbound operations, outbound operations, inventory management, cycle counts, user management, reporting, and the AI voice search module—are tested thoroughly before deployment.
Testing will be executed across Unit Testing, Integration Testing, and System Testing, with each level aligned to the project’s development iterations and deliverables.
