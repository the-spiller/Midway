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

		public DbSet<Game> Games { get; set; }
		public DbSet<Phase> Phases { get; set; }
        public DbSet<Player> Players { get; set; }
		public DbSet<PlayerGame> PlayerGames { get; set; }
		public DbSet<Side> Sides { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
	        modelBuilder.Configurations.Add(new GameMap());
	        modelBuilder.Configurations.Add(new PhaseMap());
            modelBuilder.Configurations.Add(new PlayerMap());
			modelBuilder.Configurations.Add(new PlayerGameMap());
	        modelBuilder.Configurations.Add(new SideMap());
        }

        public void Save()
        {
            SaveChanges();
        }
    }
}