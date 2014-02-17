using System;
using System.Collections.Generic;

namespace MidwayApi.Models
{
    public class PlayerGame
    {
        public int GameId { get; set; }
        public int PlayerId { get; set; }
		public int Turn { get; set; }
        public DateTime? LastPlayed { get; set; }
        public int SideId { get; set; }
        public int PhaseId { get; set; }
        public int Points { get; set; }
        public string SelectedLocation { get; set; }
        public int SurfaceCombatRound { get; set; }
        public string PhaseIndeterminate { get; set; }
        public int MidwayInvadedTurn { get; set; }

        public virtual Game Game { get; set; }
        public virtual Player Player { get; set; }
        public virtual Side Side { get; set; }
        public virtual Phase Phase { get; set; }

		public virtual IList<PlayerGameAirbase> Airbases { get; set; }
		public virtual IList<PlayerGameShip> Ships { get; set; }
		public virtual IList<PlayerGameSearchMarker> SearchMarkers { get; set; }
		public virtual IList<PlayerGameSearchResult> SearchResults { get; set; }
        public virtual IList<AirOp> AirOps { get; set; }
    }
}