using System.Data.Entity.ModelConfiguration;


namespace Midway.Model.Data.Mappings
{
	public class PlayerGameSearchMarkerMap : EntityTypeConfiguration<PlayerGameSearchMarker>
	{
		public PlayerGameSearchMarkerMap()
		{
			ToTable("PlayerGameSearchMarker");

			HasKey(s => new { s.GameId, s.PlayerId, s.Turn, s.SearchNumber, s.Zone });
			Property(s => s.GameId).IsRequired();
			Property(s => s.PlayerId).IsRequired();
		    Property(s => s.Turn).IsRequired();
		    Property(s => s.SearchNumber).IsRequired();
			Property(s => s.Zone).HasMaxLength(3).IsRequired();
			Property(s => s.TypesFound).HasMaxLength(30).IsRequired();
		}
	}
}