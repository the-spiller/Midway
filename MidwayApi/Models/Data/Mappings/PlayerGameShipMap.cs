using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
	public class PlayerGameShipMap : EntityTypeConfiguration<PlayerGameShip>
	{
		public PlayerGameShipMap()
		{
			this.ToTable("PlayerGameShip");

			this.HasKey(p => new { p.GameId, p.PlayerId, p.ShipId });
			this.Property(p => p.GameId).IsRequired();
			this.Property(p => p.PlayerId).IsRequired();
			this.Property(p => p.ShipId).IsRequired();
			this.Property(p => p.Hits);
			this.Property(p => p.Location).HasMaxLength(3);
			this.Property(p => p.TSquadrons);
			this.Property(p => p.FSquadrons);
			this.Property(p => p.DSquadrons);
            this.Property(p => p.AircraftReadyState);
		}
	}
}