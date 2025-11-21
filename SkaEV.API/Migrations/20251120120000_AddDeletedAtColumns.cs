using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkaEV.API.Migrations
{
    public partial class AddDeletedAtColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check and add deleted_at to charging_posts only if it doesn't exist
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_NAME = 'charging_posts' AND COLUMN_NAME = 'deleted_at')
                BEGIN
                    ALTER TABLE charging_posts ADD deleted_at datetime2 NULL;
                END
            ");

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "charging_slots",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "reviews",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "notifications",
                type: "datetime2",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "charging_posts");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "charging_slots");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "notifications");
        }
    }
}
