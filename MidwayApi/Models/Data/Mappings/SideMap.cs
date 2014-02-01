using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
	public class SideMap : EntityTypeConfiguration<Side>
	{
		public SideMap()
		{
			ToTable("Side");
			HasKey(s => s.SideId);

			Property(s => s.SideId).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
			Property(s => s.ShortName).IsRequired().HasMaxLength(4);
			Property(s => s.LongName).IsRequired().HasMaxLength(60);
			Property(s => s.FlagUrl).IsOptional().HasMaxLength(256);
			Property(s => s.TinyFlagUrl).IsOptional().HasMaxLength(256);

			HasMany(s => s.PlayerGames).WithRequired(p => p.Side).HasForeignKey(p => p.SideId);
		}
	}
}