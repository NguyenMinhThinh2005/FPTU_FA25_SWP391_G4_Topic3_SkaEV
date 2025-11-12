-- Adds columns required by the updated Vehicle entity.
-- Run against the SkaEV_DB database.

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.vehicles', 'vehicle_name') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD vehicle_name NVARCHAR(120) NOT NULL
        CONSTRAINT DF_vehicles_vehicle_name DEFAULT('Xe của tôi');
END;

IF COL_LENGTH('dbo.vehicles', 'vehicle_type') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD vehicle_type NVARCHAR(40) NOT NULL
        CONSTRAINT DF_vehicles_vehicle_type DEFAULT('car');
END;

IF COL_LENGTH('dbo.vehicles', 'vehicle_year') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD vehicle_year INT NULL;
END;

IF COL_LENGTH('dbo.vehicles', 'color') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD color NVARCHAR(50) NULL;
END;

IF COL_LENGTH('dbo.vehicles', 'max_charging_speed') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD max_charging_speed DECIMAL(10,2) NULL;
END;

IF COL_LENGTH('dbo.vehicles', 'connector_types') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD connector_types NVARCHAR(MAX) NULL;
END;

IF COL_LENGTH('dbo.vehicles', 'battery_capacity') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD battery_capacity DECIMAL(10,2) NULL;
END;

IF COL_LENGTH('dbo.vehicles', 'charging_port_type') IS NULL
BEGIN
    ALTER TABLE dbo.vehicles
    ADD charging_port_type NVARCHAR(50) NULL;
END;

-- Remove legacy VIN column and any dependent constraints/indexes.
IF COL_LENGTH('dbo.vehicles', 'vin') IS NOT NULL
BEGIN
    DECLARE @indexName NVARCHAR(128);
    DECLARE @isConstraint BIT;

    DECLARE vinIndexCursor CURSOR FAST_FORWARD FOR
        SELECT DISTINCT i.name,
               CASE
                   WHEN i.is_primary_key = 1 OR i.is_unique_constraint = 1 THEN 1
                   ELSE 0
               END AS isConstraint
        FROM sys.indexes AS i
        INNER JOIN sys.index_columns AS ic
            ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        INNER JOIN sys.columns AS c
            ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID('dbo.vehicles')
          AND c.name = 'vin';

    OPEN vinIndexCursor;
    FETCH NEXT FROM vinIndexCursor INTO @indexName, @isConstraint;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @isConstraint = 1
        BEGIN
            EXEC('ALTER TABLE dbo.vehicles DROP CONSTRAINT ' + QUOTENAME(@indexName));
        END
        ELSE
        BEGIN
            EXEC('DROP INDEX ' + QUOTENAME(@indexName) + ' ON dbo.vehicles');
        END;

        FETCH NEXT FROM vinIndexCursor INTO @indexName, @isConstraint;
    END;
    CLOSE vinIndexCursor;
    DEALLOCATE vinIndexCursor;

    DECLARE @defaultConstraint NVARCHAR(128);
    SELECT @defaultConstraint = dc.name
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
        ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.vehicles')
      AND c.name = 'vin';

    IF @defaultConstraint IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE dbo.vehicles DROP CONSTRAINT ' + QUOTENAME(@defaultConstraint));
    END;

    IF EXISTS (
        SELECT 1
        FROM sys.foreign_key_columns AS fkc
        INNER JOIN sys.columns AS c
            ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
        WHERE fkc.parent_object_id = OBJECT_ID('dbo.vehicles')
          AND c.name = 'vin'
    )
    BEGIN
        DECLARE vin_fk_cursor CURSOR FAST_FORWARD FOR
            SELECT DISTINCT fk.name
            FROM sys.foreign_keys AS fk
            INNER JOIN sys.foreign_key_columns AS fkc
                ON fk.object_id = fkc.constraint_object_id
            INNER JOIN sys.columns AS c
                ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
            WHERE fk.parent_object_id = OBJECT_ID('dbo.vehicles')
              AND c.name = 'vin';

        DECLARE @fkName NVARCHAR(128);
        OPEN vin_fk_cursor;
        FETCH NEXT FROM vin_fk_cursor INTO @fkName;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            EXEC('ALTER TABLE dbo.vehicles DROP CONSTRAINT ' + QUOTENAME(@fkName));
            FETCH NEXT FROM vin_fk_cursor INTO @fkName;
        END;
        CLOSE vin_fk_cursor;
        DEALLOCATE vin_fk_cursor;
    END;

    ALTER TABLE dbo.vehicles DROP COLUMN vin;
END;

-- Backfill any missing required data.
UPDATE dbo.vehicles
SET vehicle_name = ISNULL(NULLIF(vehicle_name, ''), COALESCE(brand + ' ' + model, license_plate, 'Xe của tôi')),
    vehicle_type = ISNULL(NULLIF(vehicle_type, ''), 'car');

COMMIT;

-- Optional: remove defaults after backfill so future schema matches the model.
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_vehicles_vehicle_name')
BEGIN
    ALTER TABLE dbo.vehicles DROP CONSTRAINT DF_vehicles_vehicle_name;
END;
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_vehicles_vehicle_type')
BEGIN
    ALTER TABLE dbo.vehicles DROP CONSTRAINT DF_vehicles_vehicle_type;
END;
