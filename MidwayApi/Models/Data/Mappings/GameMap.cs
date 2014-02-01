using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
	public class GameMap : EntityTypeConfiguration<Game>
	{
		public GameMap()
		{
			ToTable("Game");
			HasKey(g => g.GameId);

			Property(g => g.GameId).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
			Property(g => g.CreateDTime).IsRequired();
			Property(g => g.CompletedDTime).IsOptional();

			HasMany(g => g.PlayerGames).WithRequired(p => p.Game).HasForeignKey(p => p.GameId);
		}
	}
}