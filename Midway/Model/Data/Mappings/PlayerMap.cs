using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity.ModelConfiguration;

namespace Midway.Model.Data.Mappings
{
    public class PlayerMap : EntityTypeConfiguration<Player>
    {
        public PlayerMap()
        {
            ToTable("Player");
            HasKey(p => p.PlayerId);
                
            Property(p => p.PlayerId).HasDatabaseGeneratedOption(DatabaseGeneratedOption.Identity);
            Property(p => p.Email).IsRequired().HasMaxLength(100);
            Property(p => p.Nickname).IsRequired().HasMaxLength(100);
            Property(p => p.Password).IsRequired().HasMaxLength(30);
            Property(p => p.Admin).IsRequired().HasMaxLength(1);
            Property(p => p.Lockout).IsRequired();

	        HasMany(p => p.PlayerGames).WithRequired(g => g.Player).HasForeignKey(g => g.PlayerId);
        }
    }
}