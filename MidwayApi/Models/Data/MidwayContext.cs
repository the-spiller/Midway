using System.Data.Entity;
using MidwayApi.Models.Data.Mappings;

namespace MidwayApi.Models.Data
{
    public class MidwayContext : DbContext, IUnitOfWork
    {
        public MidwayContext()
            : base("name=DefaultConnection")
        {
        }

        public DbSet<Action> Actions { get; set; }
        public DbSet<Airbase> Airbases { get; set; }
        public DbSet<AirOp> AirOps { get; set; }
        public DbSet<AirOpAircraft> AirOpAircraftSets { get; set; }
		public DbSet<Game> Games { get; set; }
		public DbSet<Phase> Phases { get; set; }
        public DbSet<PhaseAction> PhaseActions { get; set; }
        public DbSet<Player> Players { get; set; }
		public DbSet<PlayerGame> PlayerGames { get; set; }
        public DbSet<PlayerGameAirbase> PlayerGameAirbases { get; set; }
        public DbSet<PlayerGameSearchMarker> PlayerGameSearchMarkers { get; set; }
        public DbSet<PlayerGameSearch> PlayerGameSearches { get; set; }
        public DbSet<PlayerGameShip> PlayerGameShips { get; set; }
        public DbSet<Ship> Ships { get; set; }
        public DbSet<Side> Sides { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Configurations.Add(new ActionMap());
            modelBuilder.Configurations.Add(new AirbaseMap());
            modelBuilder.Configurations.Add(new AirOpAircraftMap());
            modelBuilder.Configurations.Add(new AirOpMap());
	        modelBuilder.Configurations.Add(new GameMap());
            modelBuilder.Configurations.Add(new PhaseActionMap());
	        modelBuilder.Configurations.Add(new PhaseMap());
            modelBuilder.Configurations.Add(new PlayerGameAirbaseMap());
            modelBuilder.Configurations.Add(new PlayerGameMap());
            modelBuilder.Configurations.Add(new PlayerGameSearchMarkerMap());
            modelBuilder.Configurations.Add(new PlayerGameSearchMap());
            modelBuilder.Configurations.Add(new PlayerGameShipMap());
            modelBuilder.Configurations.Add(new PlayerMap());
            modelBuilder.Configurations.Add(new ShipMap());
	        modelBuilder.Configurations.Add(new SideMap());
        }

        public void Save()
        {
            SaveChanges();
        }
    }
}