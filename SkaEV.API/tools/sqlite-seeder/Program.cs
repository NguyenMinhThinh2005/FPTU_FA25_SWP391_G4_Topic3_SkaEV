using Microsoft.Data.Sqlite;
using System.Globalization;

var dbPath = args.Length > 0 ? args[0] : Path.Combine(AppContext.BaseDirectory, "../../../../SkaEV.API/skaev_dev.db");
dbPath = Path.GetFullPath(dbPath);
Console.WriteLine($"Seeding SQLite DB at: {dbPath}");

var folder = Path.GetDirectoryName(dbPath)!;
if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

var connString = new SqliteConnectionStringBuilder { DataSource = dbPath }.ToString();
using var conn = new SqliteConnection(connString);
conn.Open();

void Exec(string sql)
{
    using var cmd = conn.CreateCommand();
    cmd.CommandText = sql;
    cmd.ExecuteNonQuery();
}

// Helper to check existence
int Count(string sql, params (string, object)[] pars)
{
    using var cmd = conn.CreateCommand();
    cmd.CommandText = sql;
    foreach (var (n, v) in pars) cmd.Parameters.AddWithValue(n, v ?? DBNull.Value);
    return Convert.ToInt32(cmd.ExecuteScalar()!);
}

// 1) charging_stations (existing simplified table)
Exec(@"
CREATE TABLE IF NOT EXISTS charging_stations (
    station_id INTEGER PRIMARY KEY,
    station_name TEXT NOT NULL,
    address TEXT NULL,
    city TEXT NULL,
    latitude REAL NULL,
    longitude REAL NULL,
    total_posts INTEGER NULL,
    available_posts INTEGER NULL,
    status TEXT NULL,
    created_at TEXT NULL,
    updated_at TEXT NULL,
    deleted_at TEXT NULL
);
");

if (Count("SELECT COUNT(*) FROM charging_stations") == 0)
{
    for (int i = 1; i <= 10; i++)
    {
        using var ins = conn.CreateCommand();
        ins.CommandText = "INSERT INTO charging_stations (station_id, station_name, address, city, latitude, longitude, total_posts, available_posts, status, created_at, updated_at) VALUES ($id,$name,$addr,$city,$lat,$lng,$tp,$ap,$st,$c,$u)";
        ins.Parameters.AddWithValue("$id", i);
        ins.Parameters.AddWithValue("$name", $"Station {i}");
        ins.Parameters.AddWithValue("$addr", $"Address {i}");
        ins.Parameters.AddWithValue("$city", "Hanoi");
        ins.Parameters.AddWithValue("$lat", 21.0 + i * 0.001);
        ins.Parameters.AddWithValue("$lng", 105.8 + i * 0.001);
        ins.Parameters.AddWithValue("$tp", 4 + (i % 4));
        ins.Parameters.AddWithValue("$ap", 2 + (i % 3));
        ins.Parameters.AddWithValue("$st", "ACTIVE");
        ins.Parameters.AddWithValue("$c", DateTime.UtcNow.ToString("o"));
        ins.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("o"));
        ins.ExecuteNonQuery();
    }
    Console.WriteLine("Inserted sample charging_stations (10 rows)");
}
else Console.WriteLine($"charging_stations already has {Count("SELECT COUNT(*) FROM charging_stations")} rows");

// 2) Users
Exec(@"
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT NULL
);
");

if (Count("SELECT COUNT(*) FROM users") == 0)
{
    for (int i = 1; i <= 20; i++)
    {
        using var ins = conn.CreateCommand();
        ins.CommandText = "INSERT INTO users (user_id,email,password_hash,full_name,phone_number,role,is_active,created_at,updated_at) VALUES ($id,$email,$pw,$name,$phone,$role,1,$c,$u)";
        ins.Parameters.AddWithValue("$id", i);
        ins.Parameters.AddWithValue("$email", $"user{i}@example.com");
        ins.Parameters.AddWithValue("$pw", "$2a$12$demo-password-hash");
        ins.Parameters.AddWithValue("$name", $"User {i}");
        ins.Parameters.AddWithValue("$phone", $"+840000{i:000}");
        ins.Parameters.AddWithValue("$role", i == 1 ? "ADMIN" : "CUSTOMER");
        ins.Parameters.AddWithValue("$c", DateTime.UtcNow.ToString("o"));
        ins.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("o"));
        ins.ExecuteNonQuery();
    }
    Console.WriteLine("Inserted sample users (20 rows)");
}

// 3) Vehicles
Exec(@"
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    vehicle_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    license_plate TEXT,
    battery_capacity REAL,
    charging_port_type TEXT,
    is_primary INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT NULL
);
");

