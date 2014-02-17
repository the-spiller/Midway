namespace MidwayApi.Models
{
	public class PlayerGameSearchResult
	{
		public int GameId { get; set; }
		public int PlayerId { get; set; }
		public int SearchNumber { get; set; }
        public string SearchType { get; set; }
		public string Area { get; set; }
		public string Found { get; set; }
        public int Turn { get; set; }

		public virtual PlayerGame PlayerGame { get; set; }
	}
}