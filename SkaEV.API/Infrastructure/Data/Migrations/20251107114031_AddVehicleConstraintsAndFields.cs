using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkaEV.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleConstraintsAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "vehicle_year",
                table: "vehicles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vin",
                table: "vehicles",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "color",
                table: "vehicles",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "max_charging_speed",
                table: "vehicles",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "connector_types",
                table: "vehicles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql(@"
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
            ");

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET license_plate = UPPER(REPLACE(license_plate, ' ', ''))
                WHERE license_plate IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET license_plate = CONCAT('TEMPPLATE-', vehicle_id)
                WHERE license_plate IS NULL OR license_plate = '';
            ");

            migrationBuilder.Sql(@"
                UPDATE vehicles
                SET vin = CONCAT('TEMPVIN-', vehicle_id)
                WHERE vin IS NULL OR vin = '';
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE vehicles
                ALTER COLUMN license_plate NVARCHAR(32) NOT NULL;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE vehicles
                ALTER COLUMN vin NVARCHAR(32) NOT NULL;
            ");

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
                ALTER TABLE vehicles
                ALTER COLUMN vin NVARCHAR(255) NULL;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE vehicles
                ALTER COLUMN license_plate NVARCHAR(255) NULL;
            ");

            migrationBuilder.DropColumn(
                name: "vehicle_year",
                table: "vehicles");

            migrationBuilder.DropColumn(
                name: "vin",
                table: "vehicles");

            migrationBuilder.DropColumn(
                name: "color",
                table: "vehicles");

            migrationBuilder.DropColumn(
                name: "max_charging_speed",
                table: "vehicles");

            migrationBuilder.DropColumn(
                name: "connector_types",
                table: "vehicles");
        }
    }
}
