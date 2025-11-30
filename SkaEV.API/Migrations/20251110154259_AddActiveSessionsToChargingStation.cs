using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkaEV.API.Migrations
{
    public partial class AddActiveSessionsToChargingStation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActiveSessions",
                table: "charging_stations",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActiveSessions",
                table: "charging_stations");
        }
    }
}
