IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    ALTER TABLE [vehicles] ADD [vehicle_year] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    ALTER TABLE [vehicles] ADD [vin] nvarchar(32) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    ALTER TABLE [vehicles] ADD [color] nvarchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    ALTER TABLE [vehicles] ADD [max_charging_speed] decimal(10,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    ALTER TABLE [vehicles] ADD [connector_types] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN

    DECLARE @dropIndexSql NVARCHAR(MAX) = N'';

    SELECT @dropIndexSql = @dropIndexSql + 'DROP INDEX [' + i.name + '] ON [vehicles];'
    FROM sys.indexes AS i
    INNER JOIN sys.index_columns AS ic
        ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN sys.columns AS c
        ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID('vehicles')
      AND c.name = 'license_plate'
        AND i.is_primary_key = 0
        AND i.is_unique_constraint = 0;

    IF (@dropIndexSql <> N'')
    BEGIN
        EXEC sp_executesql @dropIndexSql;
    END

    DECLARE @constraintName NVARCHAR(128);

    SELECT TOP (1) @constraintName = kc.name
    FROM sys.key_constraints AS kc
    INNER JOIN sys.index_columns AS ic
        ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    INNER JOIN sys.columns AS c
        ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID('vehicles')
      AND c.name = 'license_plate';

    IF (@constraintName IS NOT NULL)
    BEGIN
        EXEC('ALTER TABLE vehicles DROP CONSTRAINT [' + @constraintName + ']');
    END;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN

                    UPDATE vehicles
                    SET license_plate = UPPER(REPLACE(license_plate, ' ', ''))
                    WHERE license_plate IS NOT NULL;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN

                    UPDATE vehicles
                    SET license_plate = CONCAT('TEMPPLATE-', vehicle_id)
                    WHERE license_plate IS NULL OR license_plate = '';
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN

                    UPDATE vehicles
                    SET vin = CONCAT('TEMPVIN-', vehicle_id)
                    WHERE vin IS NULL OR vin = '';
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN

                    ALTER TABLE vehicles
                    ALTER COLUMN license_plate NVARCHAR(32) NOT NULL;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN

                    ALTER TABLE vehicles
                    ALTER COLUMN vin NVARCHAR(32) NOT NULL;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    CREATE UNIQUE INDEX [IX_vehicles_license_plate] ON [vehicles] ([license_plate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    CREATE UNIQUE INDEX [IX_vehicles_vin] ON [vehicles] ([vin]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251107114031_AddVehicleConstraintsAndFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251107114031_AddVehicleConstraintsAndFields', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    DROP INDEX [IX_vehicles_license_plate] ON [vehicles];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    DROP INDEX [IX_vehicles_vin] ON [vehicles];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[vehicles]') AND [c].[name] = N'vin');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [vehicles] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [vehicles] ALTER COLUMN [vin] nvarchar(32) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[vehicles]') AND [c].[name] = N'license_plate');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [vehicles] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [vehicles] ALTER COLUMN [license_plate] nvarchar(32) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN

                    UPDATE vehicles
                    SET vin = NULL
                    WHERE vin LIKE 'TEMPVIN-%';
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN

                    UPDATE vehicles
                    SET license_plate = NULL
                    WHERE license_plate LIKE 'TEMPPLATE-%';
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_vehicles_license_plate] ON [vehicles] ([license_plate]) WHERE [license_plate] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_vehicles_vin] ON [vehicles] ([vin]) WHERE [vin] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251108135012_AllowOptionalVehicleVin'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251108135012_AllowOptionalVehicleVin', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110154259_AddActiveSessionsToChargingStation'
)
BEGIN
    ALTER TABLE [charging_stations] ADD [ActiveSessions] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110154259_AddActiveSessionsToChargingStation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251110154259_AddActiveSessionsToChargingStation', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    ALTER TABLE [incidents] ADD [assigned_to_team_id] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE TABLE [maintenance_teams] (
        [maintenance_team_id] int NOT NULL IDENTITY,
        [name] nvarchar(255) NOT NULL,
        [contact_person] nvarchar(255) NULL,
        [contact_phone] nvarchar(50) NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NOT NULL,
        CONSTRAINT [PK_maintenance_teams] PRIMARY KEY ([maintenance_team_id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE TABLE [support_requests] (
        [request_id] int NOT NULL IDENTITY,
        [user_id] int NOT NULL,
        [category] nvarchar(50) NOT NULL,
        [subject] nvarchar(200) NOT NULL,
        [description] nvarchar(2000) NOT NULL,
        [status] nvarchar(20) NOT NULL,
        [priority] nvarchar(20) NOT NULL,
        [assigned_to] int NULL,
        [related_booking_id] int NULL,
        [related_station_id] int NULL,
        [created_at] datetime2 NOT NULL,
        [updated_at] datetime2 NOT NULL,
        [resolved_at] datetime2 NULL,
        [resolution_notes] nvarchar(2000) NULL,
        CONSTRAINT [PK_support_requests] PRIMARY KEY ([request_id]),
        CONSTRAINT [FK_support_requests_bookings_related_booking_id] FOREIGN KEY ([related_booking_id]) REFERENCES [bookings] ([booking_id]) ON DELETE SET NULL,
        CONSTRAINT [FK_support_requests_charging_stations_related_station_id] FOREIGN KEY ([related_station_id]) REFERENCES [charging_stations] ([station_id]) ON DELETE SET NULL,
        CONSTRAINT [FK_support_requests_users_assigned_to] FOREIGN KEY ([assigned_to]) REFERENCES [users] ([user_id]) ON DELETE SET NULL,
        CONSTRAINT [FK_support_requests_users_user_id] FOREIGN KEY ([user_id]) REFERENCES [users] ([user_id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE TABLE [support_request_messages] (
        [message_id] int NOT NULL IDENTITY,
        [request_id] int NOT NULL,
        [sender_id] int NOT NULL,
        [sender_role] nvarchar(50) NOT NULL,
        [message] nvarchar(2000) NOT NULL,
        [sent_at] datetime2 NOT NULL,
        [is_staff_reply] bit NOT NULL,
        CONSTRAINT [PK_support_request_messages] PRIMARY KEY ([message_id]),
        CONSTRAINT [FK_support_request_messages_support_requests_request_id] FOREIGN KEY ([request_id]) REFERENCES [support_requests] ([request_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_support_request_messages_users_sender_id] FOREIGN KEY ([sender_id]) REFERENCES [users] ([user_id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_incidents_assigned_to_team_id] ON [incidents] ([assigned_to_team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_request_messages_request_id] ON [support_request_messages] ([request_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_request_messages_sender_id] ON [support_request_messages] ([sender_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_requests_assigned] ON [support_requests] ([assigned_to]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_requests_created] ON [support_requests] ([created_at]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_requests_related_booking_id] ON [support_requests] ([related_booking_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_requests_related_station_id] ON [support_requests] ([related_station_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_requests_status] ON [support_requests] ([status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    CREATE INDEX [IX_support_requests_user] ON [support_requests] ([user_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    ALTER TABLE [incidents] ADD CONSTRAINT [FK_incidents_maintenance_teams_assigned_to_team_id] FOREIGN KEY ([assigned_to_team_id]) REFERENCES [maintenance_teams] ([maintenance_team_id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251114143159_AddSupportRequestsAndMessages'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251114143159_AddSupportRequestsAndMessages', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120120000_AddDeletedAtColumns'
)
BEGIN
    ALTER TABLE [charging_posts] ADD [deleted_at] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120120000_AddDeletedAtColumns'
)
BEGIN
    ALTER TABLE [charging_slots] ADD [deleted_at] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120120000_AddDeletedAtColumns'
)
BEGIN
    ALTER TABLE [reviews] ADD [deleted_at] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120120000_AddDeletedAtColumns'
)
BEGIN
    ALTER TABLE [notifications] ADD [deleted_at] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251120120000_AddDeletedAtColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251120120000_AddDeletedAtColumns', N'8.0.11');
END;
GO

COMMIT;
GO

