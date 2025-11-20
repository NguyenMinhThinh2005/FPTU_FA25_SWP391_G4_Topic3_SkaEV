using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkaEV.API.Migrations
{
    public partial class AddDeletedAtColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "charging_posts",
                type: "datetime2",
                nullable: true);

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
