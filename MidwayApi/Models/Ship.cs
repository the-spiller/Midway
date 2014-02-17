

using System;
using System.Collections.Generic;

namespace MidwayApi.Models
{
	public class Ship
	{
		public int ShipId { get; set; }
		public string Name { get; set; }
        public int ArrivalTurn { get; set; }
		public string ShipType { get; set; }
		public string HullNumber { get; set; }
		public string TaskForce { get; set; }
		public int HitsToSink { get; set; }
		public int PointsToSink { get; set; }
		public int ScreenStrength { get; set; }
		public int SurfaceStrength { get; set; }
		public int AircraftCapacity { get; set; }
		public int TSquadrons { get; set; }
		public int FSquadrons { get; set; }
		public int DSquadrons { get; set; }
		public string SearchImgPath { get; set; }
		public string BattleImgPath { get; set; }

		public virtual Side Side { get; set; }
		public virtual IList<PlayerGameShip> PlayerGameShips { get; set; }
	}
}