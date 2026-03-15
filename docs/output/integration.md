# Integration Guide

## Overview

The ISMS system integrates with various external systems and services to enhance functionality and provide a comprehensive business management solution. This document outlines the integration points, protocols, and implementation details.

## External System Integrations

### 1. AI Voice Recognition

#### Google Speech-to-Text API
- **Purpose**: Convert voice commands to text for product search and inventory queries
- **Integration Type**: REST API
- **Authentication**: API Key
- **Endpoint**: `https://speech.googleapis.com/v1/speech:recognize`
- **Data Format**: JSON
- **Rate Limits**: 100 requests per minute
- **Fallback**: Manual text input

**Implementation:**
```javascript
// Frontend integration
const voiceSearch = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  const response = await fetch('/api/voice/search', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

**Backend Processing:**
```csharp
// .NET Core service
public async Task<VoiceSearchResult> ProcessVoiceSearchAsync(byte[] audioData)
{
    var speechService = new GoogleSpeechService(_config.ApiKey);
    var transcript = await speechService.RecognizeAsync(audioData);
    
    // Process transcript for product search
    var products = await _productService.SearchProductsAsync(transcript);
    
    return new VoiceSearchResult
    {
        Transcript = transcript,
        Products = products
    };
}
```

#### VOSK Offline Speech Recognition
- **Purpose**: Offline voice processing as fallback
- **Integration Type**: Local library
- **Models**: Pre-trained language models
- **Advantages**: No internet required, privacy-focused

### 2. Payment Gateway Integration

#### Future Payment Processing
- **Supported Gateways**: VNPay, Momo, Zalopay (Vietnam market)
- **Integration Type**: REST API with webhooks
- **Security**: HMAC signatures, SSL/TLS
- **Features**:
  - Credit card processing
  - Bank transfers
  - Mobile payments
  - QR code payments

**Webhook Implementation:**
```csharp
[HttpPost("payment/webhook")]
public async Task<IActionResult> PaymentWebhook([FromBody] PaymentWebhookData data)
{
    // Verify webhook signature
    if (!VerifySignature(data, Request.Headers["X-Signature"]))
    {
        return BadRequest("Invalid signature");
    }
    
    // Update payment status
    await _paymentService.UpdatePaymentStatusAsync(data.TransactionId, data.Status);
    
    // Update document balance
    await _documentService.UpdateBalanceAsync(data.DocumentId);
    
    return Ok();
}
```

### 3. Email Service Integration

#### SMTP Configuration
- **Purpose**: Send notifications, password resets, reports
- **Providers**: SendGrid, Mailgun, AWS SES
- **Features**:
  - HTML email templates
  - Attachment support
  - Delivery tracking
  - Bounce handling

**Email Service:**
```csharp
public class EmailService : IEmailService
{
    private readonly SmtpClient _smtpClient;
    private readonly ITemplateEngine _templateEngine;
    
    public async Task SendInvoiceEmailAsync(Invoice invoice, string recipientEmail)
    {
        var template = await _templateEngine.RenderAsync("InvoiceTemplate", invoice);
        var attachment = await GenerateInvoicePdfAsync(invoice);
        
        var mailMessage = new MailMessage
        {
            From = new MailAddress(_config.FromEmail),
            To = { recipientEmail },
            Subject = $"Invoice {invoice.Number}",
            Body = template,
            IsBodyHtml = true
        };
        
        mailMessage.Attachments.Add(attachment);
        await _smtpClient.SendMailAsync(mailMessage);
    }
}
```

### 4. File Storage Integration

#### Cloud Storage
- **Providers**: AWS S3, Azure Blob Storage, Google Cloud Storage
- **Use Cases**: Document attachments, report exports, backup files
- **Features**:
  - Secure file upload/download
  - Access control
  - CDN integration
  - Versioning

**File Upload Service:**
```csharp
public async Task<string> UploadFileAsync(IFormFile file, string folder)
{
    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
    var key = $"{folder}/{fileName}";
    
    using var stream = file.OpenReadStream();
    await _s3Client.PutObjectAsync(new PutObjectRequest
    {
        BucketName = _config.BucketName,
        Key = key,
        InputStream = stream,
        ContentType = file.ContentType
    });
    
    return $"{_config.CdnUrl}/{key}";
}
```

### 5. Accounting Software Integration

#### Future Accounting System Integration
- **Target Systems**: SAP, QuickBooks, Xero
- **Integration Method**: API/webhooks or file-based (CSV, XML)
- **Data Mapping**: Transaction data synchronization
- **Sync Frequency**: Real-time or batch processing

### 6. Barcode/QR Code Integration

#### Hardware Integration
- **Devices**: Barcode scanners, mobile cameras
- **Standards**: Code 128, QR Code, EAN-13
- **Integration**: JavaScript libraries for web, native APIs for mobile

**Barcode Scanner Integration:**
```javascript
// Web integration using QuaggaJS
import Quagga from 'quagga';

