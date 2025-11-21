using System;

namespace SkaEV.API.Application.Services
{
    public static class PasswordHasher
    {
        public static string HashPassword(string password)
        {
            // Use BCrypt for password hashing (already used in AuthService)
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public static bool Verify(string hashedPassword, string providedPassword)
        {
            if (string.IsNullOrEmpty(hashedPassword)) return false;

            // If stored value looks like a BCrypt hash, verify accordingly
            if (hashedPassword.StartsWith("$2"))
            {
                try
                {
                    return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
                }
                catch (BCrypt.Net.SaltParseException)
                {
                    // Malformed bcrypt hash (e.g. migrated/imported with wrong salt/version).
                    // Fall back to legacy/plaintext comparison so the application can
                    // handle migration-on-login without blowing up.
                    return hashedPassword == providedPassword;
                }
                catch
                {
                    // Any other bcrypt-related error: fail verification safely
                    return false;
                }
            }

            // Fallback: plain-comparison (for legacy users) - not ideal but allows transition
            return hashedPassword == providedPassword;
        }
    }
}
