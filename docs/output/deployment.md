# Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Inventory and Sales Management Solution for SMEs (ISMS) across different environments. The deployment process covers infrastructure setup, application deployment, configuration, and monitoring.

## Deployment Environments

### 1. Development Environment
- **Purpose**: Local development and testing
- **Infrastructure**: Local machine or development server
- **Tools**: Docker, Visual Studio, VS Code
- **Database**: Local SQL Server Express or SQLite

### 2. Staging Environment
- **Purpose**: Integration testing and user acceptance testing
- **Infrastructure**: Cloud VM or containerized environment
- **Tools**: Docker, Kubernetes (optional)
- **Database**: Managed SQL Server/MySQL

### 3. Production Environment
- **Purpose**: Live system for end users
- **Infrastructure**: Cloud platform (AWS/Azure/GCP)
- **Tools**: Docker, Kubernetes, CI/CD pipelines
- **Database**: Managed database service

## Infrastructure Requirements

### Minimum Hardware Requirements

#### Development
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: Stable internet connection

#### Production
- **CPU**: 8+ cores
- **RAM**: 16 GB+
- **Storage**: 100 GB+ SSD
- **Network**: High-speed internet with redundancy

### Software Prerequisites

#### Backend (.NET Core)
- **Operating System**: Windows Server 2019+, Linux (Ubuntu 18.04+)
- **Runtime**: .NET Core 6.0+ Runtime
- **Web Server**: IIS 10+ or Nginx 1.18+
- **Database**: SQL Server 2019+ or MySQL 8.0+

#### Frontend (Next.js)
- **Node.js**: Version 18.0+
- **Package Manager**: npm or yarn
- **Build Tools**: Webpack (included with Next.js)

#### Database
- **SQL Server**: 2019+ with Full-Text Search
- **MySQL**: 8.0+ with InnoDB engine
- **Connection Pooling**: Enabled
- **Backup**: Automated backup configured

## Deployment Strategies

### 1. Blue-Green Deployment
- **Description**: Two identical production environments
- **Benefits**: Zero downtime, instant rollback
- **Implementation**: Load balancer switches between environments

### 2. Rolling Deployment
- **Description**: Gradual replacement of instances
- **Benefits**: Reduced risk, resource efficient
- **Implementation**: Update instances one by one

### 3. Canary Deployment
- **Description**: Deploy to subset of users first
- **Benefits**: Risk mitigation, gradual rollout
- **Implementation**: Route percentage of traffic to new version

## Docker Deployment

### Dockerfile (Backend)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["AppBackend.ApiCore/AppBackend.ApiCore.csproj", "AppBackend.ApiCore/"]
COPY ["AppBackend.BusinessObjects/AppBackend.BusinessObjects.csproj", "AppBackend.BusinessObjects/"]
COPY ["AppBackend.Repositories/AppBackend.Repositories.csproj", "AppBackend.Repositories/"]
COPY ["AppBackend.Services/AppBackend.Services.csproj", "AppBackend.Services/"]
RUN dotnet restore "AppBackend.ApiCore/AppBackend.ApiCore.csproj"
COPY . .
WORKDIR "/src/AppBackend.ApiCore"
RUN dotnet build "AppBackend.ApiCore.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AppBackend.ApiCore.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AppBackend.ApiCore.dll"]
```

### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=base /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: YourStrong!Passw0rd
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql

  api:
    build:
      context: .
      dockerfile: AppBackend.ApiCore/Dockerfile
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Server=db;Database=ISMS;User Id=sa;Password=YourStrong!Passw0rd;
    depends_on:
      - db

  frontend:
    build:
      context: ./ISMS_FE
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  sqlserver_data:
```

## Cloud Deployment

### AWS Deployment

#### EC2 Instance Setup
```bash
# Update system
sudo yum update -y

# Install .NET Core
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
sudo yum install dotnet-sdk-6.0 -y

# Install Nginx
sudo amazon-linux-extras install nginx1.12 -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure Nginx
sudo tee /etc/nginx/nginx.conf > /dev/null <<EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream backend {
        server localhost:5000;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location / {
            root /usr/share/nginx/html;
            try_files \$uri \$uri/ /index.html;
        }
    }
}
EOF

sudo systemctl restart nginx
```

#### RDS Database Setup
```bash
# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier isms-db \
    --db-instance-class db.t3.micro \
    --engine sqlserver-ex \
    --master-username admin \
    --master-user-password YourStrongPassword123! \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-12345678 \
    --db-subnet-group-name isms-subnet-group
```

