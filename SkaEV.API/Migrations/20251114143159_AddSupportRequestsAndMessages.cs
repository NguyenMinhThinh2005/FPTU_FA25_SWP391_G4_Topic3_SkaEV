using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkaEV.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportRequestsAndMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "assigned_to_team_id",
                table: "incidents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "maintenance_teams",
                columns: table => new
                {
                    maintenance_team_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    contact_person = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    contact_phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_teams", x => x.maintenance_team_id);
                });

            migrationBuilder.CreateTable(
                name: "support_requests",
                columns: table => new
                {
                    request_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    subject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    assigned_to = table.Column<int>(type: "int", nullable: true),
                    related_booking_id = table.Column<int>(type: "int", nullable: true),
                    related_station_id = table.Column<int>(type: "int", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    resolution_notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_support_requests", x => x.request_id);
                    table.ForeignKey(
                        name: "FK_support_requests_bookings_related_booking_id",
                        column: x => x.related_booking_id,
                        principalTable: "bookings",
                        principalColumn: "booking_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_support_requests_charging_stations_related_station_id",
                        column: x => x.related_station_id,
                        principalTable: "charging_stations",
                        principalColumn: "station_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_support_requests_users_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_support_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "support_request_messages",
                columns: table => new
                {
                    message_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    request_id = table.Column<int>(type: "int", nullable: false),
                    sender_id = table.Column<int>(type: "int", nullable: false),
                    sender_role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_staff_reply = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_support_request_messages", x => x.message_id);
                    table.ForeignKey(
                        name: "FK_support_request_messages_support_requests_request_id",
                        column: x => x.request_id,
                        principalTable: "support_requests",
                        principalColumn: "request_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_support_request_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_incidents_assigned_to_team_id",
                table: "incidents",
                column: "assigned_to_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_support_request_messages_request_id",
                table: "support_request_messages",
                column: "request_id");

            migrationBuilder.CreateIndex(
                name: "IX_support_request_messages_sender_id",
                table: "support_request_messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "IX_support_requests_assigned",
                table: "support_requests",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_support_requests_created",
                table: "support_requests",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_support_requests_related_booking_id",
                table: "support_requests",
                column: "related_booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_support_requests_related_station_id",
                table: "support_requests",
                column: "related_station_id");

            migrationBuilder.CreateIndex(
                name: "IX_support_requests_status",
                table: "support_requests",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_support_requests_user",
                table: "support_requests",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_incidents_maintenance_teams_assigned_to_team_id",
                table: "incidents",
                column: "assigned_to_team_id",
                principalTable: "maintenance_teams",
                principalColumn: "maintenance_team_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_incidents_maintenance_teams_assigned_to_team_id",
                table: "incidents");

            migrationBuilder.DropTable(
                name: "maintenance_teams");

            migrationBuilder.DropTable(
                name: "support_request_messages");

            migrationBuilder.DropTable(
                name: "support_requests");

            migrationBuilder.DropIndex(
                name: "IX_incidents_assigned_to_team_id",
                table: "incidents");

            migrationBuilder.DropColumn(
                name: "assigned_to_team_id",
                table: "incidents");
        }
    }
}
