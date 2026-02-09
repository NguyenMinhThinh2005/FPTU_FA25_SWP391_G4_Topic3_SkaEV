-- Script to add DeviceCode column to Issues table
USE SkaEV_DB;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Issues]') AND name = 'DeviceCode')
BEGIN
    ALTER TABLE [dbo].[Issues]
    ADD [DeviceCode] NVARCHAR(50) NULL;
    
    PRINT 'Column [DeviceCode] added to table [Issues]';
END
ELSE
BEGIN
    PRINT 'Column [DeviceCode] already exists in table [Issues]';
END
GO


