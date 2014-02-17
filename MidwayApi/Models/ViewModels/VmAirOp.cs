using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmAirOp
    {
        public string Zone { get; set; }
        public string Mission { get; set; }
        public IList<VmAirOpAircraft> Aircraft { get; set; }
    }
}