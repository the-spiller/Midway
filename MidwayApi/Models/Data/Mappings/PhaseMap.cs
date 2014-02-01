using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
	public class PhaseMap : EntityTypeConfiguration<Phase>
	{
		public PhaseMap()
		{
			ToTable("Phase");
			HasKey(p => p.PhaseId);

			Property(p => p.PhaseId).IsRequired();
			Property(p => p.Name).IsRequired().HasMaxLength(40);
			Property(p => p.Description).IsOptional().HasMaxLength(256);
			Property(p => p.MightSkip).IsRequired().HasMaxLength(1);

			HasMany(p => p.PlayerGames).WithRequired(g => g.Phase).HasForeignKey(g => g.PhaseId);
		}
	}
}