### Azure Deployment

#### App Service Setup
```bash
# Create resource group
az group create --name ISMSResourceGroup --location eastus

# Create App Service plan
az appservice plan create \
    --name ISMSAppServicePlan \
    --resource-group ISMSResourceGroup \
    --sku B1 \
    --is-linux

# Create web app
az webapp create \
    --name isms-api \
    --resource-group ISMSResourceGroup \
    --plan ISMSAppServicePlan \
    --runtime "DOTNETCORE|6.0"

# Configure database connection
az webapp config connection-string set \
    --name isms-api \
    --resource-group ISMSResourceGroup \
    --connection-string-type SQLAzure \
    --setting-name DefaultConnection \
    --setting-value "Server=tcp:isms-server.database.windows.net,1433;Initial Catalog=ISMS;Persist Security Info=False;User ID=admin;Password=YourStrongPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

#### Static Web App (Frontend)
```bash
# Create static web app
az staticwebapp create \
    --name isms-frontend \
    --resource-group ISMSResourceGroup \
    --location eastus \
    --source https://github.com/your-org/ISMS \
    --branch main \
    --app-location "ISMS_FE" \
    --output-location "ISMS_FE/out" \
    --login-with-github
```

## Configuration Management

### Environment Variables

#### Backend Configuration
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=ISMS;User Id=your-user;Password=your-password;"
  },
  "Jwt": {
    "Key": "your-jwt-secret-key",
    "Issuer": "ISMS",
    "Audience": "ISMS-Users",
    "ExpiryInMinutes": 60
  },
  "ExternalServices": {
    "GoogleSpeechApiKey": "your-google-api-key",
    "EmailSmtpServer": "smtp.gmail.com",
    "EmailSmtpPort": 587,
    "EmailUsername": "your-email@gmail.com",
    "EmailPassword": "your-app-password"
  },
  "FileStorage": {
    "Provider": "AWS",
    "BucketName": "isms-uploads",
    "Region": "us-east-1",
    "AccessKey": "your-access-key",
    "SecretKey": "your-secret-key"
  }
}
```

#### Frontend Configuration
```javascript
// config.js
const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GA_ID,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
};

export default config;
```

### Secrets Management

#### Azure Key Vault
```bash
# Create key vault
az keyvault create \
    --name isms-keyvault \
    --resource-group ISMSResourceGroup \
    --location eastus

# Add secrets
az keyvault secret set \
    --vault-name isms-keyvault \
    --name DatabaseConnectionString \
    --value "Server=...;Database=...;User Id=...;Password=...;"

az keyvault secret set \
    --vault-name isms-keyvault \
    --name JwtSecretKey \
    --value "your-jwt-secret-key"
```

#### AWS Secrets Manager
```bash
# Create secret
aws secretsmanager create-secret \
    --name ISMS/DatabaseCredentials \
    --secret-string '{"username":"admin","password":"YourStrongPassword123!","host":"isms-db.cluster-xxxxxx.us-east-1.rds.amazonaws.com","port":"1433","database":"ISMS"}'
```

## Database Deployment

### Schema Deployment
```sql
-- Run migrations
dotnet ef database update --project AppBackend.Repositories --startup-project AppBackend.ApiCore

-- Or using SQL scripts
-- Execute schema creation scripts in order
-- 1. Tables
-- 2. Indexes
-- 3. Constraints
-- 4. Initial data
```

### Data Migration
```csharp
// Using EF Core migrations
public partial class InitialMigration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Create tables
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                UserId = table.Column<int>(nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Username = table.Column<string>(maxLength: 50, nullable: false),
                Email = table.Column<string>(maxLength: 100, nullable: false),
                // ... other columns
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.UserId);
            });
        
        // Seed initial data
        migrationBuilder.InsertData(
            table: "Roles",
            columns: new[] { "RoleName", "Description" },
            values: new object[] { "Administrator", "Full system access" });
    }
    
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Users");
    }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: isms-api
  AZURE_WEBAPP_PACKAGE_PATH: './publish'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET Core
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'
    
    - name: Restore dependencies
      run: dotnet restore ./ISMS_BE/AppBackend.ApiCore
    
    - name: Build
      run: dotnet build ./ISMS_BE/AppBackend.ApiCore --configuration Release --no-restore
    
    - name: Test
      run: dotnet test ./ISMS_BE --configuration Release --no-build --verbosity normal
    
    - name: Publish
      run: dotnet publish ./ISMS_BE/AppBackend.ApiCore --configuration Release --output ${{env.AZURE_WEBAPP_PACKAGE_PATH}}
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
    
    - name: Deploy Frontend
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "ISMS_FE"
        output_location: "out"
```

