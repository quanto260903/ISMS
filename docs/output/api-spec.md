# API Specification

## Overview

The ISMS API provides RESTful endpoints for managing inventory, sales, purchases, and system administration. All APIs follow REST principles with JSON request/response formats.

## Base URL
```
https://api.isms.com/v1
```

## Authentication
All API requests require JWT Bearer token authentication.

**Header:**
```
Authorization: Bearer <jwt_token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

## API Endpoints

### Authentication APIs

#### POST /auth/login
Authenticate user and return JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "string",
      "username": "string",
      "role": "string"
    },
    "expiresIn": 3600
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

#### POST /auth/logout
Invalidate user session.

### Product Management APIs

#### GET /products
Get paginated list of products.

**Query Parameters:**
- `page` (integer, default: 1)
- `size` (integer, default: 20)
- `search` (string)
- `category` (string)
- `status` (string: active/inactive)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "code": "string",
        "name": "string",
        "category": "string",
        "unit": "string",
        "purchasePrice": 0,
        "salePrice": 0,
        "status": "active"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20
  }
}
```

#### POST /products
Create new product.

**Request:**
```json
{
  "code": "string",
  "name": "string",
  "categoryId": "string",
  "unit": "string",
  "purchasePrice": 0,
  "salePrice": 0,
  "description": "string"
}
```

#### PUT /products/{id}
Update existing product.

#### DELETE /products/{id}
Deactivate product.

#### GET /products/{id}
Get product details.

### Inventory Management APIs

#### GET /inventory
Get inventory levels.

