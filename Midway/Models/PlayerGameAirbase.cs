namespace Midway.Models
{
	public class PlayerGameAirbase
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public int AirbaseId { get; set; }
		public int FortificationStrength { get; set; }
		public int TSquadrons { get; set; }
		public int FSquadrons { get; set; }
		public int DSquadrons { get; set; }
        public int AircraftState { get; set; }

		public virtual PlayerGame PlayerGame { get; set; }
		public virtual Airbase Airbase { get; set; }
	}
}