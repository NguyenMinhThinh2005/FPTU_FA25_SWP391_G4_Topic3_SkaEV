-- =============================================
-- Script: 08_ADD_ISSUES_TABLE.sql
-- Description: Create issues/maintenance reports table for staff
-- Version: 1.0
-- Date: 2025-10-14
-- =============================================

USE SkaEV_DB;
GO

PRINT 'Creating issues and maintenance tracking tables...';

-- =============================================
-- 1. Create issues table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'issues')
BEGIN
    CREATE TABLE issues (
        issue_id INT IDENTITY(1,1) PRIMARY KEY,
        station_id INT NOT NULL,
        post_id INT NULL,
        slot_id INT NULL,
        reported_by INT NOT NULL, -- Staff or customer user_id
        assigned_to INT NULL, -- Technician user_id
        issue_type NVARCHAR(100) NOT NULL CHECK (issue_type IN (
            'malfunction', 
            'damage', 
            'maintenance_needed', 
            'connectivity_issue',
            'power_issue',
            'physical_damage',
            'software_bug',
            'safety_concern',
            'other'
        )),
        priority NVARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        status NVARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        resolution_notes NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        resolved_at DATETIME NULL,
        closed_at DATETIME NULL,
        -- Metadata
        impact_level NVARCHAR(50) CHECK (impact_level IN ('minor', 'moderate', 'major', 'critical')),
        estimated_resolution_time INT NULL, -- in minutes
        actual_resolution_time INT NULL, -- in minutes
        cost_estimate DECIMAL(10,2) NULL,
        actual_cost DECIMAL(10,2) NULL,
        CONSTRAINT FK_Issues_Station FOREIGN KEY (station_id) 
            REFERENCES charging_stations(station_id),
        CONSTRAINT FK_Issues_Post FOREIGN KEY (post_id) 
            REFERENCES charging_posts(post_id),
        CONSTRAINT FK_Issues_Slot FOREIGN KEY (slot_id) 
            REFERENCES charging_slots(slot_id),
        CONSTRAINT FK_Issues_ReportedBy FOREIGN KEY (reported_by) 
            REFERENCES users(user_id),
        CONSTRAINT FK_Issues_AssignedTo FOREIGN KEY (assigned_to) 
            REFERENCES users(user_id)
    );

    -- Indexes for better performance
    CREATE INDEX IX_Issues_Station ON issues(station_id);
    CREATE INDEX IX_Issues_Status ON issues(status);
    CREATE INDEX IX_Issues_Priority ON issues(priority);
    CREATE INDEX IX_Issues_ReportedBy ON issues(reported_by);
    CREATE INDEX IX_Issues_CreatedAt ON issues(created_at DESC);

    PRINT '✓ Created issues table';
END
ELSE
BEGIN
    PRINT '- issues table already exists';
END
GO

-- =============================================
-- 2. Create issue_attachments table (for photos/documents)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'issue_attachments')
BEGIN
    CREATE TABLE issue_attachments (
        attachment_id INT IDENTITY(1,1) PRIMARY KEY,
        issue_id INT NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        file_path NVARCHAR(500) NOT NULL,
        file_type NVARCHAR(50), -- 'image', 'document', 'video'
        file_size_kb INT,
        uploaded_by INT NOT NULL,
        uploaded_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_IssueAttachments_Issue FOREIGN KEY (issue_id) 
            REFERENCES issues(issue_id) ON DELETE CASCADE,
        CONSTRAINT FK_IssueAttachments_User FOREIGN KEY (uploaded_by) 
            REFERENCES users(user_id)
    );

    CREATE INDEX IX_IssueAttachments_Issue ON issue_attachments(issue_id);

    PRINT '✓ Created issue_attachments table';
END
ELSE
BEGIN
    PRINT '- issue_attachments table already exists';
END
GO

-- =============================================
-- 3. Create issue_comments table (for communication)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'issue_comments')
BEGIN
    CREATE TABLE issue_comments (
        comment_id INT IDENTITY(1,1) PRIMARY KEY,
        issue_id INT NOT NULL,
        user_id INT NOT NULL,
        comment_text NVARCHAR(MAX) NOT NULL,
        is_internal BIT DEFAULT 0, -- Internal notes only visible to staff
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_IssueComments_Issue FOREIGN KEY (issue_id) 
            REFERENCES issues(issue_id) ON DELETE CASCADE,
        CONSTRAINT FK_IssueComments_User FOREIGN KEY (user_id) 
            REFERENCES users(user_id)
    );

    CREATE INDEX IX_IssueComments_Issue ON issue_comments(issue_id);
    CREATE INDEX IX_IssueComments_CreatedAt ON issue_comments(created_at DESC);

    PRINT '✓ Created issue_comments table';
END
ELSE
BEGIN
    PRINT '- issue_comments table already exists';
END
GO

