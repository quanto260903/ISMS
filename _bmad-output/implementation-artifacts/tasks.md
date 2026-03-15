# Implementation Task Breakdown

This document breaks the overall implementation plan into concrete development and testing tasks, organized by backend, frontend, and testing efforts. Dependencies are called out for each work stream.

---

## 1. Backend Development Tasks

### 1.1 Auth & Password Reset

1. **B1 — Data model & persistence**
   - Add `PasswordResetToken` entity to `AppBackend.BusinessObjects/Models`
   - Add `DbSet<PasswordResetToken>` to EF Core `DbContext`
   - Create EF migration
2. **B2 — Repository methods**
   - Create `IUserRepository` additions (or new `IPasswordResetRepository`) for token CRUD
   - Implement `CreatePasswordResetTokenAsync`, `GetValidPasswordResetTokenAsync`, `InvalidatePasswordResetTokenAsync`
3. **B3 — Service layer**
   - Add `RequestPasswordResetAsync`, `ConfirmPasswordResetAsync`, and (if missing) `ChangePasswordAsync` to `IAuthService`/`AuthService`
   - Extend `IEmailService`/`EmailService` with `SendPasswordResetEmailAsync`
4. **B4 — API layer**
   - Implement `RequestPasswordReset` and `ConfirmPasswordReset` in `AuthController`

**Dependencies:** B1 → B2 → B3 → B4

---

### 1.2 System Settings & Tax Rates

1. **B5 — Data models & persistence**
   - Add `SystemSetting`, `TaxRate`, `PeriodCloseLog` entities
   - Add corresponding `DbSet<>` and migration
2. **B6 — Repository layer**
   - Implement `ISystemSettingsRepository` / `ISettingsRepository` methods for settings, tax rates, and period close logs
3. **B7 — Service layer**
   - Implement `ISettingsService`/`SettingsService` methods (`GetSettingsAsync`, `UpdateSettingsAsync`, etc.)
4. **B8 — API layer**
   - Implement `SystemSettingsController` endpoints (get/update settings, tax rates, close period)

**Dependencies:** B5 → B6 → B7 → B8

---

### 1.3 Purchase Returns & Payables

1. **B9 — Data models & persistence**
   - Add `PayableTransaction` (or extend existing Transaction model)
   - Add any necessary supplier/payable reference entities
2. **B10 — Repository layer**
   - Implement `IPayableRepository` with list/detail/balance update methods
3. **B11 — Service layer**
   - Implement `IPayableService`/`PayableService` methods
4. **B12 — API layer**
   - Create `PayableController` (if new) and/or extend `ImportController` endpoints for returns/payables

**Dependencies:** B9 → B10 → B11 → B12

---

### 1.4 Sales Returns, Discounts & Receivables

1. **B13 — Data models & persistence**
   - Add `ReceivableTransaction` and related entities for discounts/returns
2. **B14 — Repository layer**
   - Implement `IReceivableRepository` methods
3. **B15 — Service layer**
   - Implement `IReceivableService`/`ReceivableService` methods and update `IExportService`/`ExportService` for returns/discounts/shipment
4. **B16 — API layer**
   - Implement `ExportController` endpoints for returns, shipment confirmation, and status

**Dependencies:** B13 → B14 → B15 → B16

---

### 1.5 Payments & Cash Flow

1. **B17 — Data models & persistence**
   - Add `Payment` and `PaymentMethod` entities
2. **B18 — Repository layer**
   - Implement `IPaymentRepository` methods (add payment, query payments)
3. **B19 — Service layer**
   - Implement `IPaymentService`/`PaymentService` methods (`RecordPaymentAsync`, `GetPaymentsAsync`, `GetCashFlowReportAsync`)
4. **B20 — API layer**
   - Create `PaymentController` endpoints (record payment, list payments, methods, cash flow report)

**Dependencies:** B17 → B18 → B19 → B20

---

### 1.6 Warehouse Transfer & Fulfillment

1. **B21 — Data models & persistence**
   - Add `WarehouseTransfer`, `PickingList`, and `Shipment` entities
2. **B22 — Repository layer**
   - Implement `IWarehouseTransferRepository`, `IPickingRepository`, and (if needed) `IShippingRepository`
3. **B23 — Service layer**
   - Implement `IWarehouseTransferService`, `IPickingService`, and `IShippingService`
4. **B24 — API layer**
   - Create `WarehouseTransferController`, `PickingController`, and `ShippingController`/endpoints

**Dependencies:** B21 → B22 → B23 → B24

---

### 1.7 Reporting & Exporting

1. **B25 — Data models & persistence**
   - Add report-related entities (Report snapshots, Dashboard data, etc.)
