using System.Collections.Generic;

namespace Midway.Models
{
    public class Phase
    {
        public int PhaseId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
		public string MightSkip { get; set; }

        public IList<PlayerGame> PlayerGames { get; set; }
		public IList<PhaseAction> PhaseActions { get; set; }
    }
}