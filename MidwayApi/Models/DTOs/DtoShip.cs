namespace MidwayApi.Models.DTOs
{
    public class DtoShip
    {
        public int Id { get; set; }
        public string OwningSide { get; set; }
        public string Location { get; set; }
        public string Name { get; set; }
        public string ShipType { get; set; }
        public string SearchImgPath { get; set; }
        public string BattleImgPath { get; set; }
        public int MovePoints { get; set; }
        public int HitsToSink { get; set; }
        public int Hits { get; set; }
        public int ScreenStrength { get; set; }
        public int SurfaceStrength { get; set; }
        public int AircraftCapacity { get; set; }
        public int TSquadrons { get; set; }
        public int FSquadrons { get; set; }
        public int DSquadrons { get; set; }
        public int AirReadyState { get; set; }
        public int ArrivalTurn { get; set; }
    }
}