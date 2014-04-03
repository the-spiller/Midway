namespace Midway.Models.Services
{
    public class AuthCacheEntry
    {
        public string CookieName { get { return "mdyplayer"; } }
        public int ExpirationHours { get { return 2; } }

        public string Token { get; set; }
        public int Id { get; set; }
        public string Role { get; set; }
    }
}