using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
	public class PlayerGameMap : EntityTypeConfiguration<PlayerGame>
	{
		public PlayerGameMap()
		{
			ToTable("PlayerGame");
			HasKey(p => new { p.GameId, p.PlayerId });

			Property(p => p.GameId).IsRequired();
			Property(p => p.PlayerId).IsRequired();
			Property(p => p.SideId).IsRequired();
			Property(p => p.PhaseId).IsRequired();
			Property(p => p.LastPlayed).IsOptional();
			Property(p => p.Points).IsOptional();
			Property(p => p.SelectedLocation).IsOptional().HasMaxLength(3);
			Property(p => p.SurfaceCombatRound).IsRequired();
			Property(p => p.PhaseIndeterminate).IsRequired().HasMaxLength(1);
			Property(p => p.Turn).IsRequired();
			Property(p => p.MidwayInvadedTurn).IsRequired();
		}
	}
}