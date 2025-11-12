using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkaEV.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowOptionalVehicleVin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_vehicles_license_plate",
                table: "vehicles");

            migrationBuilder.DropIndex(
                name: "IX_vehicles_vin",
                table: "vehicles");

            migrationBuilder.AlterColumn<string>(
                name: "vin",
                table: "vehicles",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "license_plate",
                table: "vehicles",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32);

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET vin = NULL
                WHERE vin LIKE 'TEMPVIN-%';
            ");

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET license_plate = NULL
                WHERE license_plate LIKE 'TEMPPLATE-%';
            ");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_license_plate",
                table: "vehicles",
                column: "license_plate",
                unique: true,
                filter: "[license_plate] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_vin",
                table: "vehicles",
                column: "vin",
                unique: true,
                filter: "[vin] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_vehicles_license_plate",
                table: "vehicles");

            migrationBuilder.DropIndex(
                name: "IX_vehicles_vin",
                table: "vehicles");

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET vin = CONCAT('TEMPVIN-', vehicle_id)
                WHERE vin IS NULL OR LTRIM(RTRIM(vin)) = '';
            ");

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET license_plate = CONCAT('TEMPPLATE-', vehicle_id)
                WHERE license_plate IS NULL OR LTRIM(RTRIM(license_plate)) = '';
            ");

            migrationBuilder.AlterColumn<string>(
                name: "vin",
                table: "vehicles",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "license_plate",
                table: "vehicles",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_license_plate",
                table: "vehicles",
                column: "license_plate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_vin",
                table: "vehicles",
                column: "vin",
                unique: true);
        }
    }
}
