using System.Collections.Generic;

namespace Midway.Models
{
    public class PlayerGameSearch
    {
        public int GameId { get; set; }
        public int PlayerId{ get; set; }
        public int Turn { get; set; }
        public int SearchNumber { get; set; }
        public string SearchType { get; set; }
        public string Area { get; set; }

        public virtual PlayerGame PlayerGame { get; set; }
        public virtual IList<PlayerGameSearchMarker> SearchMarkers { get; set; }
    }
}