using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web;

namespace MidwayApi.Models.Data
{
	public class GameRepository
	{
		private readonly MidwayContext _context;

        // Constructor
        public GameRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

		//...........................................................................
		public IEnumerable<Game> GetGames()
		{
			return _context.Games.ToList();
		}

		//...........................................................................
		public IEnumerable<Game> GetGamesForPlayer(int playerId)
		{
			return _context.Games.Include(g => g.PlayerGames)
				.Where(g => g.PlayerGames.Any(p => p.PlayerId == playerId))
				.ToList();
		}

		//...........................................................................
		public Game GetGame(int gameId)
		{
			return _context.Games.Include(g => g.PlayerGames).FirstOrDefault(g => g.GameId == gameId);
		}

		//...........................................................................
		public Game AddGame(Game game)
		{
			game.CreateDTime = DateTime.Now;
			_context.Games.Add(game);
			_context.Save();
			return game;
		}

		//...........................................................................
		public void UpdateGame(Game game)
		{
			var dbGame = _context.Games.Include(g => g.PlayerGames).FirstOrDefault(g => g.GameId == game.GameId);
			if (dbGame == null)
			{
				throw new Exception("Game not found");
			}

			foreach (PlayerGame pg in game.PlayerGames)
			{
				var dbPg = dbGame.PlayerGames.FirstOrDefault(p => p.PlayerId == pg.PlayerId);
				if (dbPg == null)
				{
					dbGame.PlayerGames.Add(pg);
				}
				else
				{
					dbPg = pg;
					//dbPg.Phase.PhaseId = pg.Phase.PhaseId;
					//dbPg.LastPlayed = pg.LastPlayed;
					//dbPg.Points = pg.Points;
					//dbPg.SelectedLocation = pg.SelectedLocation;
					//dbPg.SurfaceCombatRound = pg.SurfaceCombatRound;
					//dbPg.PhaseIndeterminate = pg.PhaseIndeterminate;
					//dbPg.Turn = pg.Turn;
					//dbPg.MidwayInvadedTurn = pg.MidwayInvadedTurn;
				}
			}
			dbGame.CompletedDTime = game.CompletedDTime;

			_context.Save();
		}

		
	}
}