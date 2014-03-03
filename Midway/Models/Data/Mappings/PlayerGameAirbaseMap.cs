using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace Midway.Models.Data.Mappings
{
	public class PlayerGameAirbaseMap : EntityTypeConfiguration<PlayerGameAirbase>
	{
		public PlayerGameAirbaseMap()
		{
			ToTable("PlayerGameAirbase");

			HasKey(p => new { p.GameId, p.PlayerId, p.AirbaseId });
			Property(p => p.GameId).IsRequired();
			Property(p => p.PlayerId).IsRequired();
			Property(p => p.AirbaseId).IsRequired();

			Property(p => p.FortificationStrength);
			Property(p => p.TSquadrons);
			Property(p => p.FSquadrons);
			Property(p => p.DSquadrons);
            Property(p => p.AircraftReadyState);
		}
	}
}