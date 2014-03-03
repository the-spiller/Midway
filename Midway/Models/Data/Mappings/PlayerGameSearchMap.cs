using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace Midway.Models.Data.Mappings
{
    public class PlayerGameSearchMap : EntityTypeConfiguration<PlayerGameSearch>
    {
        public PlayerGameSearchMap()
        {
            ToTable("PlayerGameSearch");

            HasKey(p => new { p.GameId, p.PlayerId, p.Turn, p.SearchNumber });
            Property(p => p.GameId).IsRequired();
            Property(p => p.PlayerId).IsRequired();
            Property(p => p.Turn).IsRequired();
            Property(p => p.SearchNumber).IsRequired();
            Property(p => p.SearchType).HasMaxLength(3).IsRequired();
            Property(p => p.Area).HasMaxLength(2).IsRequired();

            HasMany(p => p.SearchMarkers)
                .WithRequired(g => g.PlayerGameSearch)
                .HasForeignKey(g => new { g.GameId, g.PlayerId, g.Turn, g.SearchNumber});
        }
    }
}