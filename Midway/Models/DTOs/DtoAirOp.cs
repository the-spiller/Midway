using System.Collections.Generic;

namespace Midway.Models.DTOs
{
    public class DtoAirOp
    {
        public int AirOpId { get; set; }
        public int Turn { get; set; }
        public string Zone { get; set; }
        public string Mission { get; set; }
        public string AircraftTotals { get; set; }

        public IList<DtoAirOpSource> AirOpsSources { get; set; }
    }
}