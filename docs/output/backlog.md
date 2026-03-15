# Product Backlog

## Overview

This document captures the product backlog derived from the PRD (docs/output/prd.md) and the current implementation status (as of March 15, 2026). It focuses on the missing/partial features identified in the gap analysis and organizes work into epics, user stories, and prioritized delivery.

## Backlog Structure

- **Epics** represent major feature areas aligned with PRD sections.
- **User Stories** describe functional requirements from a user perspective.
- **Status** tags indicate whether the story is already implemented or still required.
- **Priority** is used to drive implementation order based on business risk and impact.

---

## Epic 1: User Authentication and Authorization [COMPLETED]

### Stories
- **US-AUTH-01** [DONE]: As a user, I want to register a new account so that I can access the system.
- **US-AUTH-02** [DONE]: As a user, I want to login with username/password so that I can securely access my account.
- **US-AUTH-03** [TODO]: As a user, I want to reset my password via email so that I can recover access if forgotten.
- **US-AUTH-04** [DONE]: As a user, I want to logout so that my session is securely ended.
- **US-AUTH-05** [DONE]: As an admin, I want to manage user roles (Admin, Manager, Staff) so that access is controlled.
- **US-AUTH-06** [DONE]: As the system, I want to validate login credentials so that only authorized users access the system.

---

## Epic 2: Product Management [COMPLETED]

### Stories
- **US-PROD-01** [DONE]: As an admin, I want to create new products so that they can be sold/purchased.
- **US-PROD-02** [DONE]: As an admin, I want to update product information so that data stays current.
- **US-PROD-03** [DONE]: As an admin, I want to deactivate products so that discontinued items don't appear.
- **US-PROD-04** [DONE]: As a user, I want to search products by code/name so that I can quickly find items.
- **US-PROD-05** [DONE]: As a user, I want to view product details so that I can see complete information.
- **US-PROD-06** [DONE]: As an admin, I want to manage product categories so that items are properly classified.

---

## Epic 3: Inventory Management [COMPLETED]

### Stories
- **US-INV-01** [DONE]: As a warehouse staff, I want to view current stock levels so that I know what's available.
- **US-INV-02** [DONE]: As the system, I want to automatically update inventory on transactions so that stock is always accurate.
- **US-INV-03** [DONE]: As a manager, I want to view inventory history so that I can track stock movements.
- **US-INV-04** [DONE]: As a warehouse staff, I want to perform stocktaking so that physical inventory matches system records.
- **US-INV-05** [DONE]: As a manager, I want to generate inventory reports so that I can monitor stock status.
- **US-INV-06** [DONE]: As the system, I want to track inventory by warehouse so that multi-location stock is managed.

---

## Epic 4: Purchase Management [PARTIALLY IMPLEMENTED]

### Stories
- **US-PUR-01** [DONE]: As a purchasing staff, I want to create purchase orders so that I can request goods from suppliers.
- **US-PUR-02** [DONE]: As a warehouse staff, I want to receive goods against purchase orders so that inventory is updated.
- **US-PUR-03** [DONE]: As a purchasing staff, I want to create purchase invoices so that supplier payments are recorded.
- **US-PUR-04** [TODO]: As a purchasing staff, I want to process purchase returns so that incorrect deliveries are handled.
- **US-PUR-05** [TODO]: As a manager, I want to track supplier payables so that I know outstanding amounts.
- **US-PUR-06** [DONE]: As an admin, I want to manage supplier master data so that supplier information is maintained.

---

## Epic 5: Sales Management [PARTIALLY IMPLEMENTED]

### Stories
- **US-SALE-01** [DONE]: As a sales staff, I want to create sales orders so that customer requests are captured.
- **US-SALE-02** [DONE]: As a sales staff, I want to create sales invoices so that revenue is recorded.
- **US-SALE-03** [TODO]: As a sales staff, I want to process sales returns so that customer returns are handled.
- **US-SALE-04** [DONE]: As the system, I want to check stock availability before sales so that overselling is prevented.
- **US-SALE-05** [TODO]: As a sales staff, I want to apply discounts so that special pricing is supported.
- **US-SALE-06** [TODO]: As a manager, I want to track customer receivables so that I know outstanding amounts.

---

## Epic 6: Payment & Debt Management [NOT IMPLEMENTED]

### Stories
- **US-PAY-01** [TODO, HIGH]: As a sales staff, I want to record cash payments so that customer payments are tracked.
- **US-PAY-02** [TODO, HIGH]: As a sales staff, I want to record bank payments so that electronic payments are tracked.
- **US-PAY-03** [TODO, HIGH]: As a purchasing staff, I want to record supplier payments so that payables are managed.
- **US-PAY-04** [TODO, HIGH]: As a manager, I want to view receivables/payables reports so that I can monitor outstanding balances.
- **US-PAY-05** [TODO, HIGH]: As a manager, I want to view cash flow reports so that I can monitor financial position.
- **US-PAY-06** [TODO, MEDIUM]: As the system, I want to support multiple payment methods so that different payment types are handled.

