USE [SkaEV_DB]
GO

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Payments_PaymentType')
BEGIN
    ALTER TABLE [dbo].[payments] DROP CONSTRAINT [CK_Payments_PaymentType];
END
GO

ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK_Payments_PaymentType] 
CHECK (([payment_type]='vnpay' OR [payment_type]='VNPAY' OR [payment_type]='Wallet' OR [payment_type]='Card' OR [payment_type]='Cash' OR [payment_type]='e_wallet'));
GO

PRINT 'Successfully updated CK_Payments_PaymentType to include e_wallet';
