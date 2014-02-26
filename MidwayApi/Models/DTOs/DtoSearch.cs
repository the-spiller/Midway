namespace MidwayApi.Models.DTOs
{
	public class DtoSearch
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public string Zone { get; set; }
		public int PlacedTurn { get; set; }
		public string TypesFound { get; set; }
	}
}