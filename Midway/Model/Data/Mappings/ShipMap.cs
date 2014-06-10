using System.Data.Entity.ModelConfiguration;

namespace Midway.Model.Data.Mappings
{
	public class ShipMap : EntityTypeConfiguration<Ship>
	{
		public ShipMap()
		{
			ToTable("Ship");

			HasKey(s => s.ShipId);
			Property(s => s.ShipId).IsRequired();

			Property(s => s.Name).HasMaxLength(60).IsRequired();
			Property(s => s.ArrivalTurn).IsRequired();
			Property(s => s.ShipType).HasMaxLength(4);
			Property(s => s.HullNumber).HasMaxLength(3);
			Property(s => s.TaskForce).HasMaxLength(60);
			Property(s => s.HitsToSink);
			Property(s => s.PointsToSink);
			Property(s => s.ScreenStrength);
			Property(s => s.SurfaceStrength);
			Property(s => s.AircraftCapacity);
			Property(s => s.TSquadrons);
			Property(s => s.FSquadrons);
			Property(s => s.DSquadrons);
			Property(s => s.SearchImgPath).HasMaxLength(256);
			Property(s => s.BattleImgPath).HasMaxLength(256);			

			HasMany(s => s.PlayerGameShips).WithRequired(p => p.Ship).HasForeignKey(p => p.ShipId);
		}
	}
}