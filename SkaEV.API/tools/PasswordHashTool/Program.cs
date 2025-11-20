using System;
using BCrypt.Net;

if (args.Length == 0)
{
    Console.WriteLine("Usage: dotnet run --project PasswordHashTool -- <password> [workFactor]");
    return 1;
}

var password = args[0];
var workFactor = 12;
if (args.Length > 1 && int.TryParse(args[1], out var w)) workFactor = w;

var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor);
Console.WriteLine(hash);
return 0;
