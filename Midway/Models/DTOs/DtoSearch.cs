using System.Collections.Generic;

namespace Midway.Models.DTOs
{
	public class DtoSearch
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
        public int Turn { get; set; }
        public int SearchNumber { get; set; }
        public string SearchType { get; set; }
        public string Area { get; set; }

        public IList<DtoSearchMarker> Markers { get; set; }
	}
}