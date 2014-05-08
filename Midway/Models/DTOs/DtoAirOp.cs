using System.Collections.Generic;

namespace Midway.Models.DTOs
{
    public class DtoAirOp
    {
        public int AirOpId { get; set; }
        public int PlayerId { get; set; }
        public int GameId { get; set; }
        public int Turn { get; set; }
        public string Zone { get; set; }
        public string Mission { get; set; }

        public IList<AirOpAircraft> AirOpsAircraft { get; set; }
    }
}