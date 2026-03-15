# File Naming Rules

## Overview

This document defines file and directory naming conventions for the ISMS project to ensure consistency across the codebase.

## General Principles

- Use descriptive, meaningful names
- Avoid abbreviations unless they are widely understood
- Maintain consistency within each technology stack
- Follow language-specific conventions

## Backend (.NET Core)

### Directory Structure
- Use PascalCase for all directories
- Examples: `Controllers/`, `Services/`, `Repositories/`

### File Naming
- **Classes**: PascalCase with appropriate suffix
  - Controllers: `[Entity]Controller.cs` (e.g., `UserController.cs`)
  - Services: `[Entity]Service.cs` (e.g., `UserService.cs`)
  - Repositories: `[Entity]Repository.cs` (e.g., `UserRepository.cs`)
  - Models: `[Entity].cs` (e.g., `User.cs`)
  - DTOs: `[Entity]Dto.cs` (e.g., `UserDto.cs`)

- **Interfaces**: PascalCase with 'I' prefix
  - `IUserService.cs`, `IUserRepository.cs`

- **Configuration Files**:
  - `appsettings.json`
  - `appsettings.Development.json`
  - `Program.cs`

### Project Naming
- Use PascalCase with descriptive prefixes
- Examples: `AppBackend.ApiCore`, `AppBackend.Services`

## Frontend (Next.js/TypeScript)

### Directory Structure
- Use camelCase for most directories
- Examples: `components/`, `services/`, `hooks/`

### File Naming
- **Components**: PascalCase for component names
  - File names: `[ComponentName].tsx` (e.g., `UserCard.tsx`, `InventoryList.tsx`)
  - Note: Some legacy files may use kebab-case (e.g., `ai-search-result-table.tsx`) - prefer PascalCase for new components

- **Pages/Routes**: camelCase
  - `page.tsx`, `layout.tsx`, `loading.tsx`

- **Hooks**: camelCase with 'use' prefix
  - `useAuth.ts`, `useInventory.ts`

- **Services**: camelCase
  - `auth.api.ts`, `inventory.api.ts`

- **Types**: camelCase with appropriate suffix
  - `user.types.ts`, `inventory.types.ts`

- **Utilities**: camelCase
  - `helpers.ts`, `constants.ts`

## Documentation

### Directory Structure
- Use lowercase with hyphens for multi-word names
- Examples: `docs/output/`, `docs/template/`

### File Naming
- Use kebab-case for all documentation files
- Examples: `development-guidelines.md`, `api-spec.md`, `system-overview.md`
- Report files may use numbered prefixes: `Report1_Project Introduction.md`

## Configuration and Build Files

- Follow standard conventions for each technology:
  - `package.json`, `tsconfig.json` (frontend)
  - `.csproj` files (backend)
  - `Dockerfile`, `docker-compose.yml`
  - `.gitignore`, `README.md`

## Test Files

- Backend: `[ClassName]Tests.cs` (e.g., `UserServiceTests.cs`)
- Frontend: `[component].test.tsx` or `[component].spec.tsx`

## Exceptions

- Third-party libraries and generated files may not follow these conventions
- Legacy code should be gradually migrated to follow these rules
- When in doubt, follow the established pattern in the specific directory

## Enforcement

- AI agents must follow these conventions when creating new files
- Code reviews should check for naming consistency
- Automated linting tools should enforce these rules where possible</content>
<parameter name="filePath">d:\Quyen\ISMS\.github\ai-rules\file-naming.md