if (Count("SELECT COUNT(*) FROM vehicles") == 0)
{
    int vid = 1;
    for (int uid = 1; uid <= 15; uid++)
    {
        using var ins = conn.CreateCommand();
        ins.CommandText = "INSERT INTO vehicles (vehicle_id,user_id,vehicle_type,brand,model,license_plate,battery_capacity,charging_port_type,is_primary,created_at,updated_at) VALUES ($vid,$uid,$type,$brand,$model,$plate,$cap,$port,1,$c,$u)";
        ins.Parameters.AddWithValue("$vid", vid);
        ins.Parameters.AddWithValue("$uid", uid);
        ins.Parameters.AddWithValue("$type", "EV");
        ins.Parameters.AddWithValue("$brand", "Nissan");
        ins.Parameters.AddWithValue("$model", "Leaf");
        ins.Parameters.AddWithValue("$plate", $"ABC-{vid:0000}");
        ins.Parameters.AddWithValue("$cap", 40.0 + (vid % 30));
        ins.Parameters.AddWithValue("$port", "Type2");
        ins.Parameters.AddWithValue("$c", DateTime.UtcNow.ToString("o"));
        ins.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("o"));
        ins.ExecuteNonQuery();
        vid++;
    }
    Console.WriteLine("Inserted sample vehicles (15 rows)");
}

// 4) Charging posts and slots
Exec(@"
CREATE TABLE IF NOT EXISTS charging_posts (
    post_id INTEGER PRIMARY KEY,
    station_id INTEGER NOT NULL,
    post_number TEXT NOT NULL,
    post_type TEXT NOT NULL,
    power_output REAL NOT NULL,
    total_slots INTEGER,
    available_slots INTEGER,
    status TEXT,
    created_at TEXT,
    updated_at TEXT
);
");

Exec(@"
CREATE TABLE IF NOT EXISTS charging_slots (
    slot_id INTEGER PRIMARY KEY,
    post_id INTEGER NOT NULL,
    slot_number TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    max_power REAL NOT NULL,
    status TEXT NOT NULL,
    current_booking_id INTEGER,
    created_at TEXT,
    updated_at TEXT
);
");

if (Count("SELECT COUNT(*) FROM charging_posts") == 0)
{
    int postId = 1;
    int slotId = 1;
    for (int s = 1; s <= 10; s++)
    {
        int postsForStation = 2;
        for (int p = 1; p <= postsForStation; p++)
        {
            using var insp = conn.CreateCommand();
            insp.CommandText = "INSERT INTO charging_posts (post_id,station_id,post_number,post_type,power_output,total_slots,available_slots,status,created_at,updated_at) VALUES ($pid,$sid,$pnum,$ptype,$pwr,2,2,'ACTIVE',$c,$u)";
            insp.Parameters.AddWithValue("$pid", postId);
            insp.Parameters.AddWithValue("$sid", s);
            insp.Parameters.AddWithValue("$pnum", $"P{postId}");
            insp.Parameters.AddWithValue("$ptype", "CHADEMO");
            insp.Parameters.AddWithValue("$pwr", 50.0);
            insp.Parameters.AddWithValue("$c", DateTime.UtcNow.ToString("o"));
            insp.Parameters.AddWithValue("$u", DateTime.UtcNow.ToString("o"));
            using Microsoft.Data.Sqlite;
            using System.Globalization;

            namespace SkaEV.Api.Tools.SqliteSeeder
{
    public static class Program
    {
        public static int Main(string[] args)
        {
            var dbPath = args.Length > 0 ? args[0] : Path.Combine(AppContext.BaseDirectory, "../../../../SkaEV.API/skaev_dev.db");
            dbPath = Path.GetFullPath(dbPath);
            Console.WriteLine($"Seeding SQLite DB at: {dbPath}");

            var folder = Path.GetDirectoryName(dbPath)!;
            if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

            var connString = new SqliteConnectionStringBuilder { DataSource = dbPath }.ToString();
            using var conn = new SqliteConnection(connString);
            conn.Open();

            void Exec(string sql)
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = sql;
                cmd.ExecuteNonQuery();
            }

            // Helper to check existence
            int Count(string sql, params (string, object)[] pars)
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = sql;
                foreach (var (n, v) in pars) cmd.Parameters.AddWithValue(n, v ?? DBNull.Value);
                return Convert.ToInt32(cmd.ExecuteScalar()!);
            }

            // 1) charging_stations (existing simplified table)
            Exec(@"
            CREATE TABLE IF NOT EXISTS charging_stations (
                station_id INTEGER PRIMARY KEY,
                station_name TEXT NOT NULL,
                address TEXT NULL,
                city TEXT NULL,
                latitude REAL NULL,
                longitude REAL NULL,
                total_posts INTEGER NULL,
                available_posts INTEGER NULL,
                status TEXT NULL,
                created_at TEXT NULL,
                updated_at TEXT NULL,
                deleted_at TEXT NULL
            );
                        ");
            var vehicle = (i % 15) + 1;
