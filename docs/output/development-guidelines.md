# Development Guidelines

## Overview

This document outlines the development standards, best practices, and guidelines for the ISMS project. Following these guidelines ensures code quality, maintainability, and consistency across the development team.

## Project Structure

### Frontend (Next.js)

```
ISMS_FE/
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Route groups for authentication
│   ├── dashboard/         # Main application routes
│   ├── api/               # API routes (if needed)
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── api/              # API client functions
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── store/                 # State management
├── styles/               # Component-specific styles
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

### Backend (.NET Core)

```
ISMS_BE/
├── AppBackend.ApiCore/           # Web API project
│   ├── Controllers/              # API controllers
│   ├── Extensions/               # Extension methods
│   ├── Middlewares/              # Custom middleware
│   └── Properties/
├── AppBackend.BusinessObjects/   # Domain models
│   ├── Dtos/                     # Data transfer objects
│   ├── Enums/                    # Enumeration types
│   ├── Exceptions/               # Custom exceptions
│   └── Models/                   # Domain models
├── AppBackend.Repositories/      # Data access layer
│   ├── Generic/                  # Generic repository
│   ├── Repositories/             # Specific repositories
│   └── UnitOfWork/               # Unit of work pattern
└── AppBackend.Services/          # Business logic layer
    ├── ApiModels/                # API-specific models
    ├── Mappings/                 # AutoMapper configurations
    └── Services/                 # Business services
```

## Coding Standards

### General Principles

1. **DRY (Don't Repeat Yourself)**: Avoid code duplication
2. **SOLID Principles**: Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion
3. **KISS (Keep It Simple, Stupid)**: Simple solutions are better
4. **YAGNI (You Aren't Gonna Need It)**: Don't implement features you don't need
5. **Clean Code**: Write readable, maintainable code

### Naming Conventions

#### C# (.NET Core)
- **Classes**: PascalCase (e.g., `ProductService`)
- **Methods**: PascalCase (e.g., `GetProductById`)
- **Properties**: PascalCase (e.g., `ProductName`)
- **Private Fields**: camelCase with underscore (e.g., `_productRepository`)
- **Constants**: PascalCase (e.g., `MaxRetryCount`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IProductService`)

#### TypeScript/JavaScript
- **Variables**: camelCase (e.g., `productName`)
- **Functions**: camelCase (e.g., `getProductById`)
- **Classes**: PascalCase (e.g., `ProductService`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IProduct`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

#### Database
- **Tables**: PascalCase (e.g., `Products`)
- **Columns**: PascalCase (e.g., `ProductName`)
- **Primary Keys**: `TableNameId` (e.g., `ProductId`)
- **Foreign Keys**: `ReferencedTableNameId` (e.g., `CategoryId`)

### Code Formatting

#### C# Formatting
```csharp
// Use 4 spaces for indentation
// Opening brace on same line
public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    
    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
    }
    
    public async Task<ProductDto> GetProductByIdAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        return product == null ? null : _mapper.Map<ProductDto>(product);
    }
}
```

#### TypeScript/JavaScript Formatting
```typescript
// Use 2 spaces for indentation
// Use semicolons
// Use single quotes for strings
interface IProduct {
  id: number;
  name: string;
  price: number;
}

