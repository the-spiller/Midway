using System;
using System.Collections.Generic;

namespace Midway.Model
{
    public class Player
    {
        public int PlayerId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Nickname { get; set; }
        public string Admin { get; set; }
        public long Lockout { get; set; }

        public virtual IList<PlayerGame> PlayerGames { get; set; }
    }
}