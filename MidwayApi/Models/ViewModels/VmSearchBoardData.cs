using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmSearchBoardData
    {
        public int GameId { get; set; }
        public int PlayerId { get; set; }
        public string Admin { get; set; }
        public string PlayerSide { get; set; }
        public string SmallFlagImgPath { get; set; }
        public string OpponentNickname { get; set; }
        public int PhaseId { get; set; }
        public int SearchRange { get; set; }
		public int Turn { get; set; }
        public string GameDTime { get; set; }
        public string GameStatus { get; set; }
        public string WaitingFlag { get; set; }
        public int Points { get; set; }
        public string SelectedLocation { get; set; }
        public IList<Action> Actions { get; set; }
        public IList<VmShip> ArrivingShips { get; set; }
		public IList<VmShip> ShipsDue { get; set; }
		public IList<VmLocation> Locations { get; set; }
        public IList<VmSearchResult> SearchResults { get; set; }
        public IList<VmAirOp> AirOperations { get; set; }
        public IList<VmAirOp> OpponentsAirOps { get; set; }
        public string JsonData { get; set; }
    }
}