const getProductById = async (id: number): Promise<IProduct | null> => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};
```

## Architecture Patterns

### Backend Patterns

#### Repository Pattern
```csharp
public interface IProductRepository
{
    Task<Product> GetByIdAsync(int id);
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product> AddAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
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

#### Service Layer Pattern
```csharp
public interface IProductService
{
    Task<ProductDto> GetProductByIdAsync(int id);
    Task<IEnumerable<ProductDto>> GetAllProductsAsync();
    Task<ProductDto> CreateProductAsync(CreateProductDto dto);
    Task UpdateProductAsync(int id, UpdateProductDto dto);
    Task DeleteProductAsync(int id);
}

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductService> _logger;
    
    public ProductService(
        IProductRepository productRepository,
        IMapper mapper,
        ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _mapper = mapper;
        _logger = logger;
    }
    
    public async Task<ProductDto> GetProductByIdAsync(int id)
    {
        _logger.LogInformation("Getting product with ID: {Id}", id);
        
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
        {
            throw new NotFoundException($"Product with ID {id} not found");
        }
        
        return _mapper.Map<ProductDto>(product);
    }
    
    // Implementation of other methods...
}
```

#### Unit of Work Pattern
```csharp
public interface IUnitOfWork
{
    IProductRepository Products { get; }
    ICategoryRepository Categories { get; }
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IProductRepository _products;
    private ICategoryRepository _categories;
    
    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public IProductRepository Products => 
        _products ??= new ProductRepository(_context);
    
    public ICategoryRepository Categories => 
        _categories ??= new CategoryRepository(_context);
    
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
    
    public async Task BeginTransactionAsync()
    {
        await _context.Database.BeginTransactionAsync();
    }
    
    public async Task CommitTransactionAsync()
    {
        await _context.Database.CommitTransactionAsync();
    }
    
    public async Task RollbackTransactionAsync()
    {
        await _context.Database.RollbackTransactionAsync();
    }
    
    public void Dispose()
    {
        _context.Dispose();
    }
}
```

### Frontend Patterns

#### Custom Hooks
```typescript
// useApi hook for API calls
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export const useApi = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await apiClient.get<T>(url, options);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url]);
  
  return { data, loading, error };
};
```

#### Component Composition
```typescript
// Higher-order component for authentication
import { useAuth } from '../hooks/useAuth';

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return <div>Please log in to access this page.</div>;
    }
    
    return <Component {...props} />;
  };
};
```

## Error Handling

### Backend Error Handling
```csharp
// Custom exception classes
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }
    
    public ValidationException(IDictionary<string, string[]> errors)
    {
        Errors = errors;
    }
}

// Global exception handler
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }
    
    public async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred");
        
        var response = context.Response;
        response.ContentType = "application/json";
        
        var errorResponse = new ErrorResponse
        {
            Success = false,
            Error = new ErrorDetails
            {
                Code = GetErrorCode(exception),
                Message = GetErrorMessage(exception)
            }
        };
        
        response.StatusCode = GetStatusCode(exception);
        await response.WriteAsJsonAsync(errorResponse);
    }
    
    private static int GetStatusCode(Exception exception) => exception switch
    {
        NotFoundException => 404,
        ValidationException => 400,
        UnauthorizedAccessException => 401,
        _ => 500
    };
    
    private static string GetErrorCode(Exception exception) => exception switch
    {
        NotFoundException => "NOT_FOUND",
        ValidationException => "VALIDATION_ERROR",
        UnauthorizedAccessException => "UNAUTHORIZED",
        _ => "INTERNAL_ERROR"
    };
    
    private static string GetErrorMessage(Exception exception)
    {
        return exception switch
        {
            ValidationException validationEx => "Validation failed",
            _ => "An error occurred while processing your request"
        };
    }
}
```

### Frontend Error Handling
```typescript
// Error boundary component
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Guidelines

### Unit Testing (Backend)
```csharp
[TestFixture]
public class ProductServiceTests
{
    private Mock<IProductRepository> _productRepositoryMock;
    private Mock<IMapper> _mapperMock;
    private ProductService _service;
    
    [SetUp]
    public void Setup()
    {
        _productRepositoryMock = new Mock<IProductRepository>();
        _mapperMock = new Mock<IMapper>();
        _service = new ProductService(
            _productRepositoryMock.Object,
            _mapperMock.Object,
            Mock.Of<ILogger<ProductService>>()
        );
    }
    
    [Test]
    public async Task GetProductByIdAsync_ExistingProduct_ReturnsProductDto()
    {
        // Arrange
        var productId = 1;
        var product = new Product { ProductId = productId, Name = "Test Product" };
        var productDto = new ProductDto { Id = productId, Name = "Test Product" };
        
        _productRepositoryMock
            .Setup(x => x.GetByIdAsync(productId))
            .ReturnsAsync(product);
        
        _mapperMock
            .Setup(x => x.Map<ProductDto>(product))
            .Returns(productDto);
        
        // Act
        var result = await _service.GetProductByIdAsync(productId);
        
        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(productId);
        result.Name.Should().Be("Test Product");
    }
    
