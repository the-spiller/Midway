using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;

namespace Midway.Models.Data.Mappings
{
	public class PhaseActionMap : EntityTypeConfiguration<PhaseAction>
	{
		public PhaseActionMap()
		{
			this.ToTable("PhaseAction");

			this.HasKey(p => new { p.PhaseId, p.ActionKey });
			this.Property(p => p.PhaseId).IsRequired();
			this.Property(p => p.ActionKey).HasMaxLength(16).IsRequired();

			this.Property(p => p.Order).IsRequired();
            this.Property(p => p.AvailWhenWaiting).HasMaxLength(1).IsRequired();
		}
	}
}