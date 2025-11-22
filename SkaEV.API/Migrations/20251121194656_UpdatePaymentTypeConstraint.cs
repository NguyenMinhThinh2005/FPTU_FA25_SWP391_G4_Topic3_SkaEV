using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace SkaEV.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaymentTypeConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing constraint if it exists
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Payments_PaymentType')
                BEGIN
                    ALTER TABLE [dbo].[payments] DROP CONSTRAINT [CK_Payments_PaymentType];
                END
            ");

            // Add new constraint including 'e_wallet'
            migrationBuilder.Sql(@"
                ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK_Payments_PaymentType] 
                CHECK (([payment_type]='vnpay' OR [payment_type]='VNPAY' OR [payment_type]='Wallet' OR [payment_type]='Card' OR [payment_type]='Cash' OR [payment_type]='e_wallet'));
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert to original constraint
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Payments_PaymentType')
                BEGIN
                    ALTER TABLE [dbo].[payments] DROP CONSTRAINT [CK_Payments_PaymentType];
                END
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE [dbo].[payments] WITH CHECK ADD CONSTRAINT [CK_Payments_PaymentType] 
                CHECK (([payment_type]='vnpay' OR [payment_type]='VNPAY' OR [payment_type]='Wallet' OR [payment_type]='Card' OR [payment_type]='Cash'));
            ");
        }
    }
}