    [Test]
    public async Task GetProductByIdAsync_NonExistingProduct_ThrowsNotFoundException()
    {
        // Arrange
        var productId = 999;
        _productRepositoryMock
            .Setup(x => x.GetByIdAsync(productId))
            .ReturnsAsync((Product)null);
        
        // Act
        Func<Task> act = () => _service.GetProductByIdAsync(productId);
        
        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"Product with ID {productId} not found");
    }
}
```

### Component Testing (Frontend)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductForm } from './ProductForm';

describe('ProductForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });
  
  it('renders form fields correctly', () => {
    render(<ProductForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
  
  it('calls onSubmit with form data when submitted', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/product name/i), {
      target: { value: 'Test Product' }
    });
    
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '29.99' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Product',
        price: 29.99
      });
    });
  });
  
  it('shows validation errors for empty required fields', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
    });
  });
});
```

## Security Guidelines

### Authentication & Authorization
- Use JWT tokens with appropriate expiration
- Implement role-based access control
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement rate limiting for API endpoints

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Regular security audits and penetration testing

## Performance Guidelines

### Database Optimization
- Use appropriate indexes
- Avoid N+1 query problems
- Implement pagination for large datasets
- Use database connection pooling
- Monitor query performance

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization
- Minimize bundle size
- Use CDN for static assets
- Implement caching strategies

### API Optimization
- Use appropriate HTTP status codes
- Implement caching headers
- Compress responses
- Use pagination for list endpoints
- Monitor API performance

## Documentation Standards

### Code Documentation
```csharp
/// <summary>
/// Service for managing products
/// </summary>
public interface IProductService
{
    /// <summary>
    /// Gets a product by its ID
    /// </summary>
    /// <param name="id">The product ID</param>
    /// <returns>The product DTO or null if not found</returns>
    Task<ProductDto> GetProductByIdAsync(int id);
}
```

```typescript
/**
 * API client for making HTTP requests
 * @param baseUrl - The base URL for API calls
 * @param token - JWT token for authentication
 */
export class ApiClient {
  // Implementation...
}
```

### API Documentation
Use Swagger/OpenAPI for API documentation with detailed descriptions, examples, and error responses.

## Version Control

### Git Workflow
- Use feature branches for development
- Follow conventional commit messages
- Require pull request reviews
- Use Git Flow branching strategy
- Keep commit history clean and meaningful

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Deployment Guidelines

### Environment Configuration
- Use environment variables for configuration
- Separate configs for dev/staging/production
- Never commit secrets to version control
- Use configuration management tools

### CI/CD Pipeline
- Automated testing on every push
- Code quality checks (linting, formatting)
- Security scanning
- Automated deployment to staging
- Manual approval for production deployment

## Code Review Checklist

### Backend Review
- [ ] SOLID principles followed
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Unit tests written and passing
- [ ] Code documented appropriately
- [ ] Security best practices followed
- [ ] Performance considerations addressed

### Frontend Review
- [ ] Component follows single responsibility
- [ ] Proper state management
- [ ] Accessibility considerations
- [ ] Responsive design implemented
- [ ] Error boundaries used where appropriate
- [ ] Tests written and passing

## Tools and Technologies

### Development Tools
- **IDE**: Visual Studio 2022, VS Code
- **Version Control**: Git with GitHub
- **Project Management**: GitHub Issues/Projects
- **Documentation**: Markdown files
- **API Testing**: Postman, Swagger UI

### Quality Assurance
- **Testing Frameworks**: xUnit (C#), Jest (JS)
- **Code Coverage**: Coverlet, Istanbul
- **Linting**: ESLint, StyleCop
- **Security**: SonarQube, OWASP ZAP

### Monitoring and Logging
- **Application Monitoring**: Application Insights
- **Logging**: Serilog, Winston
- **Error Tracking**: Sentry
- **Performance**: New Relic

Following these guidelines ensures that the ISMS codebase remains maintainable, scalable, and high-quality throughout the development lifecycle.