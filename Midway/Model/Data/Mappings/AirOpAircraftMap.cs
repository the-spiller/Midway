using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace Midway.Model.Data.Mappings
{
    public class AirOpAircraftMap : EntityTypeConfiguration<AirOpAircraft>
    {
        public AirOpAircraftMap()
        {
            this.ToTable("AirOpAircraft");

            this.HasKey(a => new { a.AirOpId, a.SourceId, a.SourceType });
            this.Property(a => a.AirOpId).IsRequired();
            this.Property(a => a.SourceId).IsRequired();
            this.Property(a => a.SourceType).IsRequired();

            this.Property(a => a.TSquadrons);
            this.Property(a => a.FSquadrons);
            this.Property(a => a.DSquadrons);
        }
    }
}