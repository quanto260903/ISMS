USE IndividualBusiness;
GO

-- ============================================
-- 1. Goods Categories
-- ============================================
INSERT INTO GoodsCategory (GoodsGroupId, GoodsGroupName, IsInactive) VALUES
('CAT01', N'Thực phẩm khô', 0),
('CAT02', N'Đồ uống', 0),
('CAT03', N'Gia vị', 0),
('CAT04', N'Văn phòng phẩm', 0),
('CAT05', N'Thiết bị điện tử', 0);
GO

-- ============================================
-- 2. Goods (20 products with various prices & min stock)
-- ============================================
INSERT INTO Goods (GoodsId, GoodsName, GoodsGroupId, Unit, MinimumStock, FixedPurchasePrice, LastPurchasePrice, SalePrice, VATRate, IsIncludeVAT, IsPromotion, IsInactive, ItemOnHand) VALUES
('SP001', N'Gạo ST25 (5kg)',        'CAT01', N'Bao',   50,  85000,  90000,  120000, '10', 0, 0, 0, 120),
('SP002', N'Mì gói Hảo Hảo',       'CAT01', N'Thùng', 100, 75000,  78000,  95000,  '10', 0, 0, 0, 250),
('SP003', N'Dầu ăn Neptune (1L)',   'CAT01', N'Chai',  30,  32000,  35000,  45000,  '10', 0, 0, 0, 80),
('SP004', N'Nước mắm Nam Ngư',     'CAT03', N'Chai',  40,  18000,  20000,  28000,  '10', 0, 0, 0, 15),
('SP005', N'Đường trắng (1kg)',     'CAT03', N'Kg',    60,  15000,  16000,  22000,  '05', 0, 0, 0, 45),
('SP006', N'Coca Cola (thùng 24)',  'CAT02', N'Thùng', 30,  145000, 150000, 185000, '10', 0, 0, 0, 65),
('SP007', N'Bia Tiger (thùng 24)',  'CAT02', N'Thùng', 20,  280000, 295000, 350000, '10', 0, 0, 0, 40),
('SP008', N'Nước suối Aquafina',    'CAT02', N'Thùng', 50,  55000,  58000,  75000,  '05', 0, 0, 0, 90),
('SP009', N'Bột giặt OMO (3kg)',    'CAT01', N'Túi',   25,  85000,  88000,  110000, '10', 0, 0, 0, 35),
('SP010', N'Giấy A4 Double A',     'CAT04', N'Ram',   40,  58000,  60000,  78000,  '10', 0, 0, 0, 100),
('SP011', N'Bút bi Thiên Long',    'CAT04', N'Hộp',   30,  25000,  27000,  38000,  '10', 0, 0, 0, 120),
('SP012', N'Cà phê G7 (hộp 18)',   'CAT02', N'Hộp',   50,  42000,  45000,  58000,  '10', 0, 0, 0, 180),
('SP013', N'Sữa Vinamilk (thùng)', 'CAT02', N'Thùng', 40,  220000, 230000, 280000, '05', 0, 0, 0, 55),
('SP014', N'Muối iốt (500g)',      'CAT03', N'Gói',   80,  5000,   5500,   8000,   '05', 0, 0, 0, 200),
('SP015', N'Hạt nêm Knorr (400g)', 'CAT03', N'Gói',   35,  22000,  24000,  32000,  '10', 0, 0, 0, 28),
('SP016', N'Tai nghe Bluetooth',    'CAT05', N'Cái',   10,  150000, 165000, 250000, '10', 0, 0, 0, 25),
('SP017', N'Chuột không dây',      'CAT05', N'Cái',   15,  120000, 130000, 195000, '10', 0, 0, 0, 18),
('SP018', N'USB 32GB Kingston',    'CAT05', N'Cái',   20,  85000,  90000,  135000, '10', 0, 0, 0, 30),
('SP019', N'Sổ tay bìa cứng',     'CAT04', N'Cuốn',  50,  15000,  18000,  28000,  '10', 0, 0, 0, 75),
('SP020', N'Băng keo trong',       'CAT04', N'Cuộn',  60,  8000,   9000,   15000,  '10', 0, 0, 0, 150);
GO

