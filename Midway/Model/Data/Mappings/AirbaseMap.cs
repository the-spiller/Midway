using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace Midway.Model.Data.Mappings
{
	public class AirbaseMap : EntityTypeConfiguration<Airbase>
	{
		public AirbaseMap()
		{
			this.ToTable("Airbase");

			this.HasKey(i => i.AirbaseId);
			this.Property(i => i.AirbaseId).IsRequired();

			this.Property(i => i.AirbaseName).HasMaxLength(60);
			this.Property(i => i.FortificationStrength);
			this.Property(i => i.AircraftCapacity);
			this.Property(i => i.TSquadrons);
			this.Property(i => i.FSquadrons);
			this.Property(i => i.DSquadrons);
			this.Property(i => i.Location).IsRequired();
            this.Property(i => i.SearchImgPath).HasMaxLength(256);
            this.Property(i => i.BattleImgPath).HasMaxLength(256);

			this.HasMany(i => i.PlayerGameAirbases).WithRequired(p => p.Airbase).HasForeignKey(p => p.AirbaseId);
		}
	}
}