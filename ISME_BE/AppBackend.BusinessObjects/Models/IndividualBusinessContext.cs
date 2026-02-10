using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace AppBackend.BusinessObjects.Models;

public partial class IndividualBusinessContext : DbContext
{
    public IndividualBusinessContext()
    {
    }

    public IndividualBusinessContext(DbContextOptions<IndividualBusinessContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ActivityLog> ActivityLogs { get; set; }

    public virtual DbSet<Bank> Banks { get; set; }

    public virtual DbSet<BankAccount> BankAccounts { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<Good> Goods { get; set; }

    public virtual DbSet<GoodsCategory> GoodsCategories { get; set; }

    public virtual DbSet<OpenBank> OpenBanks { get; set; }

    public virtual DbSet<OpenCash> OpenCashes { get; set; }

    public virtual DbSet<OpenCustomer> OpenCustomers { get; set; }

    public virtual DbSet<OpenInventory> OpenInventories { get; set; }

    public virtual DbSet<Unit> Units { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Voucher> Vouchers { get; set; }

    public virtual DbSet<VoucherDetail> VoucherDetails { get; set; }

    public virtual DbSet<Warehouse> Warehouses { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=localhost\\SQLEXPRESS;Initial Catalog=Individual_Business;Integrated Security=True;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Activity__3214EC076E25138D");

            entity.Property(e => e.Action).HasMaxLength(255);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Module).HasMaxLength(100);
            entity.Property(e => e.UserId).HasMaxLength(16);

            entity.HasOne(d => d.User).WithMany(p => p.ActivityLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_ActivityLogs_Users");
        });

        modelBuilder.Entity<Bank>(entity =>
        {
            entity.HasKey(e => e.BankId).HasName("PK__Banks__AA08CB13EBCEC759");

            entity.Property(e => e.BankDescription).HasMaxLength(500);
            entity.Property(e => e.FullName).HasMaxLength(255);
            entity.Property(e => e.Logo).HasMaxLength(255);
            entity.Property(e => e.ShortName).HasMaxLength(50);
        });

        modelBuilder.Entity<BankAccount>(entity =>
        {
            entity.HasKey(e => e.BankAccountId).HasName("PK__BankAcco__4FC8E4A11FBED9BE");

            entity.HasIndex(e => new { e.BankId, e.AccountNumber }, "UQ_BankAccounts_BankId_AccountNumber").IsUnique();

            entity.Property(e => e.AccountName).HasMaxLength(255);
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.CustomerId).HasName("PK__Customer__A4AE64D8819E9F5F");

            entity.ToTable("Customer");

            entity.Property(e => e.CustomerId).HasMaxLength(256);
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.CustomerName).HasMaxLength(256);
            entity.Property(e => e.IsCustomer).HasDefaultValue(true);
            entity.Property(e => e.IsEnterprise).HasDefaultValue(false);
            entity.Property(e => e.IsVendor).HasDefaultValue(false);
            entity.Property(e => e.Phone).HasMaxLength(12);
            entity.Property(e => e.TaxId).HasMaxLength(14);
        });

        modelBuilder.Entity<Good>(entity =>
        {
            entity.HasKey(e => e.GoodsId).HasName("PK__Goods__663DA9208267C5F2");

            entity.Property(e => e.GoodsId).HasMaxLength(50);
            entity.Property(e => e.CreatedDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.FixedPurchasePrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.GoodsGroupId).HasMaxLength(50);
            entity.Property(e => e.GoodsName).HasMaxLength(255);
            entity.Property(e => e.IsIncludeVat).HasColumnName("IsIncludeVAT");
            entity.Property(e => e.LastPurchasePrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.MinimumStock).HasDefaultValue(0);
            entity.Property(e => e.SalePrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.Vatrate)
                .HasMaxLength(2)
                .IsUnicode(false)
                .HasDefaultValue("10")
                .IsFixedLength()
                .HasColumnName("VATRate");

            entity.HasOne(d => d.GoodsGroup).WithMany(p => p.Goods)
                .HasForeignKey(d => d.GoodsGroupId)
                .HasConstraintName("FK_Goodss_GoodsGroups");
        });

        modelBuilder.Entity<GoodsCategory>(entity =>
        {
            entity.HasKey(e => e.GoodsGroupId).HasName("PK__GoodsCat__609AEEF9F6B1A251");

            entity.ToTable("GoodsCategory");

            entity.Property(e => e.GoodsGroupId).HasMaxLength(50);
            entity.Property(e => e.GoodsGroupName).HasMaxLength(255);
        });

        modelBuilder.Entity<OpenBank>(entity =>
        {
            entity.HasKey(e => e.CreateDate).HasName("PK__OpenBank__CE101B319D873E19");

            entity.ToTable("OpenBank");

            entity.Property(e => e.CreateDate).HasColumnType("datetime");
            entity.Property(e => e.AccountNumber).HasMaxLength(50);
            entity.Property(e => e.DebitAmount0)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("Debit_Amount0");
            entity.Property(e => e.Properties).HasMaxLength(50);
        });

