-- Create Incidents Table
USE SkaEV_DB;
GO

-- Create incidents table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'incidents')
BEGIN
    CREATE TABLE incidents (
        incident_id INT IDENTITY(1,1) PRIMARY KEY,
        station_id INT NOT NULL,
        post_id INT NULL,
        slot_id INT NULL,
        reported_by_user_id INT NULL,
        incident_type NVARCHAR(50) NOT NULL, -- 'equipment_failure', 'safety_issue', 'vandalism', 'power_outage', 'software_bug', 'other'
        severity NVARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
        status NVARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        resolution_notes NVARCHAR(MAX) NULL,
        assigned_to_staff_id INT NULL,
        reported_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
        acknowledged_at DATETIME NULL,
        resolved_at DATETIME NULL,
        closed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
        
        FOREIGN KEY (station_id) REFERENCES charging_stations(station_id),
        FOREIGN KEY (post_id) REFERENCES charging_posts(post_id),
        FOREIGN KEY (slot_id) REFERENCES charging_slots(slot_id),
        FOREIGN KEY (reported_by_user_id) REFERENCES users(user_id),
        FOREIGN KEY (assigned_to_staff_id) REFERENCES users(user_id)
    );
    
    PRINT 'Incidents table created successfully.';
END
ELSE
BEGIN
    PRINT 'Incidents table already exists.';
END
GO

-- Seed sample incident data
INSERT INTO incidents (station_id, post_id, slot_id, reported_by_user_id, incident_type, severity, status, title, description, reported_at, created_at, updated_at)
VALUES
-- Critical incidents
(1, NULL, NULL, 2, 'equipment_failure', 'critical', 'in_progress', 'DC Fast Charger Not Delivering Power', 'Post POST-01 is not delivering any power despite showing as available. Customer reported their EV is not charging.', DATEADD(HOUR, -3, GETUTCDATE()), DATEADD(HOUR, -3, GETUTCDATE()), GETUTCDATE()),

-- High severity
(2, NULL, NULL, 3, 'power_outage', 'high', 'open', 'Entire Station Power Outage', 'All charging posts at Landmark 81 station are offline due to building power issue. Estimated 50+ customers affected.', DATEADD(HOUR, -2, GETUTCDATE()), DATEADD(HOUR, -2, GETUTCDATE()), GETUTCDATE()),

-- Medium severity  
(15, NULL, NULL, 5, 'equipment_failure', 'medium', 'resolved', 'Cable Damaged - Type2 Connector', 'Charging cable showing visible damage. Cable replaced with spare unit.', DATEADD(DAY, -1, GETUTCDATE()), DATEADD(DAY, -1, GETUTCDATE()), GETUTCDATE()),

(3, NULL, NULL, 4, 'software_bug', 'medium', 'open', 'Payment Terminal Not Responding', 'Payment terminal at station entrance is frozen and not accepting payments. Customers unable to start sessions.', DATEADD(HOUR, -5, GETUTCDATE()), DATEADD(HOUR, -5, GETUTCDATE()), GETUTCDATE()),

-- Low severity
(21, NULL, NULL, 6, 'vandalism', 'low', 'open', 'Graffiti on Station Signage', 'Station entrance sign has been spray-painted. Does not affect operations but needs cleaning.', DATEADD(DAY, -2, GETUTCDATE()), DATEADD(DAY, -2, GETUTCDATE()), GETUTCDATE()),

(10, NULL, NULL, 2, 'safety_issue', 'medium', 'in_progress', 'Broken Security Camera', 'Camera #3 in parking area is not recording. Security concern for customer vehicles.', DATEADD(HOUR, -8, GETUTCDATE()), DATEADD(HOUR, -8, GETUTCDATE()), GETUTCDATE()),

-- Resolved incidents
(7, NULL, NULL, 3, 'equipment_failure', 'high', 'resolved', 'Charger Overheating', 'DC charger showing high temperature warnings. System automatically shut down charger. Cooling fan replaced.', DATEADD(DAY, -3, GETUTCDATE()), DATEADD(DAY, -3, GETUTCDATE()), DATEADD(DAY, -2, GETUTCDATE())),

(4, NULL, NULL, 4, 'other', 'low', 'closed', 'Customer Complaint - Dirty Parking Spot', 'Customer reported oil stains in parking spot. Cleaned and documented.', DATEADD(DAY, -5, GETUTCDATE()), DATEADD(DAY, -5, GETUTCDATE()), DATEADD(DAY, -4, GETUTCDATE())),

-- Recent incidents
(25, NULL, NULL, 5, 'equipment_failure', 'critical', 'open', 'Emergency Stop Button Malfunction', 'Emergency stop button not functioning properly on highway rest stop charger. Safety hazard.', DATEADD(MINUTE, -30, GETUTCDATE()), DATEADD(MINUTE, -30, GETUTCDATE()), GETUTCDATE()),

(6, NULL, NULL, 2, 'software_bug', 'low', 'in_progress', 'Display Screen Flickering', 'Touchscreen display intermittently flickering. Functionality not affected but user experience degraded.', DATEADD(HOUR, -12, GETUTCDATE()), DATEADD(HOUR, -12, GETUTCDATE()), GETUTCDATE()),