-- ============================================
-- 3. Suppliers (as Customers with IsVendor=1)
-- ============================================
INSERT INTO Customer (CustomerId, CustomerName, Address, Phone, TaxId, IsCustomer, IsVendor, IsEnterprise, IsInactive) VALUES
('NCC01', N'Công ty TNHH Thực phẩm Sài Gòn', N'123 Nguyễn Trãi, Q.1, TP.HCM', '0281234567', '0301234567', 0, 1, 1, 0),
('NCC02', N'Đại lý Phước Thành',              N'456 Lê Lợi, Q.3, TP.HCM',       '0287654321', '0307654321', 0, 1, 1, 0),
('NCC03', N'Công ty CP Văn phòng phẩm Hòa Phát', N'789 Hai Bà Trưng, Hà Nội',   '0241112233', '0101112233', 0, 1, 1, 0),
('NCC04', N'Nhà phân phối điện tử Minh Tâm',  N'321 Cách Mạng Tháng 8, Q.10',   '0289998877', '0309998877', 0, 1, 1, 0),
('KH01',  N'Cửa hàng tạp hóa Bích Ngọc',     N'12 Trần Hưng Đạo, Q.5',         '0901234567', NULL, 1, 0, 0, 0),
('KH02',  N'Siêu thị mini FamilyMart',        N'88 Pasteur, Q.1',               '0912345678', '0312345678', 1, 0, 1, 0),
('KH03',  N'Công ty TNHH Dịch vụ An Phát',   N'55 Võ Văn Tần, Q.3',            '0923456789', '0323456789', 1, 0, 1, 0);
GO

-- ============================================
-- 4. Import Vouchers (NK1 - purchases over last 3 months)
-- ============================================
DECLARE @today DATE = GETDATE();

-- Import 1: 3 months ago
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('NK000001', 'NCC01', N'Công ty TNHH Thực phẩm Sài Gòn', DATEADD(DAY, -85, @today), 'NK1', N'Nhập hàng thực phẩm đợt 1');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1) VALUES
('NK000001', 'SP001', N'Gạo ST25 (5kg)',      N'Bao',   80,  85000,  6800000,  '156', '331'),
('NK000001', 'SP002', N'Mì gói Hảo Hảo',     N'Thùng', 150, 75000,  11250000, '156', '331'),
('NK000001', 'SP003', N'Dầu ăn Neptune (1L)', N'Chai',  50,  32000,  1600000,  '156', '331'),
('NK000001', 'SP006', N'Coca Cola (thùng 24)',N'Thùng', 40,  145000, 5800000,  '156', '331');
GO

-- Import 2: 2 months ago
DECLARE @today2 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('NK000002', 'NCC02', N'Đại lý Phước Thành', DATEADD(DAY, -55, @today2), 'NK1', N'Nhập hàng đợt 2');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1) VALUES
('NK000002', 'SP004', N'Nước mắm Nam Ngư',     N'Chai',  60,  18000,  1080000,  '156', '331'),
('NK000002', 'SP005', N'Đường trắng (1kg)',     N'Kg',    100, 15000,  1500000,  '156', '331'),
('NK000002', 'SP007', N'Bia Tiger (thùng 24)',  N'Thùng', 30,  280000, 8400000,  '156', '331'),
('NK000002', 'SP012', N'Cà phê G7 (hộp 18)',   N'Hộp',   100, 42000,  4200000,  '156', '331'),
('NK000002', 'SP013', N'Sữa Vinamilk (thùng)', N'Thùng', 40,  220000, 8800000,  '156', '331');
GO

