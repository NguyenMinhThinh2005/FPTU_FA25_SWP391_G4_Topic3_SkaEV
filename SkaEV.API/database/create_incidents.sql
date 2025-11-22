SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('dbo.incidents') IS NULL
BEGIN
    CREATE TABLE dbo.incidents (
        incident_id INT IDENTITY(1,1) PRIMARY KEY,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        station_id INT NULL,
        reported_by INT NULL,
        description NVARCHAR(MAX) NULL,
        severity NVARCHAR(50) NULL,
        status NVARCHAR(50) NULL
    );
END
GO
