using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
	public class PlayerGameSearchResultMap : EntityTypeConfiguration<PlayerGameSearchResult>
	{
		public PlayerGameSearchResultMap()
		{
			ToTable("PlayerGameSearchResult");

			HasKey(p => new { p.GameId, p.PlayerId, p.SearchNumber });
			Property(p => p.GameId).IsRequired();
			Property(p => p.PlayerId).IsRequired();
			Property(p => p.SearchNumber).IsRequired();

            Property(p => p.Turn).IsRequired();
            Property(p => p.SearchType).HasMaxLength(3);
			Property(p => p.Area).HasMaxLength(2);
            Property(p => p.Found).HasMaxLength(36);
		}
	}
}