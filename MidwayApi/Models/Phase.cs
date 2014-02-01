using System.Collections.Generic;

namespace MidwayApi.Models
{
	public class Phase
	{
		public int PhaseId { get; set; }
		public string Name { get; set; }
		public string Description { get; set; }
		public string MightSkip { get; set; }

		public virtual IList<PlayerGame> PlayerGames { get; set; }
	}
}