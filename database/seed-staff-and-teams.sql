-- Seed maintenance teams and ensure incidents table has assigned_to_team_id column
USE SkaEV_DB;
GO

-- Create maintenance_teams table if missing
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'maintenance_teams')
BEGIN
	CREATE TABLE maintenance_teams (
		maintenance_team_id INT IDENTITY(1,1) PRIMARY KEY,
		name NVARCHAR(255) NOT NULL,
		contact_person NVARCHAR(255) NULL,
		contact_phone NVARCHAR(50) NULL,
		created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
		updated_at DATETIME NOT NULL DEFAULT GETUTCDATE()
	);
	PRINT 'maintenance_teams table created';
END
ELSE
BEGIN
	PRINT 'maintenance_teams already exists';
END
GO

-- Add assigned_to_team_id column to incidents if missing
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'assigned_to_team_id' AND Object_ID = Object_ID(N'incidents'))
BEGIN
	ALTER TABLE incidents ADD assigned_to_team_id INT NULL;
	ALTER TABLE incidents ADD CONSTRAINT FK_incidents_maintenance_team FOREIGN KEY (assigned_to_team_id) REFERENCES maintenance_teams(maintenance_team_id);
	PRINT 'assigned_to_team_id column added to incidents';
END
ELSE
BEGIN
	PRINT 'assigned_to_team_id column already exists in incidents';
END
GO

-- Seed sample teams only if table is empty
IF NOT EXISTS (SELECT 1 FROM maintenance_teams)
BEGIN
	INSERT INTO maintenance_teams (name, contact_person, contact_phone)
	VALUES
	('Team A - North Region', 'Nguyen Van A', '+84901234567'),
	('Team B - South Region', 'Tran Thi B', '+84907654321'),
	('On-call Electrical', 'Hoang Ky', '+84903332211');
	PRINT 'Seeded maintenance_teams';
END
ELSE
BEGIN
	PRINT 'maintenance_teams already seeded';
END
GO

-- Assign some incidents to teams if they are unassigned (sample)
UPDATE incidents
SET assigned_to_team_id = (SELECT TOP 1 maintenance_team_id FROM maintenance_teams ORDER BY maintenance_team_id)
WHERE assigned_to_staff_id IS NULL AND assigned_to_team_id IS NULL AND status IN ('open', 'in_progress')
AND EXISTS (SELECT 1 FROM maintenance_teams);

PRINT 'Assigned sample incidents to first maintenance team where applicable';

