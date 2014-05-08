namespace Midway.Models.DTOs
{
    public class DtoAirOpAircraft
    {
        public int SourceId { get; set; }
        public string SourceType { get; set; }  // Airbase or Ship
        public int TSquadrons { get; set; }
        public int FSquadrons { get; set; }
        public int DSquadrons { get; set; }
    }
}