using System;
using System.Collections.Generic;

namespace Midway.Models
{
    public class Side
    {
        public int SideId { get; set; }
        public string ShortName { get; set; }
        public string LongName { get; set; }
		public string FlagUrl { get; set; }
		public string TinyFlagUrl { get; set; }

        public virtual IList<PlayerGame> PlayerGames { get; set; }
		public virtual IList<Airbase> Airbases { get; set; }
		public virtual IList<Ship> Ships { get; set; }
    }
}