-- Additional incidents for better data coverage
(12, NULL, NULL, 3, 'equipment_failure', 'medium', 'open', 'Broken Card Reader', 'Payment card reader not working. Cash payment option still available.', DATEADD(HOUR, -24, GETUTCDATE()), DATEADD(HOUR, -24, GETUTCDATE()), GETUTCDATE()),

(18, NULL, NULL, 4, 'safety_issue', 'high', 'in_progress', 'Damaged Charging Cable Housing', 'External cable housing cracked, exposing internal wires. Immediate safety concern.', DATEADD(HOUR, -6, GETUTCDATE()), DATEADD(HOUR, -6, GETUTCDATE()), GETUTCDATE()),

(8, NULL, NULL, 5, 'software_bug', 'low', 'closed', 'App Not Showing Station', 'Mobile app temporarily not displaying this station. Issue resolved after server update.', DATEADD(DAY, -7, GETUTCDATE()), DATEADD(DAY, -7, GETUTCDATE()), DATEADD(DAY, -6, GETUTCDATE())),

(22, NULL, NULL, 2, 'other', 'medium', 'open', 'Poor Lighting in Parking Area', 'Several overhead lights are out, making the area unsafe after dark.', DATEADD(DAY, -3, GETUTCDATE()), DATEADD(DAY, -3, GETUTCDATE()), GETUTCDATE()),

(30, NULL, NULL, 6, 'equipment_failure', 'critical', 'resolved', 'Fire Alarm Triggered', 'Smoke detector triggered due to electrical smell from Post 3. Fire department called. Issue was overheated connector, replaced immediately.', DATEADD(DAY, -10, GETUTCDATE()), DATEADD(DAY, -10, GETUTCDATE()), DATEADD(DAY, -9, GETUTCDATE()));

GO

-- Update some incidents with resolution notes and assignments
UPDATE incidents 
SET resolution_notes = 'Cooling fan was clogged with dust. Fan cleaned and system tested. Temperature now within normal range.',
    resolved_at = DATEADD(DAY, -2, GETUTCDATE()),
    acknowledged_at = DATEADD(DAY, -3, DATEADD(HOUR, 2, GETUTCDATE())),
    assigned_to_staff_id = 7
WHERE title = 'Charger Overheating';

UPDATE incidents
SET resolution_notes = 'Parking spot cleaned with industrial degreaser. Preventive maintenance scheduled.',
    resolved_at = DATEADD(DAY, -4, GETUTCDATE()),
    closed_at = DATEADD(DAY, -4, GETUTCDATE()),
    acknowledged_at = DATEADD(DAY, -5, DATEADD(HOUR, 1, GETUTCDATE())),
    assigned_to_staff_id = 7
WHERE title = 'Customer Complaint - Dirty Parking Spot';

UPDATE incidents
SET resolution_notes = 'Spare cable installed. Damaged cable sent for warranty replacement.',
    resolved_at = DATEADD(HOUR, -6, GETUTCDATE()),
    acknowledged_at = DATEADD(DAY, -1, DATEADD(HOUR, 1, GETUTCDATE())),
    assigned_to_staff_id = 8
WHERE title = 'Cable Damaged - Type2 Connector';

UPDATE incidents
SET resolution_notes = 'Server cache cleared and station re-indexed in database. Verified station now visible in all app versions.',
    resolved_at = DATEADD(DAY, -6, GETUTCDATE()),
    closed_at = DATEADD(DAY, -6, GETUTCDATE()),
    acknowledged_at = DATEADD(DAY, -7, DATEADD(HOUR, 2, GETUTCDATE())),
    assigned_to_staff_id = 8
WHERE title = 'App Not Showing Station';

UPDATE incidents
SET resolution_notes = 'Fire department inspected. Faulty connector replaced. All electrical systems tested and certified safe. Station reopened.',
    resolved_at = DATEADD(DAY, -9, GETUTCDATE()),
    closed_at = DATEADD(DAY, -9, GETUTCDATE()),
    acknowledged_at = DATEADD(DAY, -10, DATEADD(HOUR, 1, GETUTCDATE())),
    assigned_to_staff_id = 7
WHERE title = 'Fire Alarm Triggered';

-- Assign staff to open incidents
UPDATE incidents
SET assigned_to_staff_id = 7,
    acknowledged_at = DATEADD(HOUR, -2, GETUTCDATE())
WHERE status = 'in_progress' AND assigned_to_staff_id IS NULL;

UPDATE incidents
SET assigned_to_staff_id = 8
WHERE status = 'open' AND severity IN ('critical', 'high') AND assigned_to_staff_id IS NULL;

GO

-- Display summary
SELECT 
    status,
    severity,
    COUNT(*) as count
FROM incidents
GROUP BY status, severity
ORDER BY 
    CASE status 
        WHEN 'open' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'resolved' THEN 3
        WHEN 'closed' THEN 4
    END,
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END;

PRINT '';
PRINT 'Incidents table seeded with 10 sample incidents.';
