using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
    public class SideMap : EntityTypeConfiguration<Side>
    {
        public SideMap()
        {
            this.ToTable("Side");

            this.HasKey(s => s.SideId);
            this.Property(s => s.SideId).IsRequired();

            this.Property(s => s.ShortName).IsRequired().HasMaxLength(3);
            this.Property(s => s.LongName).HasMaxLength(60);
			this.Property(s => s.FlagUrl).HasMaxLength(256);
			this.Property(s => s.TinyFlagUrl).HasMaxLength(256);

            this.HasMany(s => s.PlayerGames).WithRequired(p => p.Side).HasForeignKey(p => p.SideId);
            this.HasMany(s => s.Airbases).WithRequired(i => i.Side).Map(s => s.MapKey("SideId"));
			this.HasMany(s => s.Ships).WithRequired(sh => sh.Side).Map(s => s.MapKey("SideId"));
        }
    }
}