using System.Data.Entity;
using System.Data.Entity.ModelConfiguration;


namespace Midway.Model.Data.Mappings
{
	public class ActionMap : EntityTypeConfiguration<Action>
	{
		public ActionMap()
		{
			this.ToTable("Action");

			this.HasKey(a => a.ActionKey);
			this.Property(a => a.ActionKey).HasMaxLength(16).IsRequired();

			this.Property(a => a.Description).HasMaxLength(40);

			this.HasMany(a => a.PhaseActions).WithRequired(p => p.Action).HasForeignKey(p => p.ActionKey);
		}
	}
}