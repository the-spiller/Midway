using System.Collections;

namespace MidwayApi.Models
{
	public class PlayerGameSearchMarker
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public string Zone { get; set; }
        public int PlacedTurn { get; set; }
		public string TypesFound { get; set; }

		public virtual PlayerGame PlayerGame { get; set; }
	}
}