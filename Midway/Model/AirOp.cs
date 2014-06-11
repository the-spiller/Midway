using System.Collections.Generic;

namespace Midway.Model
{
    public class AirOp
    {
        public int AirOpId { get; set; }
        public int GameId { get; set; }
        public int PlayerId { get; set; }
        public int Turn { get; set; }
        public string Zone { get; set; }
        public string Mission { get; set; }

        public virtual PlayerGame PlayerGame { get; set; }
        public virtual IList<AirOpAircraft> AirOpAircraftSet { get; set; }
    }
}