## Monitoring and Logging

### Application Insights Setup
```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry();

// Configure logging
builder.Logging.AddApplicationInsights();
builder.Logging.AddFilter<ApplicationInsightsLoggerProvider>("", LogLevel.Information);
```

### Health Checks
```csharp
// Add health checks
builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
    .AddUrlGroup(new Uri("https://api.google.com"), "Google API");

// Map health check endpoint
app.MapHealthChecks("/health");
```

### Log Aggregation
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    },
    "ApplicationInsights": {
      "LogLevel": {
        "Default": "Information"
      }
    }
  }
}
```

## Backup and Recovery

### Database Backup
```sql
-- Full backup
BACKUP DATABASE ISMS
TO DISK = 'D:\Backup\ISMS_Full.bak'
WITH FORMAT,
    NAME = 'Full Backup of ISMS Database';

-- Differential backup
BACKUP DATABASE ISMS
TO DISK = 'D:\Backup\ISMS_Diff.bak'
WITH DIFFERENTIAL,
    NAME = 'Differential Backup of ISMS Database';

-- Transaction log backup
BACKUP LOG ISMS
TO DISK = 'D:\Backup\ISMS_Log.trn'
WITH NAME = 'Transaction Log Backup of ISMS Database';
```

### Automated Backup Schedule
- **Full Backup**: Weekly (Sunday 2:00 AM)
- **Differential Backup**: Daily (Monday-Saturday 2:00 AM)
- **Transaction Log Backup**: Every 15 minutes
- **Retention**: 30 days for daily, 1 year for weekly

## Security Hardening

### Server Security
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# Disable root login
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Performance Optimization

### Database Tuning
```sql
-- Create indexes for common queries
CREATE INDEX IX_Products_CategoryId_IsActive ON Products(CategoryId, IsActive);
CREATE INDEX IX_Documents_CustomerId_Status ON Documents(CustomerId, Status);
CREATE INDEX IX_InventoryTransactions_ProductId_TransactionDate ON InventoryTransactions(ProductId, TransactionDate);

-- Update statistics
UPDATE STATISTICS Products WITH FULLSCAN;
UPDATE STATISTICS Documents WITH FULLSCAN;
```

### Application Optimization
```csharp
// Configure Kestrel
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 100;
    options.Limits.MaxConcurrentUpgradedConnections = 100;
    options.Limits.MaxRequestBodySize = 52428800; // 50MB
});

// Enable response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

app.UseResponseCompression();
```

## Rollback Procedures

### Application Rollback
```bash
# Azure App Service rollback
az webapp deployment slot swap \
    --name isms-api \
    --resource-group ISMSResourceGroup \
    --slot staging \
    --target-slot production

# Docker rollback
docker tag isms-api:v1 isms-api:rollback
docker run -d --name isms-api-rollback isms-api:rollback
```

### Database Rollback
```sql
-- Restore from backup
RESTORE DATABASE ISMS
FROM DISK = 'D:\Backup\ISMS_Previous.bak'
WITH REPLACE,
    MOVE 'ISMS' TO 'D:\Data\ISMS.mdf',
    MOVE 'ISMS_log' TO 'D:\Data\ISMS_log.ldf';
```

## Post-Deployment Checklist

- [ ] Application starts successfully
- [ ] Database connections established
- [ ] API endpoints responding
- [ ] Frontend loads correctly
- [ ] Authentication working
- [ ] Basic CRUD operations functional
- [ ] External integrations configured
- [ ] SSL certificates installed
- [ ] Monitoring and logging active
- [ ] Backup procedures tested
- [ ] Security configurations verified
- [ ] Performance benchmarks met

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker logs isms-api

# Check environment variables
docker exec isms-api env

# Verify database connectivity
docker exec isms-api dotnet ef database update --connection "your-connection-string"
```

#### Database Connection Issues
```bash
# Test connection
sqlcmd -S your-server -U your-username -P your-password -Q "SELECT @@VERSION"

# Check firewall settings
telnet your-server 1433
```

#### Performance Issues
- Check resource utilization
- Review slow query logs
- Monitor connection pool usage
- Verify caching configuration

This deployment guide provides a comprehensive approach to deploying ISMS across different environments with proper security, monitoring, and maintenance procedures.