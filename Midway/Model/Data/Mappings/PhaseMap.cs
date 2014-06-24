using System.Data.Entity.ModelConfiguration;

namespace Midway.Model.Data.Mappings
{
    public class PhaseMap : EntityTypeConfiguration<Phase>
    {
        public PhaseMap()
        {
            ToTable("Phase");

            HasKey(p => p.PhaseId);
            Property(p => p.PhaseId).IsRequired();

            Property(p => p.Name).IsRequired().HasMaxLength(40);
            Property(p => p.Description).HasMaxLength(256);
	        Property(p => p.MightSkip).HasMaxLength(1).IsRequired();

            HasMany(p => p.PlayerGames).WithRequired(g => g.Phase).HasForeignKey(p => p.PhaseId);
			HasMany(p => p.PhaseActions).WithRequired(a => a.Phase).HasForeignKey(a => a.PhaseId);
        }
    }
}