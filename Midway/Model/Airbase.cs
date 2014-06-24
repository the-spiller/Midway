using System;
using System.Collections.Generic;


namespace Midway.Model
{
	public class Airbase
	{
		public int AirbaseId { get; set; }
		public string AirbaseName { get; set; }
        public string Location { get; set; }
		public int FortificationStrength { get; set; }
		public int AircraftCapacity { get; set; }
		public int TSquadrons { get; set; }
		public int FSquadrons { get; set; }
		public int DSquadrons { get; set; }
        public string ImagePath { get; set; }

		public virtual Side Side { get; set; }
		public virtual IList<PlayerGameAirbase> PlayerGameAirbases { get; set; }
	}
}