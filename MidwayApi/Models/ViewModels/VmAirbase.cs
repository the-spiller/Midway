using System;
using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmAirbase
    {            
        public int Id { get; set; }
        public string OwningSide { get; set; }
        public string Name { get; set; }
        public int FortificationStrength { get; set; }
        public int AircraftCapacity { get; set; }
		public int TSquadrons { get; set; }
		public int FSquadrons { get; set; }
		public int DSquadrons { get; set; }
        public AircraftReadiness AirReadyState { get; set; }
        public string SearchImgPath { get; set; }
        public string BattleImgPath { get; set; }
    }
}