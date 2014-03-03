using System.Collections;

namespace Midway.Models
{
	public class PlayerGameSearchMarker
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
        public int Turn { get; set; }
        public int SearchNumber { get; set; }
		public string Zone { get; set; }
		public string TypesFound { get; set; }

        public virtual PlayerGameSearch PlayerGameSearch { get; set; }
	}
}