---

## Epic 7: Warehouse Transfer & Fulfillment [PARTIALLY IMPLEMENTED]

### Stories
- **US-WH-01** [TODO, HIGH]: As a warehouse staff, I want to transfer stock between warehouses so that goods can be moved.
- **US-WH-02** [DONE]: As a warehouse staff, I want to perform inventory adjustments so that discrepancies are corrected.
- **US-WH-03** [TODO, HIGH]: As a warehouse staff, I want to create picking lists so that order fulfillment is efficient.
- **US-WH-04** [TODO, HIGH]: As a warehouse staff, I want to confirm shipments so that orders are completed.
- **US-WH-05** [TODO, MEDIUM]: As a manager, I want to track warehouse performance so that efficiency is monitored.

---

## Epic 8: Reporting & Business Monitoring [PARTIALLY IMPLEMENTED]

### Stories
- **US-REP-01** [DONE]: As a manager, I want to generate sales reports so that I can analyze revenue trends.
- **US-REP-02** [DONE]: As a manager, I want to generate purchase reports so that I can analyze spending patterns.
- **US-REP-03** [DONE]: As a manager, I want to generate inventory reports so that I can monitor stock levels.
- **US-REP-04** [TODO, HIGH]: As a manager, I want to generate receivable/payable reports so that I can track outstanding customer and supplier balances.
- **US-REP-05** [TODO, HIGH]: As a manager, I want to generate cash flow and profit reports so that I can assess business health.
- **US-REP-06** [TODO, MEDIUM]: As a manager, I want to view dashboard summaries so that I can quickly see key metrics.
- **US-REP-07** [TODO, MEDIUM]: As a user, I want to export reports (Excel/CSV) so that I can share data externally.

---

## Epic 9: AI Voice Integration [PARTIALLY IMPLEMENTED / MISMATCH]

### Stories
- **US-AI-01** [DONE]: As a warehouse staff, I want to search products by voice so that hands-free operation is possible.
- **US-AI-02** [DONE]: As a warehouse staff, I want to query inventory levels by voice so that I can get quick answers.
- **US-AI-03** [DONE]: As the system, I want to convert speech to text so that voice commands are processed.
- **US-AI-04** [TODO, MEDIUM]: As the system, I want to provide voice responses so that users get audio feedback.
- **US-AI-05** [TODO, MEDIUM]: As a product owner, I want the system to use an AI voice service (not just browser SpeechRecognition) so that voice interactions are reliable and consistent across browsers.
- **US-AI-06** [TODO, MEDIUM]: As a user, I want a dedicated AI Search page so that voice search and results are grouped in a consistent UI.

---

## Epic 10: System Administration [PARTIALLY IMPLEMENTED]

### Stories
- **US-ADMIN-01** [TODO, HIGH]: As an admin, I want to manage system settings so that the system is configured properly.
- **US-ADMIN-02** [DONE]: As an admin, I want to view system logs so that I can monitor system activity.
- **US-ADMIN-03** [TODO, HIGH]: As an admin, I want to manage tax rates so that calculations are accurate.
- **US-ADMIN-04** [DONE]: As an admin, I want to enter initial balances so that the system starts with correct data.
- **US-ADMIN-05** [TODO, HIGH]: As an admin, I want to perform period-end closing so that historical data is locked.
- **US-ADMIN-06** [TODO, MEDIUM]: As an admin, I want to manage user access policies (password rules, session timeouts) so that security is enforced.

---

## Development Priorities

### Critical (Must Have)
- Payment & debt management (receivables/payables, payment entries, cash flow)
- Warehouse transfer & fulfillment workflows (transfers, picking, shipping confirmation)
- Reporting for financial health (receivables/payables, cash flow, profit)
- System administration controls (tax rates, settings, period close)

### High (Next)
- Complete purchase/sales returns workflows
- Implement customer receivables tracking and supplier payables tracking
- Deliver dedicated AI voice search page and voice response capability

### Medium (Backlog)
- Advanced reporting/dashboard summaries
- Support multiple payment methods and payment reconciliation
- Warehouse performance tracking and analytics
- Enhance AI voice integration with external AI voice services

### Low (Optional)
- Mobile-first UI and offline capabilities
- Integration with external accounting or ERP systems
- Advanced forecasting and demand planning

---

## Acceptance Criteria Template

**Given** [context]
**When** [action]
**Then** [expected outcome]

---

## Definition of Done

- Code written and unit tested
- Code reviewed and approved
- Integration tested
- System tested
- Documentation updated
- Acceptance criteria met
- No critical defects