2. **B26 — Repository layer**
   - Implement `IReportRepository` methods for receivable/payable/cashflow/profit/dashboard
3. **B27 — Service layer**
   - Implement `IReportService`/`ReportService` methods
4. **B28 — API layer**
   - Implement `ReportsController` endpoints (receivable, payable, cashflow, profit, dashboard, export)

**Dependencies:** B25 → B26 → B27 → B28

---

### 1.8 AI Voice Integration

1. **B29 — Service layer**
   - Implement `IAiVoiceService`/`AiVoiceService` methods (TTS, STT)
2. **B30 — API layer**
   - Implement `AiVoiceController` endpoints

**Dependencies:** B29 → B30

---

## 2. Frontend Development Tasks

### 2.1 Auth / Password Reset

1. **F1 — API client**
   - Add `requestPasswordReset` and `confirmPasswordReset` to `services/api/auth.api.ts` (or `user.api.ts`)
2. **F2 — Pages**
   - Create `app/forgot-password/page.tsx` and `app/reset-password/page.tsx`

**Dependencies:** F1 → F2

---

### 2.2 Admin Settings / Tax Rates / Period Close

1. **F3 — API client**
   - Create `services/api/settings.api.ts` with settings/taxes/period close methods
2. **F4 — Pages and components**
   - Create settings pages under `app/dashboard/settings/*` and corresponding form/table components

**Dependencies:** F3 → F4

---

### 2.3 Purchase Returns & Supplier Payables

1. **F5 — API client**
   - Add payables/returns methods to `services/api/payables.api.ts` (or dedicated file)
2. **F6 — Pages**
   - Create `app/dashboard/purchase-returns/page.tsx` and `app/dashboard/supplier-payables/page.tsx`

**Dependencies:** F5 → F6

---

### 2.4 Sales Returns / Discounts / Receivables

1. **F7 — API client**
   - Add receivables and returns methods to `services/api/receivables.api.ts` (or dedicated file)
2. **F8 — Pages**
   - Create `app/dashboard/sales-returns/page.tsx` and update/expand `app/dashboard/receivables/page.tsx`

**Dependencies:** F7 → F8

---

### 2.5 Payments & Cash Flow

1. **F9 — API client**
   - Create/extend `services/api/payments.api.ts` with payments and cash flow report methods
2. **F10 — Pages**
   - Create `app/dashboard/payments/page.tsx` and `app/dashboard/cashflow-report/page.tsx`

**Dependencies:** F9 → F10

---

### 2.6 Warehouse Transfer & Fulfillment

1. **F11 — API client**
   - Create `services/api/warehouse-transfers.api.ts`, `services/api/picking.api.ts`, `services/api/shipping.api.ts` (if required)
2. **F12 — Pages**
   - Create `app/dashboard/warehouse-transfers/page.tsx` and `app/dashboard/picking-lists/page.tsx`

**Dependencies:** F11 → F12

---

### 2.7 Reporting & Export

1. **F13 — API client**
   - Create `services/api/reports.api.ts`
2. **F14 — Pages**
   - Create/extend `app/dashboard/reports/page.tsx`

**Dependencies:** F13 → F14

---

### 2.8 AI Search / Voice

1. **F15 — API client**
   - Create `services/api/ai-voice.api.ts`
2. **F16 — Pages / UI**
   - Create `app/ai-search/page.tsx` and UI components (e.g., `components/ai/VoiceSearch.tsx`)

**Dependencies:** F15 → F16

---

## 3. Testing Tasks

### 3.1 Unit Test Tasks (Backend Services)

- For every new service method listed in the code change plan, create at least one unit test to assert:
  - Correct handling of valid input (happy path)
  - Proper handling of invalid input (e.g., null, invalid ids)
  - Expected error propagation / validation results

(See `unit-test-plan.csv` for the full list of target methods and planned test cases.)

### 3.2 Integration Test Tasks (API Endpoints)

- For every new API controller endpoint, create at least one integration test that:
  - Verifies correct HTTP status code and response schema
  - Validates authorization requirements
  - Validates a key happy path request/response flow

(See `integration-test-plan.csv` for the full list of endpoints and planned test cases.)

---

## 4. Task Dependencies and Order of Work

1. Complete backend data model + persistence tasks (B1/B5/B9/B13/B17/B21/B25) before implementing repository and service layers.
2. Implement repository layer tasks before service layer tasks.
3. Implement service layer tasks before API/controller tasks.
4. Implement backend tasks for a vertical slice (repo → service → controller) before starting the corresponding frontend API client + UI tasks.
5. Add unit tests as soon as the service layer is implemented for each module.
6. Add integration tests once the corresponding controller endpoints are implemented.
