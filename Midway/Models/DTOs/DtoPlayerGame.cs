using System;

namespace Midway.Models.DTOs
{
	public class DtoPlayerGame
	{
		public int GameId { get; set; }
		public int SideId { get; set; }
        public int Turn { get; set; }
        public int PhaseId { get; set; }
		public string SideShortName { get; set; }	// My side
		public string TinyFlagUrl { get; set; }
		public string LastPlayed { get; set; }	// Max of last played for both players
        public int AircraftReadyState { get; set; }
		public string CompletedDTime { get; set; }
		public int Points { get; set; }	// My score
		public string SelectedLocation { get; set; }
		public int OpponentId { get; set; }
		public string OpponentNickname { get; set; }
		public int OpponentPoints { get; set; }
        public string Draw { get; set; }
        public string Waiting { get; set; }
	}
}