-- Import 3: 1 month ago
DECLARE @today3 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('NK000003', 'NCC03', N'Công ty CP Văn phòng phẩm Hòa Phát', DATEADD(DAY, -30, @today3), 'NK1', N'Nhập văn phòng phẩm');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1) VALUES
('NK000003', 'SP010', N'Giấy A4 Double A',   N'Ram',   60,  58000, 3480000, '156', '331'),
('NK000003', 'SP011', N'Bút bi Thiên Long',  N'Hộp',   80,  25000, 2000000, '156', '331'),
('NK000003', 'SP019', N'Sổ tay bìa cứng',   N'Cuốn',  50,  15000, 750000,  '156', '331'),
('NK000003', 'SP020', N'Băng keo trong',     N'Cuộn',  100, 8000,  800000,  '156', '331');
GO

-- Import 4: 2 weeks ago
DECLARE @today4 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('NK000004', 'NCC04', N'Nhà phân phối điện tử Minh Tâm', DATEADD(DAY, -14, @today4), 'NK1', N'Nhập thiết bị điện tử');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1) VALUES
('NK000004', 'SP016', N'Tai nghe Bluetooth',   N'Cái', 20, 150000, 3000000, '156', '331'),
('NK000004', 'SP017', N'Chuột không dây',     N'Cái', 15, 120000, 1800000, '156', '331'),
('NK000004', 'SP018', N'USB 32GB Kingston',   N'Cái', 25, 85000,  2125000, '156', '331');
GO

-- Import 5: last week
DECLARE @today5 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('NK000005', 'NCC01', N'Công ty TNHH Thực phẩm Sài Gòn', DATEADD(DAY, -7, @today5), 'NK1', N'Nhập bổ sung thực phẩm');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1) VALUES
('NK000005', 'SP001', N'Gạo ST25 (5kg)',        N'Bao',   60,  90000,  5400000,  '156', '331'),
('NK000005', 'SP002', N'Mì gói Hảo Hảo',       N'Thùng', 120, 78000,  9360000,  '156', '331'),
('NK000005', 'SP008', N'Nước suối Aquafina',    N'Thùng', 60,  55000,  3300000,  '156', '331'),
('NK000005', 'SP009', N'Bột giặt OMO (3kg)',    N'Túi',   30,  85000,  2550000,  '156', '331'),
('NK000005', 'SP014', N'Muối iốt (500g)',       N'Gói',   150, 5000,   750000,   '156', '331'),
('NK000005', 'SP015', N'Hạt nêm Knorr (400g)', N'Gói',   40,  22000,  880000,   '156', '331');
GO

-- Import 6: 3 days ago
DECLARE @today6 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('NK000006', 'NCC02', N'Đại lý Phước Thành', DATEADD(DAY, -3, @today6), 'NK1', N'Nhập bổ sung đồ uống');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1) VALUES
('NK000006', 'SP006', N'Coca Cola (thùng 24)',  N'Thùng', 30,  150000, 4500000,  '156', '331'),
('NK000006', 'SP007', N'Bia Tiger (thùng 24)',  N'Thùng', 20,  295000, 5900000,  '156', '331'),
('NK000006', 'SP012', N'Cà phê G7 (hộp 18)',   N'Hộp',   90,  45000,  4050000,  '156', '331'),
('NK000006', 'SP013', N'Sữa Vinamilk (thùng)', N'Thùng', 25,  230000, 5750000,  '156', '331');
GO

-- ============================================
-- 5. Export Vouchers (XH1 - sales over last 2 months)
-- ============================================

-- Export 1: 2 months ago
DECLARE @todayE1 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('XH000001', 'KH01', N'Cửa hàng tạp hóa Bích Ngọc', DATEADD(DAY, -60, @todayE1), 'XH1', N'Xuất bán hàng tạp hóa');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1, OffsetVoucher) VALUES
('XH000001', 'SP001', N'Gạo ST25 (5kg)',      N'Bao',   20, 120000, 2400000, '632', '156', 'NK000001'),
('XH000001', 'SP002', N'Mì gói Hảo Hảo',     N'Thùng', 30, 95000,  2850000, '632', '156', 'NK000001'),
('XH000001', 'SP006', N'Coca Cola (thùng 24)',N'Thùng', 10, 185000, 1850000, '632', '156', 'NK000001');
GO

