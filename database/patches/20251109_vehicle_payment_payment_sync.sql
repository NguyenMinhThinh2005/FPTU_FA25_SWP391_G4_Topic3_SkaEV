/* ============================================================================
    SkaEV Vehicle + Payment schema sync
    Áp dụng cho SQL Server / SQL Express.
    Review kỹ trước khi chạy trên PROD – BACKUP LUÔN LÀ BẮT BUỘC!
============================================================================ */
USE master;
GO

-- 1. Optional safety backup (thay đổi đường dẫn+DB theo môi trường thật)
BACKUP DATABASE SkaEV_DB 
TO DISK = N'D:\SqlBackups\SkaEV_DB_PreVehiclePaymentRefactor.bak'
   WITH FORMAT, INIT, NAME = N'SkaEV_DB_PreVehiclePaymentRefactor';
GO

USE SkaEV_DB;
GO

-- 2. Bắt đầu phiên giao dịch an toàn
BEGIN TRY
    BEGIN TRANSACTION SchemaSync_VehiclePayment;

    /* ============================================================
       VEHICLES table hardening
       ============================================================ */

    -- 2.1 Gỡ mọi ràng buộc/index dính tới cột VIN/legacy license_plate
    DECLARE @sql NVARCHAR(MAX) = N'';
    SELECT @sql = @sql + N'DROP INDEX ' + QUOTENAME(i.name) + N' ON dbo.vehicles;'
    FROM sys.indexes AS i
    JOIN sys.index_columns AS ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns AS c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.vehicles')
      AND c.name IN (N'vin', N'license_plate');

    EXEC sp_executesql @sql;

    DECLARE @constraint NVARCHAR(128);
    SELECT TOP(1) @constraint = kc.name
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID(N'dbo.vehicles')
      AND c.name IN (N'vin', N'license_plate');

    IF @constraint IS NOT NULL
    BEGIN
        EXEC(N'ALTER TABLE dbo.vehicles DROP CONSTRAINT ' + QUOTENAME(@constraint) + ';');
    END;

    -- 2.2 Thêm / chuẩn hoá cột mới (chỉ thêm nếu chưa có)
    IF COL_LENGTH(N'dbo.vehicles', N'vehicle_name') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD vehicle_name NVARCHAR(120) NOT NULL CONSTRAINT DF_vehicles_vehicle_name DEFAULT (N'EV chưa đặt tên');
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'vehicle_type') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD vehicle_type NVARCHAR(80) NOT NULL CONSTRAINT DF_vehicles_vehicle_type DEFAULT (N'car');
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'vehicle_year') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD vehicle_year INT NULL;
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'color') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD color NVARCHAR(50) NULL;
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'max_charging_speed') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD max_charging_speed DECIMAL(10,2) NULL;
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'connector_types') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD connector_types NVARCHAR(MAX) NULL;
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'battery_capacity') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD battery_capacity DECIMAL(10,2) NULL;
    END;

    IF COL_LENGTH(N'dbo.vehicles', N'charging_port_type') IS NULL
    BEGIN
        ALTER TABLE dbo.vehicles
        ADD charging_port_type NVARCHAR(50) NULL;
    END;

    -- 2.3 Dọn dữ liệu license_plate, VIN -> format mới rồi drop VIN
    UPDATE dbo.vehicles
    SET license_plate = UPPER(REPLACE(LTRIM(RTRIM(license_plate)), ' ', ''))
    WHERE license_plate IS NOT NULL;

    UPDATE dbo.vehicles
    SET license_plate = CONCAT('TEMPPLATE-', vehicle_id)
    WHERE license_plate IS NULL OR license_plate = '';

    UPDATE dbo.vehicles
    SET vehicle_name = ISNULL(NULLIF(vehicle_name, ''), COALESCE(brand + N' ' + model, license_plate, N'EV chưa đặt tên')),
        vehicle_type = ISNULL(NULLIF(vehicle_type, ''), N'car');

    UPDATE dbo.vehicles
    SET color = NULLIF(color, ''),
        connector_types = NULLIF(connector_types, '');

    -- Drop VIN + ràng buộc nếu còn tồn tại
    IF COL_LENGTH(N'dbo.vehicles', N'vin') IS NOT NULL
    BEGIN
        DECLARE @fkVin NVARCHAR(128);
        DECLARE vinCur CURSOR FAST_FORWARD FOR
            SELECT fk.name
            FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE fk.parent_object_id = OBJECT_ID(N'dbo.vehicles')
              AND c.name = N'vin';

        OPEN vinCur;
        FETCH NEXT FROM vinCur INTO @fkVin;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            EXEC(N'ALTER TABLE dbo.vehicles DROP CONSTRAINT ' + QUOTENAME(@fkVin) + ';');
            FETCH NEXT FROM vinCur INTO @fkVin;
        END;
        CLOSE vinCur;
        DEALLOCATE vinCur;

        DECLARE @dfVin NVARCHAR(128);
        SELECT @dfVin = dc.name
        FROM sys.default_constraints dc
        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.vehicles')
          AND c.name = N'vin';

        IF @dfVin IS NOT NULL
        BEGIN
            EXEC(N'ALTER TABLE dbo.vehicles DROP CONSTRAINT ' + QUOTENAME(@dfVin) + ';');
        END;

        ALTER TABLE dbo.vehicles DROP COLUMN vin;
    END;

    -- 2.4 Unique index mới: biển số không rỗng phải unique
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = N'UX_Vehicles_LicensePlate_Filtered' 
          AND object_id = OBJECT_ID(N'dbo.vehicles')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_Vehicles_LicensePlate_Filtered
            ON dbo.vehicles(license_plate)
            WHERE license_plate IS NOT NULL;
    END;

    -- Bỏ default constraint if không muốn giữ
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_vehicles_vehicle_name')
        ALTER TABLE dbo.vehicles DROP CONSTRAINT DF_vehicles_vehicle_name;
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_vehicles_vehicle_type')
        ALTER TABLE dbo.vehicles DROP CONSTRAINT DF_vehicles_vehicle_type;

    /* ============================================================
       PAYMENT_METHODS table
       ============================================================ */

    -- Đảm bảo cột tồn tại đầy đủ (đa số có sẵn, chỉ chèn nếu thiếu)
    IF COL_LENGTH(N'dbo.payment_methods', N'provider') IS NULL
        ALTER TABLE dbo.payment_methods ADD provider NVARCHAR(50) NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'card_number_last4') IS NULL
        ALTER TABLE dbo.payment_methods ADD card_number_last4 NVARCHAR(4) NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'cardholder_name') IS NULL
        ALTER TABLE dbo.payment_methods ADD cardholder_name NVARCHAR(255) NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'expiry_month') IS NULL
        ALTER TABLE dbo.payment_methods ADD expiry_month INT NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'expiry_year') IS NULL
        ALTER TABLE dbo.payment_methods ADD expiry_year INT NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'wallet_phone_number') IS NULL
        ALTER TABLE dbo.payment_methods ADD wallet_phone_number NVARCHAR(20) NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'wallet_email') IS NULL
        ALTER TABLE dbo.payment_methods ADD wallet_email NVARCHAR(255) NULL;

    IF COL_LENGTH(N'dbo.payment_methods', N'is_default') IS NULL
        ALTER TABLE dbo.payment_methods ADD is_default BIT NOT NULL CONSTRAINT DF_payment_methods_is_default DEFAULT (0);
    ELSE
        UPDATE dbo.payment_methods SET is_default = ISNULL(is_default, 0);

    IF COL_LENGTH(N'dbo.payment_methods', N'is_active') IS NULL
        ALTER TABLE dbo.payment_methods ADD is_active BIT NOT NULL CONSTRAINT DF_payment_methods_is_active DEFAULT (1);
    ELSE
        UPDATE dbo.payment_methods SET is_active = ISNULL(is_active, 1);

    -- Chuẩn hoá CreatedAt/UpdatedAt
    IF COL_LENGTH(N'dbo.payment_methods', N'created_at') IS NULL
        ALTER TABLE dbo.payment_methods ADD created_at DATETIME2(0) NOT NULL CONSTRAINT DF_payment_methods_created_at DEFAULT (SYSUTCDATETIME());
    IF COL_LENGTH(N'dbo.payment_methods', N'updated_at') IS NULL
        ALTER TABLE dbo.payment_methods ADD updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_payment_methods_updated_at DEFAULT (SYSUTCDATETIME());
    ELSE
        UPDATE dbo.payment_methods SET updated_at = ISNULL(updated_at, SYSUTCDATETIME());

    -- FK -> users (đảm bảo tồn tại)
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.foreign_keys 
        WHERE name = N'FK_payment_methods_users' 
          AND parent_object_id = OBJECT_ID(N'dbo.payment_methods')
    )
    BEGIN
        ALTER TABLE dbo.payment_methods
        ADD CONSTRAINT FK_payment_methods_users
            FOREIGN KEY (user_id) REFERENCES dbo.users(user_id);
    END;

    -- Unique filtered index: chỉ duy nhất 1 phương thức mặc định / user
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = N'UX_PaymentMethods_User_Default' 
          AND object_id = OBJECT_ID(N'dbo.payment_methods')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_PaymentMethods_User_Default
            ON dbo.payment_methods(user_id)
            WHERE is_default = 1;
    END;

    -- Index tối ưu truy vấn (nếu chưa có)
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = N'IX_PaymentMethods_UserId' 
          AND object_id = OBJECT_ID(N'dbo.payment_methods')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_PaymentMethods_UserId
            ON dbo.payment_methods(user_id, is_active)
            INCLUDE(provider, card_number_last4, is_default);
    END;

    /* ============================================================
       PAYMENTS + INVOICES
       ============================================================ */

    -- Đảm bảo payments table có cột cần thiết
    IF COL_LENGTH(N'dbo.payments', N'payment_method_id') IS NULL
        ALTER TABLE dbo.payments ADD payment_method_id INT NULL;

    IF COL_LENGTH(N'dbo.payments', N'status') IS NULL
        ALTER TABLE dbo.payments ADD status NVARCHAR(50) NOT NULL CONSTRAINT DF_payments_status DEFAULT (N'pending');

    IF COL_LENGTH(N'dbo.payments', N'transaction_id') IS NULL
        ALTER TABLE dbo.payments ADD transaction_id NVARCHAR(255) NULL;

    IF COL_LENGTH(N'dbo.payments', N'processed_at') IS NULL
        ALTER TABLE dbo.payments ADD processed_at DATETIME2(0) NULL;

    IF COL_LENGTH(N'dbo.payments', N'processed_by_staff_id') IS NULL
        ALTER TABLE dbo.payments ADD processed_by_staff_id INT NULL;

    -- FK -> payment_methods
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = N'FK_payments_payment_methods' 
          AND parent_object_id = OBJECT_ID(N'dbo.payments')
    )
    BEGIN
        ALTER TABLE dbo.payments
        ADD CONSTRAINT FK_payments_payment_methods
            FOREIGN KEY (payment_method_id) REFERENCES dbo.payment_methods(payment_method_id);
    END;

    -- FK -> invoices
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = N'FK_payments_invoices' 
          AND parent_object_id = OBJECT_ID(N'dbo.payments')
    )
    BEGIN
        ALTER TABLE dbo.payments
        ADD CONSTRAINT FK_payments_invoices
            FOREIGN KEY (invoice_id) REFERENCES dbo.invoices(invoice_id);
    END;

    -- FK -> users (processed_by_staff_id optional)
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = N'FK_payments_users_processed' 
          AND parent_object_id = OBJECT_ID(N'dbo.payments')
    )
    BEGIN
        ALTER TABLE dbo.payments
        ADD CONSTRAINT FK_payments_users_processed
            FOREIGN KEY (processed_by_staff_id) REFERENCES dbo.users(user_id);
    END;

    -- invoices: đảm bảo cột payment_method / status
    IF COL_LENGTH(N'dbo.invoices', N'payment_method') IS NULL
        ALTER TABLE dbo.invoices ADD payment_method NVARCHAR(50) NULL;

    IF COL_LENGTH(N'dbo.invoices', N'payment_status') IS NULL
        ALTER TABLE dbo.invoices ADD payment_status NVARCHAR(50) NOT NULL CONSTRAINT DF_invoices_payment_status DEFAULT (N'pending');

    -- Index hỗ trợ thanh toán/tra cứu
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = N'IX_Payments_InvoiceId' 
          AND object_id = OBJECT_ID(N'dbo.payments')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Payments_InvoiceId
            ON dbo.payments(invoice_id);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = N'IX_Payments_Method_Status' 
          AND object_id = OBJECT_ID(N'dbo.payments')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Payments_Method_Status
            ON dbo.payments(payment_method_id, status);
    END;

    -- Trigger updated_at mới cho payment_methods (nếu muốn đảm bảo đồng bộ)
    IF OBJECT_ID(N'dbo.trg_payment_methods_set_updated_at', N'TR') IS NULL
    BEGIN
        EXEC(N'
            CREATE TRIGGER dbo.trg_payment_methods_set_updated_at
            ON dbo.payment_methods
            AFTER UPDATE
            AS
            BEGIN
                SET NOCOUNT ON;
                UPDATE pm
                SET updated_at = SYSUTCDATETIME()
                FROM dbo.payment_methods pm
                JOIN inserted i ON pm.payment_method_id = i.payment_method_id;
            END;
        ');
    END;

    /* ============================================================
       DATA CLEANUP / DEFAULTS
       ============================================================ */

    -- Chuẩn hoá dữ liệu default
    UPDATE dbo.payment_methods
    SET is_default = 0
    WHERE is_default IS NULL;

    ;WITH ranked AS (
        SELECT payment_method_id,
               user_id,
               is_default,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY is_default DESC, updated_at DESC) AS rn
        FROM dbo.payment_methods
        WHERE is_active = 1
    )
    UPDATE ranked
    SET is_default = CASE WHEN rn = 1 THEN 1 ELSE 0 END;

    -- Sample patch: đảm bảo vehicle_name có giá trị
    UPDATE dbo.vehicles
    SET vehicle_name = COALESCE(NULLIF(vehicle_name, ''), CONCAT(N'Xe ', vehicle_id));

    /* ============================================================
       Kiểm thử sau khi đồng bộ
       ============================================================ */
    IF OBJECT_ID('tempdb..#SchemaVerification') IS NOT NULL
        DROP TABLE #SchemaVerification;

    CREATE TABLE #SchemaVerification (
        Section NVARCHAR(100),
        Status NVARCHAR(20),
        Details NVARCHAR(MAX)
    );

    INSERT INTO #SchemaVerification(Section, Status, Details)
    SELECT N'VEHICLES', N'OK', CONCAT(N'Total rows: ', COUNT(*))
    FROM dbo.vehicles;

    INSERT INTO #SchemaVerification(Section, Status, Details)
    SELECT N'PAYMENT_METHODS', N'OK', CONCAT(N'Active methods: ', SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END))
    FROM dbo.payment_methods;

    INSERT INTO #SchemaVerification(Section, Status, Details)
    SELECT N'PAYMENTS', N'OK', CONCAT(N'Completed payments: ', SUM(CASE WHEN status = ''completed'' THEN 1 ELSE 0 END))
    FROM dbo.payments;

    SELECT * FROM #SchemaVerification;

    COMMIT TRANSACTION SchemaSync_VehiclePayment;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION SchemaSync_VehiclePayment;

    DECLARE @Err NVARCHAR(MAX) = ERROR_MESSAGE();
    RAISERROR(N'[SchemaSync_VehiclePayment] FAILED: %s', 16, 1, @Err);
END CATCH;
GO
