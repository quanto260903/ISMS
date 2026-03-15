# Use the official .NET 9 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["AppBackend.sln", "./"]
COPY ["AppBackend.ApiCore/AppBackend.ApiCore.csproj", "AppBackend.ApiCore/"]
COPY ["AppBackend.Services/AppBackend.Services.csproj", "AppBackend.Services/"]
COPY ["AppBackend.Repositories/AppBackend.Repositories.csproj", "AppBackend.Repositories/"]
COPY ["AppBackend.BusinessObjects/AppBackend.BusinessObjects.csproj", "AppBackend.BusinessObjects/"]

RUN dotnet restore

# Copy everything else and build
COPY . .
WORKDIR "/src/AppBackend.ApiCore"
RUN dotnet build "AppBackend.ApiCore.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "AppBackend.ApiCore.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 9 runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["dotnet", "AppBackend.ApiCore.dll"]