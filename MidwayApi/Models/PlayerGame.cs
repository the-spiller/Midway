using System;

namespace MidwayApi.Models
{
	public class PlayerGame
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public int SideId { get; set; }
		public int PhaseId { get; set; }
		public DateTime? LastPlayed { get; set; }
		public int Points { get; set; }
		public string SelectedLocation { get; set; }
		public int SurfaceCombatRound { get; set; }
		public string PhaseIndeterminate { get; set; }
		public int Turn { get; set; }
		public int MidwayInvadedTurn { get; set; }

		public virtual Game Game { get; set; }
		public Player Player { get; set; }
		public Side Side { get; set; }
		public Phase Phase { get; set; }
	}
}