using System;
using System.Collections.Generic;

namespace Midway.Model
{
    public class AirOpAircraft
    {
        public int AirOpId { get; set; }
        public int SourceId { get; set; }
        public string SourceType { get; set; }  // Airbase or Ship
        public int TSquadrons { get; set; }
        public int FSquadrons { get; set; }
        public int DSquadrons { get; set; }

        public virtual AirOp AirOp { get; set; }
    }
}