**Query Parameters:**
- `warehouseId` (string)
- `productId` (string)
- `page` (integer)
- `size` (integer)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "string",
        "productName": "string",
        "warehouseId": "string",
        "warehouseName": "string",
        "quantity": 0,
        "unit": "string",
        "lastUpdated": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 50
  }
}
```

#### GET /inventory/{productId}/{warehouseId}
Get specific inventory item.

#### POST /inventory/adjust
Adjust inventory quantity.

**Request:**
```json
{
  "productId": "string",
  "warehouseId": "string",
  "adjustment": 10,
  "reason": "string",
  "reference": "string"
}
```

### Purchase Management APIs

#### POST /purchases/orders
Create purchase order.

**Request:**
```json
{
  "supplierId": "string",
  "orderDate": "2023-01-01",
  "expectedDate": "2023-01-15",
  "items": [
    {
      "productId": "string",
      "quantity": 100,
      "unitPrice": 10.50
    }
  ],
  "notes": "string"
}
```

#### POST /purchases/receipts
Record goods receipt.

**Request:**
```json
{
  "orderId": "string",
  "receiptDate": "2023-01-01",
  "warehouseId": "string",
  "items": [
    {
      "productId": "string",
      "receivedQuantity": 95,
      "unitPrice": 10.50
    }
  ]
}
```

#### POST /purchases/invoices
Create purchase invoice.

**Request:**
```json
{
  "supplierId": "string",
  "invoiceNumber": "string",
  "invoiceDate": "2023-01-01",
  "dueDate": "2023-01-31",
  "items": [
    {
      "productId": "string",
      "quantity": 100,
      "unitPrice": 10.50,
      "taxRate": 0.1
    }
  ]
}
```

### Sales Management APIs

#### POST /sales/orders
Create sales order.

**Request:**
```json
{
  "customerId": "string",
  "orderDate": "2023-01-01",
  "items": [
    {
      "productId": "string",
      "quantity": 5,
      "unitPrice": 15.00,
      "discount": 0
    }
  ]
}
```

#### POST /sales/invoices
Create sales invoice.

**Request:**
```json
{
  "customerId": "string",
  "invoiceNumber": "string",
  "invoiceDate": "2023-01-01",
  "dueDate": "2023-01-31",
  "paymentMethod": "cash|bank|credit",
  "items": [
    {
      "productId": "string",
      "quantity": 5,
      "unitPrice": 15.00,
      "discount": 0,
      "taxRate": 0.1
    }
  ]
}
```

#### POST /sales/returns
Process sales return.

**Request:**
```json
{
  "invoiceId": "string",
  "returnDate": "2023-01-01",
  "items": [
    {
      "productId": "string",
      "quantity": 1,
      "reason": "damaged"
    }
  ]
}
```

### Payment APIs

#### POST /payments
Record payment.

**Request:**
```json
{
  "documentId": "string",
  "documentType": "sales_invoice|purchase_invoice",
  "paymentDate": "2023-01-01",
  "paymentMethod": "cash|bank|transfer",
  "amount": 100.00,
  "reference": "string",
  "bankAccountId": "string"
}
```

### Warehouse Operations APIs

#### POST /warehouse/transfers
Transfer inventory between warehouses.

**Request:**
```json
{
  "fromWarehouseId": "string",
  "toWarehouseId": "string",
  "transferDate": "2023-01-01",
  "items": [
    {
      "productId": "string",
      "quantity": 10
    }
  ],
  "reason": "string"
}
```

#### POST /warehouse/adjustments
Perform inventory adjustment.

**Request:**
```json
{
  "warehouseId": "string",
  "productId": "string",
  "adjustmentType": "increase|decrease",
  "quantity": 5,
  "reason": "string",
  "reference": "string"
}
```

### Reporting APIs

#### GET /reports/inventory
Generate inventory report.

**Query Parameters:**
- `warehouseId` (string)
- `asOfDate` (date)
- `format` (string: json|excel|pdf)

#### GET /reports/sales
Generate sales report.

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `customerId` (string)
- `productId` (string)
- `format` (string)

#### GET /reports/purchases
Generate purchase report.

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `supplierId` (string)
- `format` (string)

#### GET /reports/financial
Generate financial report.

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `reportType` (string: profit_loss|balance_sheet|cash_flow)
- `format` (string)

### AI Voice Integration APIs

#### POST /voice/search
Search products using voice input.

**Request:**
```json
{
  "audioData": "base64_encoded_audio",
  "language": "en-US"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "find blue widgets",
    "products": [
      {
        "id": "string",
        "name": "string",
        "quantity": 50
      }
    ]
  }
}
```

#### POST /voice/query
Query inventory using voice.

**Request:**
```json
{
  "audioData": "base64_encoded_audio",
  "context": "inventory"
}
```

### System Administration APIs

#### GET /admin/users
Get users list (Admin only).

#### POST /admin/users
Create user account (Admin only).

#### PUT /admin/users/{id}
Update user account.

#### DELETE /admin/users/{id}
Deactivate user account.

#### GET /admin/logs
Get system activity logs.

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `userId` (string)
- `action` (string)
- `page` (integer)
- `size` (integer)

#### POST /admin/settings
Update system settings.

**Request:**
```json
{
  "key": "string",
  "value": "string",
  "type": "string"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| INVALID_REQUEST | Request validation failed |
| UNAUTHORIZED | Authentication required |
| FORBIDDEN | Insufficient permissions |
| NOT_FOUND | Resource not found |
| CONFLICT | Resource conflict |
| INTERNAL_ERROR | Server error |
| INSUFFICIENT_STOCK | Not enough inventory |
| INVALID_PAYMENT | Payment validation failed |

## Rate Limiting

- **Authenticated Users**: 1000 requests per hour
- **Admin Users**: 5000 requests per hour
- **Voice APIs**: 100 requests per hour per user

## Pagination

All list endpoints support pagination:

```json
{
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "size": 20,
    "totalPages": 5
  }
}
```

## Versioning

API versioning is handled through URL path:

- Current version: `/v1/`
- Future versions: `/v2/`, `/v3/`, etc.

## Webhooks

The system supports webhooks for real-time notifications:

### Inventory Low Stock Alert
```json
{
  "event": "inventory.low_stock",
  "data": {
    "productId": "string",
    "warehouseId": "string",
    "currentQuantity": 5,
    "threshold": 10
  }
}
```

### Payment Received
```json
{
  "event": "payment.received",
  "data": {
    "documentId": "string",
    "amount": 100.00,
    "paymentMethod": "bank"
  }
}
```

## SDKs and Libraries

- **JavaScript SDK**: Available on npm
- **.NET SDK**: Available on NuGet
- **Postman Collection**: Available for testing

## Support

For API support, contact the development team or refer to the full API documentation at `/docs/api`.