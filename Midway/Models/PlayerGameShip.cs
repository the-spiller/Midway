namespace Midway.Models
{
	public class PlayerGameShip
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public int ShipId { get; set; }
		public int Hits { get; set; }
		public string Location { get; set; }
		public int TSquadrons { get; set; }
		public int FSquadrons { get; set; }
		public int DSquadrons { get; set; }

		public virtual PlayerGame PlayerGame { get; set; }
		public virtual Ship Ship { get; set; }
	}
}