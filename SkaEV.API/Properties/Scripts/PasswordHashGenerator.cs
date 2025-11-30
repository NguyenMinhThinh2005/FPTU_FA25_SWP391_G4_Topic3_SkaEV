using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace SkaEV.API.Scripts
{
    /// <summary>
    /// Utility to generate password hash for seeding database
    /// Usage: Run this in Program.cs or create a separate console app
    /// </summary>
    public class PasswordHashGenerator
    {
        public static string HashPassword(string password)
        {
            // Generate a salt
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password
            string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            // Combine salt and hash
            var saltBase64 = Convert.ToBase64String(salt);
            return $"{saltBase64}:{hashed}";
        }

        public static void GenerateHashForSeeding()
        {
            string password = "Customer123!";
            string hash = HashPassword(password);
            
            Console.WriteLine("================================");
            Console.WriteLine("Password Hash Generator");
            Console.WriteLine("================================");
            Console.WriteLine($"Password: {password}");
            Console.WriteLine($"Hash: {hash}");
            Console.WriteLine("================================");
            Console.WriteLine("Copy this hash to your SQL script!");
        }
    }
}
