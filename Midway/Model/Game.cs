using System;
using System.Collections.Generic;


namespace Midway.Model
{
    public class Game
    {
        public int GameId { get; set; }
        public DateTime CreateDTime { get; set; }
        public DateTime? CompletedDTime { get; set; }
        public string Draw { get; set; }

        public virtual IList<PlayerGame> PlayerGames { get; set; }
    }
}