using System;
using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmLocation
    {
        public string Zone { get; set; }
        public VmSearchMarker SearchMarker { get; set; }
        public VmAirbase Airbase { get; set; }
        public IList<VmShip> Ships { get; set; }
        public IList<VmAirOp> AirOps { get; set; }
    }
}