-- =============================================
-- 4. Create maintenance_schedules table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'maintenance_schedules')
BEGIN
    CREATE TABLE maintenance_schedules (
        schedule_id INT IDENTITY(1,1) PRIMARY KEY,
        station_id INT NOT NULL,
        post_id INT NULL,
        slot_id INT NULL,
        maintenance_type NVARCHAR(100) NOT NULL CHECK (maintenance_type IN (
            'routine_inspection',
            'preventive_maintenance',
            'repair',
            'software_update',
            'hardware_upgrade',
            'calibration',
            'cleaning'
        )),
        scheduled_date DATETIME NOT NULL,
        estimated_duration_minutes INT,
        assigned_to INT NULL,
        status NVARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
        completion_date DATETIME NULL,
        notes NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        created_by INT NOT NULL,
        CONSTRAINT FK_MaintenanceSchedules_Station FOREIGN KEY (station_id) 
            REFERENCES charging_stations(station_id),
        CONSTRAINT FK_MaintenanceSchedules_Post FOREIGN KEY (post_id) 
            REFERENCES charging_posts(post_id),
        CONSTRAINT FK_MaintenanceSchedules_Slot FOREIGN KEY (slot_id) 
            REFERENCES charging_slots(slot_id),
        CONSTRAINT FK_MaintenanceSchedules_AssignedTo FOREIGN KEY (assigned_to) 
            REFERENCES users(user_id),
        CONSTRAINT FK_MaintenanceSchedules_CreatedBy FOREIGN KEY (created_by) 
            REFERENCES users(user_id)
    );

    CREATE INDEX IX_MaintenanceSchedules_Station ON maintenance_schedules(station_id);
    CREATE INDEX IX_MaintenanceSchedules_ScheduledDate ON maintenance_schedules(scheduled_date);
    CREATE INDEX IX_MaintenanceSchedules_Status ON maintenance_schedules(status);

    PRINT '✓ Created maintenance_schedules table';
END
ELSE
BEGIN
    PRINT '- maintenance_schedules table already exists';
END
GO

-- =============================================
-- 5. Create issue statistics view
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_issue_statistics')
    DROP VIEW v_issue_statistics;
GO

CREATE VIEW v_issue_statistics AS
SELECT 
    cs.station_id,
    cs.station_name,
    COUNT(DISTINCT i.issue_id) AS total_issues,
    COUNT(DISTINCT CASE WHEN i.status = 'open' THEN i.issue_id END) AS open_issues,
    COUNT(DISTINCT CASE WHEN i.status = 'in_progress' THEN i.issue_id END) AS in_progress_issues,
    COUNT(DISTINCT CASE WHEN i.status = 'resolved' THEN i.issue_id END) AS resolved_issues,
    COUNT(DISTINCT CASE WHEN i.priority = 'critical' THEN i.issue_id END) AS critical_issues,
    COUNT(DISTINCT CASE WHEN i.priority = 'high' THEN i.issue_id END) AS high_priority_issues,
    AVG(CASE WHEN i.resolved_at IS NOT NULL 
        THEN DATEDIFF(MINUTE, i.created_at, i.resolved_at) END) AS avg_resolution_time_minutes,
    MIN(i.created_at) AS first_issue_date,
    MAX(i.created_at) AS last_issue_date
FROM charging_stations cs
LEFT JOIN issues i ON cs.station_id = i.station_id
GROUP BY cs.station_id, cs.station_name;
GO

PRINT '✓ Created v_issue_statistics view';
GO

-- =============================================
-- 6. Insert sample issues (optional - for testing)
-- =============================================
-- Uncomment to add sample data
/*
IF EXISTS (SELECT 1 FROM charging_stations WHERE station_id = 1)
AND EXISTS (SELECT 1 FROM users WHERE role = 'staff')
BEGIN
    DECLARE @StaffId INT = (SELECT TOP 1 user_id FROM users WHERE role = 'staff');
    DECLARE @PostId INT = (SELECT TOP 1 post_id FROM charging_posts WHERE station_id = 1);
    
    INSERT INTO issues (station_id, post_id, reported_by, issue_type, priority, title, description, impact_level)
    VALUES 
        (1, @PostId, @StaffId, 'malfunction', 'high', 'Charging port not responding', 'Port 1 does not recognize connected vehicles', 'moderate'),
        (1, NULL, @StaffId, 'maintenance_needed', 'medium', 'Routine inspection due', 'Quarterly inspection scheduled', 'minor');
    
    PRINT '✓ Inserted sample issues';
END
*/

PRINT '========================================';
PRINT 'Issues & Maintenance Migration Completed!';
PRINT '========================================';
PRINT 'Tables created:';
PRINT '  - issues';
PRINT '  - issue_attachments';
PRINT '  - issue_comments';
PRINT '  - maintenance_schedules';
PRINT 'Views created:';
PRINT '  - v_issue_statistics';
PRINT '========================================';
PRINT '';
PRINT 'Usage examples:';
PRINT '  -- Report new issue';
PRINT '  INSERT INTO issues (station_id, reported_by, issue_type, priority, title, description)';
PRINT '  VALUES (1, @staff_id, ''malfunction'', ''high'', ''Issue title'', ''Description'');';
PRINT '';
PRINT '  -- View issues by station';
PRINT '  SELECT * FROM issues WHERE station_id = 1 AND status = ''open'';';
PRINT '';
PRINT '  -- View issue statistics';
PRINT '  SELECT * FROM v_issue_statistics;';
PRINT '========================================';
GO
