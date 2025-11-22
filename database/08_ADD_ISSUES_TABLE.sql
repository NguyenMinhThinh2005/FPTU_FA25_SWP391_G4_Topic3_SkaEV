-- =============================================
-- Script: 08_ADD_ISSUES_TABLE.sql
-- Description: Create Issues tracking tables for monitoring and maintenance
-- Version: 1.0
-- Date: 2025-11-07
-- =============================================

USE [SkaEV_DB];
GO

-- =============================================
-- 1. Create Issues Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Issues')
BEGIN
    CREATE TABLE [dbo].[Issues] (
        [IssueId] INT IDENTITY(1,1) PRIMARY KEY,
        [StationId] INT NOT NULL,
        [ReportedByUserId] INT NOT NULL,
        [AssignedToUserId] INT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NOT NULL,
        [Category] NVARCHAR(50) NOT NULL, -- 'connector_fault', 'power_outage', 'software_error', 'hardware_damage', 'other'
        [Priority] NVARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'reported', -- 'reported', 'in_progress', 'resolved', 'closed'
        [Resolution] NVARCHAR(MAX) NULL,
        [ReportedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [AssignedAt] DATETIME2 NULL,
        [StartedAt] DATETIME2 NULL,
        [ResolvedAt] DATETIME2 NULL,
        [ClosedAt] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [FK_Issues_Station] FOREIGN KEY ([StationId]) 
            REFERENCES [dbo].[charging_stations]([station_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Issues_ReportedBy] FOREIGN KEY ([ReportedByUserId]) 
            REFERENCES [dbo].[users]([user_id]),
        CONSTRAINT [FK_Issues_AssignedTo] FOREIGN KEY ([AssignedToUserId]) 
            REFERENCES [dbo].[users]([user_id]),
        CONSTRAINT [CHK_Issues_Priority] CHECK ([Priority] IN ('low', 'medium', 'high', 'critical')),
        CONSTRAINT [CHK_Issues_Status] CHECK ([Status] IN ('reported', 'in_progress', 'resolved', 'closed'))
    );

    CREATE INDEX [IX_Issues_StationId] ON [dbo].[Issues]([StationId]);
    CREATE INDEX [IX_Issues_Status] ON [dbo].[Issues]([Status]);
    CREATE INDEX [IX_Issues_Priority] ON [dbo].[Issues]([Priority]);
    CREATE INDEX [IX_Issues_AssignedTo] ON [dbo].[Issues]([AssignedToUserId]);
    CREATE INDEX [IX_Issues_ReportedAt] ON [dbo].[Issues]([ReportedAt]);

    PRINT '✓ Table [Issues] created successfully';
END
ELSE
BEGIN
    PRINT '⚠ Table [Issues] already exists';
END
GO

-- =============================================
-- 2. Create IssueComments Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IssueComments')
BEGIN
    CREATE TABLE [dbo].[IssueComments] (
        [CommentId] INT IDENTITY(1,1) PRIMARY KEY,
        [IssueId] INT NOT NULL,
        [UserId] INT NOT NULL,
        [Comment] NVARCHAR(MAX) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [FK_IssueComments_Issue] FOREIGN KEY ([IssueId]) 
            REFERENCES [dbo].[Issues]([IssueId]) ON DELETE CASCADE,
        CONSTRAINT [FK_IssueComments_User] FOREIGN KEY ([UserId]) 
            REFERENCES [dbo].[users]([user_id])
    );

    CREATE INDEX [IX_IssueComments_IssueId] ON [dbo].[IssueComments]([IssueId]);
    CREATE INDEX [IX_IssueComments_CreatedAt] ON [dbo].[IssueComments]([CreatedAt]);

    PRINT '✓ Table [IssueComments] created successfully';
END
ELSE
BEGIN
    PRINT '⚠ Table [IssueComments] already exists';
END
GO

-- =============================================
-- 3. Create IssueAttachments Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IssueAttachments')
BEGIN
    CREATE TABLE [dbo].[IssueAttachments] (
        [AttachmentId] INT IDENTITY(1,1) PRIMARY KEY,
        [IssueId] INT NOT NULL,
        [UploadedByUserId] INT NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [FileType] NVARCHAR(50) NULL,
        [FileSize] BIGINT NULL,
        [Description] NVARCHAR(500) NULL,
        [UploadedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [FK_IssueAttachments_Issue] FOREIGN KEY ([IssueId]) 
            REFERENCES [dbo].[Issues]([IssueId]) ON DELETE CASCADE,
        CONSTRAINT [FK_IssueAttachments_User] FOREIGN KEY ([UploadedByUserId]) 
            REFERENCES [dbo].[users]([user_id])
    );

    CREATE INDEX [IX_IssueAttachments_IssueId] ON [dbo].[IssueAttachments]([IssueId]);

    PRINT '✓ Table [IssueAttachments] created successfully';
END
ELSE
BEGIN
    PRINT '⚠ Table [IssueAttachments] already exists';
END
GO

-- =============================================
-- 4. Create IssueHistory Table (for audit trail)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IssueHistory')
BEGIN
    CREATE TABLE [dbo].[IssueHistory] (
        [HistoryId] INT IDENTITY(1,1) PRIMARY KEY,
        [IssueId] INT NOT NULL,
        [ChangedByUserId] INT NOT NULL,
        [ChangeType] NVARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'assigned', 'commented', 'updated'
        [OldValue] NVARCHAR(MAX) NULL,
        [NewValue] NVARCHAR(MAX) NULL,
        [Description] NVARCHAR(500) NULL,
        [ChangedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [FK_IssueHistory_Issue] FOREIGN KEY ([IssueId]) 
            REFERENCES [dbo].[Issues]([IssueId]) ON DELETE CASCADE,
        CONSTRAINT [FK_IssueHistory_User] FOREIGN KEY ([ChangedByUserId]) 
            REFERENCES [dbo].[users]([user_id])
    );

    CREATE INDEX [IX_IssueHistory_IssueId] ON [dbo].[IssueHistory]([IssueId]);
    CREATE INDEX [IX_IssueHistory_ChangedAt] ON [dbo].[IssueHistory]([ChangedAt]);

    PRINT '✓ Table [IssueHistory] created successfully';
END
ELSE
BEGIN
    PRINT '⚠ Table [IssueHistory] already exists';
END
GO

-- =============================================
-- 5. Insert Sample Data (Optional)
-- =============================================

-- Get staff user IDs
DECLARE @staffUserId INT;
DECLARE @adminUserId INT;

SELECT TOP 1 @staffUserId = user_id FROM [dbo].[users] WHERE role = 'staff';
SELECT TOP 1 @adminUserId = user_id FROM [dbo].[users] WHERE role = 'admin';

-- Insert sample issues if no issues exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Issues])
BEGIN
    -- Issue 1: Connector fault
    INSERT INTO [dbo].[Issues] (StationId, ReportedByUserId, AssignedToUserId, Title, Description, Category, Priority, Status)
    VALUES 
    (1, ISNULL(@staffUserId, 1), ISNULL(@staffUserId, 1), 
     'Lỗi Phần mềm/Giao tiếp', 
     'Trạm sạc CON-04 không phản hồi lệnh bắt đầu sạc', 
     'software_error', 
     'high', 
     'reported');

    -- Issue 2: Power outage
    INSERT INTO [dbo].[Issues] (StationId, ReportedByUserId, AssignedToUserId, Title, Description, Category, Priority, Status)
    VALUES 
    (2, ISNULL(@staffUserId, 1), NULL, 
     'Mất điện tạm thời', 
     'Trạm sạc bị mất điện trong 2 giờ', 
     'power_outage', 
     'medium', 
     'in_progress');

    -- Issue 3: Hardware damage
    INSERT INTO [dbo].[Issues] (StationId, ReportedByUserId, AssignedToUserId, Title, Description, Category, Priority, Status, ResolvedAt, Resolution)
    VALUES 
    (1, ISNULL(@staffUserId, 1), ISNULL(@staffUserId, 1), 
     'Hư hỏng phần cứng', 
     'Màn hình hiển thị bị vỡ', 
     'hardware_damage', 
     'low', 
     'resolved',
     DATEADD(hour, -2, GETDATE()),
     'Đã thay thế màn hình mới');

    PRINT '✓ Sample issues inserted';
END
GO

-- =============================================
-- 6. Create Views for reporting
-- =============================================

-- View: Active Issues
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ActiveIssues')
    DROP VIEW [dbo].[vw_ActiveIssues];
GO

CREATE VIEW [dbo].[vw_ActiveIssues] AS
SELECT 
    i.IssueId,
    i.Title,
    i.Description,
    i.Category,
    i.Priority,
    i.Status,
    s.station_name as StationName,
    s.address as StationAddress,
    reporter.full_name as ReportedBy,
    assigned.full_name as AssignedTo,
    i.ReportedAt,
    i.AssignedAt,
    DATEDIFF(hour, i.ReportedAt, GETDATE()) as HoursOpen
FROM [dbo].[Issues] i
INNER JOIN [dbo].[charging_stations] s ON i.StationId = s.station_id
INNER JOIN [dbo].[users] reporter ON i.ReportedByUserId = reporter.user_id
LEFT JOIN [dbo].[users] assigned ON i.AssignedToUserId = assigned.user_id
WHERE i.Status IN ('reported', 'in_progress');
GO

PRINT '✓ View [vw_ActiveIssues] created';
GO

-- =============================================
-- 7. Create Stored Procedures
-- =============================================

-- SP: Get Issue Statistics
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetIssueStatistics')
    DROP PROCEDURE [dbo].[sp_GetIssueStatistics];
GO

CREATE PROCEDURE [dbo].[sp_GetIssueStatistics]
    @StationId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        COUNT(*) as TotalIssues,
        SUM(CASE WHEN Status = 'reported' THEN 1 ELSE 0 END) as Reported,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as InProgress,
        SUM(CASE WHEN Status = 'resolved' THEN 1 ELSE 0 END) as Resolved,
        SUM(CASE WHEN Status = 'closed' THEN 1 ELSE 0 END) as Closed,
        SUM(CASE WHEN Priority = 'critical' THEN 1 ELSE 0 END) as Critical,
        SUM(CASE WHEN Priority = 'high' THEN 1 ELSE 0 END) as High,
        SUM(CASE WHEN Priority = 'medium' THEN 1 ELSE 0 END) as Medium,
        SUM(CASE WHEN Priority = 'low' THEN 1 ELSE 0 END) as Low,
        AVG(CASE 
            WHEN ResolvedAt IS NOT NULL 
            THEN DATEDIFF(hour, ReportedAt, ResolvedAt) 
            ELSE NULL 
        END) as AvgResolutionTimeHours
    FROM [dbo].[Issues]
    WHERE (@StationId IS NULL OR StationId = @StationId);
END
GO

PRINT '✓ Stored Procedure [sp_GetIssueStatistics] created';
GO

PRINT '';
PRINT '========================================';
PRINT '✓✓✓ Issues tables setup completed! ✓✓✓';
PRINT '========================================';
PRINT '';
PRINT 'Tables created:';
PRINT '  - Issues';
PRINT '  - IssueComments';
PRINT '  - IssueAttachments';
PRINT '  - IssueHistory';
PRINT '';
PRINT 'Views created:';
PRINT '  - vw_ActiveIssues';
PRINT '';
PRINT 'Procedures created:';
PRINT '  - sp_GetIssueStatistics';
PRINT '';
GO