-- Export 2: 6 weeks ago
DECLARE @todayE2 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('XH000002', 'KH02', N'Siêu thị mini FamilyMart', DATEADD(DAY, -42, @todayE2), 'XH1', N'Xuất bán siêu thị');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1, OffsetVoucher) VALUES
('XH000002', 'SP004', N'Nước mắm Nam Ngư',     N'Chai',  25, 28000,  700000,   '632', '156', 'NK000002'),
('XH000002', 'SP005', N'Đường trắng (1kg)',     N'Kg',    40, 22000,  880000,   '632', '156', 'NK000002'),
('XH000002', 'SP012', N'Cà phê G7 (hộp 18)',   N'Hộp',   30, 58000,  1740000,  '632', '156', 'NK000002'),
('XH000002', 'SP013', N'Sữa Vinamilk (thùng)', N'Thùng', 15, 280000, 4200000,  '632', '156', 'NK000002');
GO

-- Export 3: 3 weeks ago
DECLARE @todayE3 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('XH000003', 'KH03', N'Công ty TNHH Dịch vụ An Phát', DATEADD(DAY, -21, @todayE3), 'XH1', N'Xuất bán văn phòng phẩm');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1, OffsetVoucher) VALUES
('XH000003', 'SP010', N'Giấy A4 Double A',  N'Ram',   20, 78000,  1560000, '632', '156', 'NK000003'),
('XH000003', 'SP011', N'Bút bi Thiên Long', N'Hộp',   15, 38000,  570000,  '632', '156', 'NK000003'),
('XH000003', 'SP019', N'Sổ tay bìa cứng',  N'Cuốn',  10, 28000,  280000,  '632', '156', 'NK000003');
GO

-- Export 4: 10 days ago
DECLARE @todayE4 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('XH000004', 'KH01', N'Cửa hàng tạp hóa Bích Ngọc', DATEADD(DAY, -10, @todayE4), 'XH1', N'Xuất bán đợt 2');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1, OffsetVoucher) VALUES
('XH000004', 'SP001', N'Gạo ST25 (5kg)',        N'Bao',   15, 120000, 1800000, '632', '156', 'NK000001'),
('XH000004', 'SP003', N'Dầu ăn Neptune (1L)',   N'Chai',  10, 45000,  450000,  '632', '156', 'NK000001'),
('XH000004', 'SP007', N'Bia Tiger (thùng 24)',  N'Thùng', 10, 350000, 3500000, '632', '156', 'NK000002'),
('XH000004', 'SP008', N'Nước suối Aquafina',    N'Thùng', 20, 75000,  1500000, '632', '156', 'NK000005'),
('XH000004', 'SP014', N'Muối iốt (500g)',       N'Gói',   50, 8000,   400000,  '632', '156', 'NK000005');
GO

-- Export 5: 5 days ago
DECLARE @todayE5 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('XH000005', 'KH02', N'Siêu thị mini FamilyMart', DATEADD(DAY, -5, @todayE5), 'XH1', N'Xuất bán siêu thị đợt 2');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1, OffsetVoucher) VALUES
('XH000005', 'SP002', N'Mì gói Hảo Hảo',       N'Thùng', 40, 95000,  3800000,  '632', '156', 'NK000005'),
('XH000005', 'SP009', N'Bột giặt OMO (3kg)',    N'Túi',   10, 110000, 1100000,  '632', '156', 'NK000005'),
('XH000005', 'SP015', N'Hạt nêm Knorr (400g)', N'Gói',   15, 32000,  480000,   '632', '156', 'NK000005'),
('XH000005', 'SP016', N'Tai nghe Bluetooth',    N'Cái',   5,  250000, 1250000,  '632', '156', 'NK000004'),
('XH000005', 'SP018', N'USB 32GB Kingston',     N'Cái',   8,  135000, 1080000,  '632', '156', 'NK000004');
GO