const initBarcodeScanner = () => {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector('#scanner')
    },
    decoder: {
      readers: ["ean_reader", "code_128_reader", "qr_reader"]
    }
  }, (err) => {
    if (err) console.error(err);
    Quagga.start();
  });
  
  Quagga.onDetected((result) => {
    const code = result.codeResult.code;
    searchProduct(code);
  });
};
```

## Internal Module Integrations

### 1. Frontend-Backend Integration

#### REST API Communication
- **Base URL**: Configurable by environment
- **Authentication**: JWT Bearer tokens
- **Error Handling**: Standardized error responses
- **Caching**: HTTP caching headers

**API Client:**
```javascript
class ApiClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }
      return response.json();
    } catch (error) {
      // Handle network errors, retries, etc.
      throw error;
    }
  }
}
```

### 2. Database Integration

#### Entity Framework Core
- **ORM**: Code-first approach
- **Migrations**: Automated schema updates
- **Connection Pooling**: Optimized database connections
- **Query Optimization**: LINQ to SQL translation

**Repository Pattern:**
```csharp
public interface IProductRepository
{
    Task<Product> GetByIdAsync(int id);
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product> AddAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(int id);
}

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;
    
    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Product> GetByIdAsync(int id)
    {
        return await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.ProductId == id);
    }
    
    // Implementation of other methods...
}
```

### 3. Caching Integration

#### Redis Cache
- **Purpose**: Improve performance for frequently accessed data
- **Data Types**: User sessions, product catalogs, configuration
- **Expiration**: Configurable TTL
- **Serialization**: JSON serialization

**Cache Service:**
```csharp
public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;
    
    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        var cached = await _cache.GetStringAsync(key);
        if (cached != null)
        {
            _logger.LogInformation($"Cache hit for key: {key}");
            return JsonSerializer.Deserialize<T>(cached);
        }
        
        var data = await factory();
        await _cache.SetStringAsync(key, JsonSerializer.Serialize(data), 
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiry });
        
        _logger.LogInformation($"Cache miss for key: {key}, data cached");
        return data;
    }
}
```

## Third-Party Service Integrations

### 1. Analytics and Monitoring

#### Application Insights
- **Purpose**: Application performance monitoring
- **Metrics**: Response times, error rates, user behavior
- **Integration**: SDK integration in .NET Core

#### Google Analytics
- **Purpose**: User behavior tracking
- **Integration**: GTM (Google Tag Manager) for frontend

### 2. Communication Tools

#### Slack Integration
- **Purpose**: System notifications and alerts
- **Webhooks**: Real-time notifications for critical events

#### Microsoft Teams
- **Purpose**: Team collaboration and notifications
- **Integration**: Webhooks and bot integration

## Integration Testing

### API Testing
```bash
# Using curl for API testing
curl -X POST https://api.isms.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Contract Testing
- **Pact Framework**: Consumer-driven contract testing
- **Purpose**: Ensure API compatibility between services

### End-to-End Testing
- **TestCafe/Cypress**: Frontend integration testing
- **Postman/Newman**: API automation testing

## Security Considerations

### API Security
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs
- **CORS**: Restrict cross-origin requests
- **HSTS**: Enforce HTTPS

### Data Protection
- **Encryption**: Data in transit and at rest
- **Token Management**: Secure JWT handling
- **API Keys**: Rotate regularly
- **Audit Logging**: Track all integration activities

## Monitoring and Alerting

### Integration Health Checks
- **Endpoint Monitoring**: Check external service availability
- **Response Time Monitoring**: Alert on performance degradation
- **Error Rate Monitoring**: Track failed integrations
- **Data Consistency Checks**: Validate synchronized data

### Alert Configuration
```json
{
  "alerts": [
    {
      "name": "Payment Gateway Down",
      "condition": "response_time > 5000ms",
      "channels": ["email", "slack"],
      "escalation": "after 5 minutes"
    },
    {
      "name": "Voice API Quota Exceeded",
      "condition": "quota_used > 90%",
      "channels": ["email"],
      "escalation": "immediate"
    }
  ]
}
```

## Deployment Considerations

### Environment Configuration
- **Development**: Local services and mocks
- **Staging**: Test integrations with real services
- **Production**: Full integration with monitoring

### Rollback Strategy
- **Feature Flags**: Enable/disable integrations
- **Circuit Breaker**: Fail gracefully when services are down
- **Fallback Mechanisms**: Default behavior when integrations fail

## Future Integrations

### Planned Enhancements
1. **IoT Integration**: Smart warehouse sensors
2. **Blockchain**: Supply chain traceability
3. **Machine Learning**: Demand forecasting
4. **Mobile Apps**: iOS/Android applications
5. **EDI Integration**: Electronic data interchange
6. **Multi-tenant SaaS**: White-label solutions

This integration guide provides the foundation for connecting ISMS with external systems and services. All integrations should follow security best practices and include comprehensive error handling and monitoring.