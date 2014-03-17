using System;
using System.Collections.Generic;
using System.Linq;
using Midway.Models.DTOs;

namespace Midway.Helpers
{
    public static class AuthHelper
    {
        private static IList<AuthEntry> _entries;
        private const string COOKIE_NAME = "mdyplayer";
        private const int EXPIRE_HOURS = 2;

        static AuthHelper()
        {
            _entries = new List<AuthEntry>();
        }

        public static string CookieName { get { return COOKIE_NAME;  } }

        public static string RegisterPlayer(string email, string admin)
        {
            var entry = _entries.SingleOrDefault(e => e.Email == email);
            var expires = DateTime.Now.AddHours(EXPIRE_HOURS);
            if (entry == null)
            {
                entry = new AuthEntry
                    {
                        Email = email,
                        Token = Guid.NewGuid().ToString(),
                        Expires = expires,
                        Role = admin == "Y" ? "Admin" : "Player"
                    };
                _entries.Add(entry);
            }
            else
            {
                entry.Expires = expires;
            }
            return entry.Token;
        }

        public static string GetPlayerKey(string email)
        {
            var entry = _entries.SingleOrDefault(e => e.Email == email);
            if (entry != null)
                return entry.Token;

            return string.Empty;
        }

        public static string GetPlayerRole(string email, string token)
        {
            // This is where we're actually authenticating the email/token combination. A return of ""
            // indicates an invalid email or invalid token.

            // clear out expired token entries
            var deadEntries = _entries.Where(e => e.Expires < DateTime.Now).ToList();
            foreach (var deadEntry in deadEntries)
            {
                _entries.Remove(deadEntry);
            }

            // find this one
            var entry = _entries.FirstOrDefault(e => e.Email == email && e.Token == token);
            if (entry != null)
            {
                // re-up the entry
                entry.Expires = DateTime.Now.AddHours(EXPIRE_HOURS);
                return entry.Role;
            }
            return string.Empty;
        }
    }
    
    internal class AuthEntry
    {
        public string Email { get; set; }
        public string Token { get; set; }
        public DateTime Expires { get; set; }
        public string Role { get; set; }
    }
}