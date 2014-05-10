using System.Data.Entity.ModelConfiguration;

namespace Midway.Models.Data.Mappings
{
	public class PlayerGameMap : EntityTypeConfiguration<PlayerGame>
	{
		public PlayerGameMap()
		{
			ToTable("PlayerGame");

			HasKey(p => new { p.GameId, p.PlayerId });
			Property(p => p.GameId).IsRequired();
			Property(p => p.PlayerId).IsRequired();

			Property(p => p.Turn).IsRequired();
			Property(p => p.SideId).IsRequired();
			Property(p => p.PhaseId).IsRequired();
			Property(p => p.Points);
            Property(p => p.MidwayInvadedTurn).IsRequired();
            Property(p => p.SelectedLocation).HasMaxLength(3);
		    Property(p => p.SurfaceCombatRound).IsRequired();

			HasMany(p => p.Airbases).WithRequired(i => i.PlayerGame).HasForeignKey(s => new { s.GameId, s.PlayerId });
			HasMany(p => p.Ships).WithRequired(s => s.PlayerGame).HasForeignKey(s => new { s.GameId, s.PlayerId });
		    HasMany(p => p.Searches).WithRequired(s => s.PlayerGame).HasForeignKey(s => new { s.GameId, s.PlayerId });
            HasMany(p => p.AirOps).WithRequired(a => a.PlayerGame).HasForeignKey(a => new { a.GameId, a.PlayerId });
		}
	}
}