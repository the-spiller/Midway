using System;

namespace MidwayApi.Models.DTOs
{
	public class DtoGame
	{
		public int GameId { get; set; }
		public int SideId { get; set; }
		public string SideShortName { get; set; }	// My side
		public string TinyFlagUrl { get; set; }
		public DateTime? LastPlayed { get; set; }	// Max of last played for both players
		public DateTime? CompletedDTime { get; set; }
		public int Points { get; set; }	// My score
		public string SelectedLocation { get; set; }
		public int? OpponentId { get; set; }
		public string OpponentNickname { get; set; }
		public int? OpponentPoints { get; set; }
        public string Draw { get; set; }
	}
}