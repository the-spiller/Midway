using System;
using System.Collections.Generic;

namespace MidwayApi.Models
{
	public class Game
	{
		public int GameId { get; set; }
		public DateTime CreateDTime { get; set; }
		public DateTime? CompletedDTime { get; set; }

		public virtual IList<PlayerGame> PlayerGames { get; set; }
	}
}