        modelBuilder.Entity<OpenCash>(entity =>
        {
            entity.HasKey(e => e.CreateDate).HasName("PK__OpenCash__CE101B316DCF7CE1");

            entity.ToTable("OpenCash");

            entity.Property(e => e.CreateDate).HasColumnType("datetime");
            entity.Property(e => e.DebitAmount0)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("Debit_Amount0");
            entity.Property(e => e.Properties).HasMaxLength(50);
        });

        modelBuilder.Entity<OpenCustomer>(entity =>
        {
            entity.HasKey(e => e.CreateDate).HasName("PK__OpenCust__CE101B31ADD8B8B4");

            entity.ToTable("OpenCustomer");

            entity.Property(e => e.CreateDate).HasColumnType("datetime");
            entity.Property(e => e.CustomerCreditAmount0).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.CustomerDebitAmount0).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.CustomerId).HasMaxLength(256);
            entity.Property(e => e.Properties).HasMaxLength(50);
            entity.Property(e => e.VendorCreditAmount0).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.VendorDebitAmount0).HasColumnType("decimal(18, 0)");
        });

        modelBuilder.Entity<OpenInventory>(entity =>
        {
            entity.HasKey(e => e.CreateDate).HasName("PK__OpenInve__CE101B314486F2BE");

            entity.ToTable("OpenInventory");

            entity.Property(e => e.CreateDate).HasColumnType("datetime");
            entity.Property(e => e.DebitAmount0)
                .HasColumnType("decimal(18, 0)")
                .HasColumnName("Debit_Amount0");
            entity.Property(e => e.Properties).HasMaxLength(50);
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.WarehouseId).HasMaxLength(50);
        });

        modelBuilder.Entity<Unit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Units__3214EC07F90AC629");

            entity.Property(e => e.Unit1)
                .HasMaxLength(50)
                .HasColumnName("Unit");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4CCB87DD9F");

            entity.Property(e => e.UserId).HasMaxLength(16);
            entity.Property(e => e.ContractType).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(256);
            entity.Property(e => e.IdcardNumber)
                .HasMaxLength(64)
                .HasColumnName("IDCardNumber");
            entity.Property(e => e.InssuranceSalary).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IssuedBy).HasMaxLength(255);
            entity.Property(e => e.NegotiatedSalary).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Username).HasMaxLength(100);
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.VoucherId).HasName("PK__Voucher__3AEE79C16766E2DF");

            entity.ToTable("Voucher");

            entity.Property(e => e.VoucherId)
                .HasMaxLength(50)
                .HasColumnName("VoucherID");
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.CustomerId)
                .HasMaxLength(50)
                .HasColumnName("CustomerID");
            entity.Property(e => e.CustomerName).HasMaxLength(255);
            entity.Property(e => e.InvoiceId).HasMaxLength(50);
            entity.Property(e => e.InvoiceNumber).HasMaxLength(50);
            entity.Property(e => e.InvoiceType).HasMaxLength(50);
            entity.Property(e => e.Pic)
                .HasMaxLength(150)
                .HasColumnName("PIC");
            entity.Property(e => e.TaxCode).HasMaxLength(50);
            entity.Property(e => e.VoucherDescription).HasMaxLength(500);
            entity.Property(e => e.VoucherNumber).HasMaxLength(50);
        });

        modelBuilder.Entity<VoucherDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VoucherD__3214EC073D7C1DE3");

            entity.ToTable("VoucherDetail");

            entity.Property(e => e.Amount1).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.Amount2).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.CreatedDateTime)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.CreditAccount1).HasMaxLength(50);
            entity.Property(e => e.CreditAccount2).HasMaxLength(50);
            entity.Property(e => e.CreditWarehouseId).HasMaxLength(50);
            entity.Property(e => e.DebitAccount1).HasMaxLength(50);
            entity.Property(e => e.DebitAccount2).HasMaxLength(50);
            entity.Property(e => e.DebitWarehouseId).HasMaxLength(50);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.DiscountRate).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.GoodsId).HasMaxLength(50);
            entity.Property(e => e.GoodsName).HasMaxLength(255);
            entity.Property(e => e.OffsetVoucher).HasMaxLength(50);
            entity.Property(e => e.Promotion).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.Unit).HasMaxLength(50);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 0)");
            entity.Property(e => e.UserId)
                .HasMaxLength(16)
                .HasColumnName("UserID");
            entity.Property(e => e.Vat)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("VAT");
            entity.Property(e => e.VoucherId)
                .HasMaxLength(50)
                .HasColumnName("VoucherID");
            entity.Property(e => e.WarehouseId2).HasMaxLength(50);

            entity.HasOne(d => d.Voucher).WithMany(p => p.VoucherDetails)
                .HasForeignKey(d => d.VoucherId)
                .HasConstraintName("FK_Detail_Header");
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.HasKey(e => e.WarehouseId).HasName("PK__Warehous__2608AFF92FA3CB14");

            entity.Property(e => e.WarehouseId).HasMaxLength(50);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.WarehouseName).HasMaxLength(255);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
