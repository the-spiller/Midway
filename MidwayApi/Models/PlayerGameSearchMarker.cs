namespace MidwayApi.Models
{
	public class PlayerGameSearchMarker
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public string Zone { get; set; }
        public int PlacedTurn { get; set; }
        public int CVs { get; set; }
        public int CVLs { get; set; }
        public int BBs { get; set; }
        public int CAs { get; set; }
        public int CLs { get; set; }
        public int DDs { get; set; }

		public virtual PlayerGame PlayerGame { get; set; }
	}
}