-- Export 6: 2 days ago
DECLARE @todayE6 DATE = GETDATE();
INSERT INTO Voucher (VoucherID, CustomerID, CustomerName, VoucherDate, VoucherCode, VoucherDescription)
VALUES ('XH000006', 'KH03', N'Công ty TNHH Dịch vụ An Phát', DATEADD(DAY, -2, @todayE6), 'XH1', N'Xuất bán gần nhất');
INSERT INTO VoucherDetail (VoucherID, GoodsId, GoodsName, Unit, Quantity, UnitPrice, Amount1, DebitAccount1, CreditAccount1, OffsetVoucher) VALUES
('XH000006', 'SP006', N'Coca Cola (thùng 24)',  N'Thùng', 15, 185000, 2775000, '632', '156', 'NK000006'),
('XH000006', 'SP012', N'Cà phê G7 (hộp 18)',   N'Hộp',   20, 58000,  1160000, '632', '156', 'NK000006'),
('XH000006', 'SP017', N'Chuột không dây',      N'Cái',   5,  195000, 975000,  '632', '156', 'NK000004'),
('XH000006', 'SP020', N'Băng keo trong',       N'Cuộn',  30, 15000,  450000,  '632', '156', 'NK000003');
GO

-- ============================================
-- 6. Opening Inventory (for baseline stock)
-- ============================================
INSERT INTO OpenInventory (CreateDate, GoodsId, Unit, Quantity, Debit_Amount0) VALUES
(GETDATE(), 'SP001', N'Bao',   20,  1800000),
(DATEADD(SECOND, 1, GETDATE()), 'SP002', N'Thùng', 30,  2340000),
(DATEADD(SECOND, 2, GETDATE()), 'SP003', N'Chai',  40,  1400000),
(DATEADD(SECOND, 3, GETDATE()), 'SP004', N'Chai',  20,  400000),
(DATEADD(SECOND, 4, GETDATE()), 'SP005', N'Kg',    15,  240000),
(DATEADD(SECOND, 5, GETDATE()), 'SP006', N'Thùng', 10,  1500000),
(DATEADD(SECOND, 6, GETDATE()), 'SP007', N'Thùng', 10,  2950000),
(DATEADD(SECOND, 7, GETDATE()), 'SP008', N'Thùng', 30,  1740000),
(DATEADD(SECOND, 8, GETDATE()), 'SP009', N'Túi',   15,  1320000),
(DATEADD(SECOND, 9, GETDATE()), 'SP010', N'Ram',   40,  2400000),
(DATEADD(SECOND, 10, GETDATE()), 'SP011', N'Hộp',  40,  1080000),
(DATEADD(SECOND, 11, GETDATE()), 'SP012', N'Hộp',  30,  1350000),
(DATEADD(SECOND, 12, GETDATE()), 'SP013', N'Thùng', 15, 3450000),
(DATEADD(SECOND, 13, GETDATE()), 'SP014', N'Gói',  100, 550000),
(DATEADD(SECOND, 14, GETDATE()), 'SP015', N'Gói',  20,  480000),
(DATEADD(SECOND, 15, GETDATE()), 'SP016', N'Cái',  10,  1650000),
(DATEADD(SECOND, 16, GETDATE()), 'SP017', N'Cái',  8,   1040000),
(DATEADD(SECOND, 17, GETDATE()), 'SP018', N'Cái',  13,  1170000),
(DATEADD(SECOND, 18, GETDATE()), 'SP019', N'Cuốn', 25,  450000),
(DATEADD(SECOND, 19, GETDATE()), 'SP020', N'Cuộn', 50,  450000);
GO

PRINT 'Seed data inserted successfully!';
GO
