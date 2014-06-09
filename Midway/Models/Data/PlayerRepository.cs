using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Globalization;
using System.Linq;
using System.Runtime.Caching;
using Midway.Models.Services;
using Midway.Models.DTOs;

namespace Midway.Models.Data
{
    internal enum InsertStatus
    {
        Ok,
        DuplicateEmail,
        DuplicateNickname
    };

    public class PlayerRepository
    {
        private readonly MidwayContext _context;

        // Constructor
        public PlayerRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

        //.....................................................................
        public IList<DtoPlayer> GetPlayers()
        {
	        return _context.Players.Select(p => new DtoPlayer
		        {
			        PlayerId = p.PlayerId, 
					Email = p.Email, 
					Password = p.Password, 
					Nickname = p.Nickname, 
					Admin = p.Admin,
					Lockout = p.Lockout
		        }).ToList();
        }

        //.....................................................................
	    public DtoPlayer GetPlayer(string email)
	    {
            var dtoPlayer = _context.Players.Select(p => new DtoPlayer
	                {
	                    PlayerId = p.PlayerId,
	                    Email = p.Email,
	                    Password = p.Password,
	                    Nickname = p.Nickname,
	                    Admin = p.Admin,
	                    Lockout = p.Lockout
	                }).FirstOrDefault(p => p.Email.ToLower() == email.ToLower());

	        return ReturnDtoPlayer(dtoPlayer, false);
	    }

        //.....................................................................
        public DtoPlayer GetPlayer(int id)
        {
			var dtoPlayer = _context.Players.Select(p => new DtoPlayer
					{
						PlayerId = p.PlayerId,
						Email = p.Email,
						Password = p.Password,
						Nickname = p.Nickname,
						Admin = p.Admin,
						Lockout = p.Lockout
					}).FirstOrDefault(p => p.PlayerId == id);
            
            return ReturnDtoPlayer(dtoPlayer);
        }

        //.....................................................................
        public void SendPassword(int playerId)
        {
            Player dbPlayer = GetDbPlayer(playerId);
            var newPass = CreatePassword();

            dbPlayer.Password = newPass;
            dbPlayer.Lockout = 0; // remove any lockout condition
            _context.Save();

            new Mailer().SendNewPwdMessage(dbPlayer.Email, dbPlayer.Nickname, dbPlayer.Password);
        }

        //.....................................................................
        public void SetPlayerLockout(int playerId, long lockout)
        {
            Player dbPlayer = GetDbPlayer(playerId);
            dbPlayer.Lockout = lockout;
            _context.Save();
        }

        //.....................................................................
        public DtoPlayer UpdatePlayer(DtoPlayer dtoPlayer)
        {
            Player dbPlayer = GetDbPlayer(dtoPlayer.PlayerId);           
            dbPlayer.Email = dtoPlayer.Email;
            dbPlayer.Password = dtoPlayer.Password;
            dbPlayer.Nickname = dtoPlayer.Nickname;
			dbPlayer.Admin = dtoPlayer.Admin;

	        if (dtoPlayer.Games != null)
	        {
				// Game data updated here is retirement/abandonment or the addition of new games.
				// Anything else is handled in the phase controller.
			    foreach (var dtoPlayerGame in dtoPlayer.Games)
			    {
				    var dbGame = _context.Games
				                            .Include(g => g.PlayerGames)
				                            .FirstOrDefault(g => g.GameId == dtoPlayerGame.GameId);

				    if (dbGame != null && !string.IsNullOrEmpty(dtoPlayerGame.CompletedDTime))
					{
					    // game exists and is now marked complete: update fields affected by retire/abandonment
					    dbGame.CompletedDTime = DateTime.Now.ToUniversalTime();

					    var oppPg = dbGame.PlayerGames.FirstOrDefault(p => p.PlayerId == dtoPlayerGame.OpponentId);
					    if (oppPg != null) oppPg.Points = dtoPlayerGame.OpponentPoints;

					    var pg = dbGame.PlayerGames.First(p => p.SideId == dtoPlayerGame.SideId);
					    pg.Points = dtoPlayerGame.Points;
					    dbGame.Draw = dtoPlayerGame.Draw;
				    }
				    else if (dbGame == null)
				    {
                        //New game -- try to match it up with an existing game that lacks an opponent.
				        PlayerGame dbPg;
                        var buildNew = true;
					    var pgs = _context.PlayerGames
					                        .Include(pg => pg.Game)
					                        .OrderBy(pg => pg.Game.CreateDTime)
					                        .Where(pg => pg.Game.CompletedDTime == null
					                                            && pg.SideId != dtoPlayerGame.SideId
					                                            && pg.PlayerId != dtoPlayer.PlayerId
					                                            && pg.Game.PlayerGames.Count == 1)
                                            .ToList();

				        if (pgs.Count > 0)
				        {
				            PlayerGame oppPg = string.IsNullOrEmpty(dtoPlayerGame.OpponentNickname)
								? pgs.First()
								: pgs.FirstOrDefault(p => p.Player.Nickname == dtoPlayerGame.OpponentNickname);

				            if (oppPg != null)
				            {
				                dbPg = new PlayerGame
				                    {
				                        PlayerId = dtoPlayer.PlayerId,
				                        GameId = oppPg.GameId,
				                        LastPlayed = null,
				                        Points = 0,
				                        SelectedLocation = "",
				                        SurfaceCombatRound = 0,
				                        Turn = 1,
				                        PhaseId = 1,
				                        SideId = dtoPlayerGame.SideId,
				                        MidwayInvadedTurn = 0
				                    };
				                oppPg.Game.PlayerGames.Add(dbPg);

                                buildNew = false;
				            }
				        }
				        if (buildNew) 
                        {
                            // Make a new game from scratch
						    dbGame = new Game
							    {
								    CreateDTime = DateTime.Now.ToUniversalTime(),
								    Draw = "Y",
								    PlayerGames = new List<PlayerGame>()
							    };
						    _context.Games.Add(dbGame);

						    dbPg = new PlayerGame
							    {
								    PlayerId = dtoPlayer.PlayerId,
								    LastPlayed = null,
								    Points = 0,
								    SelectedLocation = "",
								    SurfaceCombatRound = 0,
								    Turn = 1,
								    PhaseId = 1,
								    SideId = dtoPlayerGame.SideId,
								    MidwayInvadedTurn = 0
							    };
						    dbGame.PlayerGames.Add(dbPg);

						    if (!string.IsNullOrEmpty(dtoPlayerGame.OpponentNickname))
						    {
							    var dbOpponent = _context.Players
							        .FirstOrDefault(p => p.Nickname.ToLower() == dtoPlayerGame.OpponentNickname.ToLower());

							    if (dbOpponent == null)
							    {
								    throw new Exception("Opponent not found");
							    }

							    var oppDbPg = new PlayerGame
								    {
									    PlayerId = dbOpponent.PlayerId,
									    LastPlayed = null,
									    Points = 0,
									    SelectedLocation = "",
									    SurfaceCombatRound = 0,
									    Turn = 1,
									    PhaseId = 1,
									    SideId = (dtoPlayerGame.SideId == 1) ? 2 : 1, //opposite
									    MidwayInvadedTurn = 0
								    };
							    dbGame.PlayerGames.Add(oppDbPg);
						    }
					    }
				    }
			    }
		    }
			_context.Save();
			return GetPlayer(dtoPlayer.PlayerId);
        }

        //.....................................................................
        public DtoPlayer AddPlayer(DtoPlayer dtoPlayer)
        {
            var newPass = CreatePassword();

			dtoPlayer.Password = newPass;
	        dtoPlayer.Lockout = 0;
	        var newDbPlayer = new Player
	            {
			        Email = dtoPlayer.Email,
			        Password = dtoPlayer.Password,
			        Nickname = dtoPlayer.Nickname,
			        Admin = string.IsNullOrEmpty(dtoPlayer.Admin) ? "N" : dtoPlayer.Admin,
			        Lockout = dtoPlayer.Lockout,
					PlayerGames = new List<PlayerGame>()
		        };
            _context.Players.Add(newDbPlayer);
			new Mailer().SendNewRegMessage(dtoPlayer.Email, dtoPlayer.Nickname, newPass);
            _context.Save();
			dtoPlayer.PlayerId = newDbPlayer.PlayerId;

            return dtoPlayer;
        }

        //.....................................................................
        public void DeletePlayer(int playerId)
        {
            var player = _context.Players
                                 .Include(p => p.PlayerGames)
                                 .SingleOrDefault(p => p.PlayerId == playerId);

            if (player == null) throw new Exception("Player not found");

            player.Email = "";
            player.Password = "";
            player.Nickname = "Player " + player.PlayerId + " (registration cancelled)";

            foreach (var playerGame in player.PlayerGames)
            {
                if (playerGame.Game.CompletedDTime == null)
                {
                    var oppPg = _context.PlayerGames
                                        .Single(
                                            pg => pg.GameId == playerGame.GameId && pg.PlayerId != playerGame.PlayerId);
                    if (oppPg != null)
                    {
                        // If the game has been played in the last two weeks, make this opponent the winner.
                        if (playerGame.LastPlayed != null && oppPg.LastPlayed != null)
                        {
                            var lastPlayed = playerGame.LastPlayed;
                            if (oppPg.LastPlayed > lastPlayed) lastPlayed = oppPg.LastPlayed;

                            TimeSpan diff = DateTime.Now.ToUniversalTime() - lastPlayed.Value;
                            if (diff.Days < 15)
                            {
                                oppPg.Points = playerGame.Points + 1;
                                playerGame.Game.Draw = "N";
                            }
                        }
                    }
                    playerGame.Game.CompletedDTime = DateTime.Now.ToUniversalTime();
                }
            }
            _context.Save();
        }

        //.....................................................................
        internal InsertStatus GetInsertStatus(DtoPlayer player)
		{
			if (_context.Players.Any(p => p.Email == player.Email))
				return InsertStatus.DuplicateEmail;

			if (_context.Players.Any(p => p.Nickname.ToLower() == player.Nickname.ToLower()))
				return InsertStatus.DuplicateNickname;

			return InsertStatus.Ok;
		}

        //.....................................................................
        internal DtoPlayer GetPlayerWithCurrentGame(int playerId, int gameId)
        {
            var dtoPlayer = _context.Players.Select(p => new DtoPlayer
            {
                PlayerId = p.PlayerId,
                Email = p.Email,
                Password = p.Password,
                Nickname = p.Nickname,
                Admin = p.Admin,
                Lockout = p.Lockout
            }).FirstOrDefault(p => p.PlayerId == playerId);

            if (dtoPlayer == null) return null;

            dtoPlayer.AuthKey = GetPlayerKey(dtoPlayer.PlayerId);
            dtoPlayer.Games = GetPlayerGames(playerId, gameId);	//only one, actually
            return dtoPlayer;
        }

        //.....................................................................
        private Player GetDbPlayer(int playerId)
        {
            var dbPlayer = _context.Players.FirstOrDefault(p => p.PlayerId == playerId);
            if (dbPlayer == null) throw new Exception("Player not found");
            return dbPlayer;
        }

        //.....................................................................
        private DtoPlayer ReturnDtoPlayer(DtoPlayer dtoPlayer, bool loadGames = true)
        {
            if (dtoPlayer == null) return null;

            dtoPlayer.AuthKey = RegisterPlayer(dtoPlayer.PlayerId, dtoPlayer.Admin);

            if (loadGames)
            {
                dtoPlayer.Games = GetPlayerGames(dtoPlayer.PlayerId);
            }
            return dtoPlayer;
        }

        //.....................................................................
		private IEnumerable<DtoPlayerGame> GetPlayerGames(int playerId, int gameId = 0)
		{
			IQueryable<PlayerGame> qry;
			if (gameId == 0)
			{
				qry = _context.PlayerGames
					.Include(p => p.Phase)
					.Include(p => p.Side)
					.Include(p => p.Game)
					.Include(p => p.Airbases)
					.Where(p => p.PlayerId == playerId);
			}
			else
			{
				qry = _context.PlayerGames
					.Include(p => p.Phase)
					.Include(p => p.Side)
					.Include(p => p.Game)
					.Include(p => p.Airbases)
					.Where(p => p.PlayerId == playerId && p.GameId == gameId);
			}
			var dbPgs = qry.ToList();
			var dtoPgs = new List<DtoPlayerGame>();

			foreach (var dbPg in dbPgs)
			{
                var dbDirty = false;
                var searchRange = (dbPg.Side.ShortName == "IJN" || dbPg.Airbases.Count == 0) ? 12 : 0;  //zero = range is whole map

                var dtoPg = new DtoPlayerGame
                    {
                        GameId = dbPg.GameId,
                        SideId = dbPg.Side.SideId,
                        PhaseId = dbPg.PhaseId,
                        PhaseName = dbPg.Phase.Name,
                        Turn = dbPg.Turn,
                        CompletedDTime = dbPg.Game.CompletedDTime == null ? "" :
                            dbPg.Game.CompletedDTime.Value.ToString("o"),
                        TinyFlagUrl = dbPg.Side.TinyFlagUrl,
                        LastPlayed = dbPg.LastPlayed == null ? "" : dbPg.LastPlayed.Value.ToString("o"),
                        DTimeNow = DateTime.Now.ToUniversalTime().ToString("o"),
                        Points = dbPg.Points,
                        SelectedLocation = dbPg.SelectedLocation,
                        SideShortName = dbPg.Side.ShortName,
                        Draw = dbPg.Game.Draw,
                        Waiting = "N",
                        OppWaiting = "N",
                        SearchRange = searchRange
                    };

                // Opponent
                var dbOpp = _context.PlayerGames
                    .Include(p => p.Player)
                    .SingleOrDefault(p => p.GameId == dbPg.GameId && p.PlayerId != playerId);

			    if (dbOpp != null)
			    {
			        dtoPg.OpponentId = dbOpp.PlayerId;
			        dtoPg.OpponentNickname = dbOpp.Player.Nickname;
			        dtoPg.OpponentPoints = dbOpp.Points;

			        if (dbOpp.LastPlayed != null)
			        {
			            if (dbPg.LastPlayed == null || dbOpp.LastPlayed > dbPg.LastPlayed)
			                dtoPg.LastPlayed = dbOpp.LastPlayed.Value.ToString("o");
			        }

			        if (dbPg.Game.CompletedDTime == null)
			        {
						if (dbPg.PhaseId == 2 && IsNight(dbPg.Turn))
						{
							AdvanceToSurfaceCombat(dbPg, dtoPg);
							dbDirty = true;
						}
                        else if (dbPg.PhaseId == 4)
                        {
                            // If opponent posted AirOps, we can move off of phase 4
                            if (dbOpp.Turn > dbPg.Turn || (dbOpp.Turn == dbPg.Turn && dbOpp.PhaseId > 3))
                            {
                                if (UnderAirAttack(dbPg))
                                {
                                    dbPg.PhaseId = dtoPg.PhaseId = 5; // Air Defense Setup
                                    dtoPg.PhaseName = GetPhaseName(5);
                                    dtoPg.Waiting = "N";
                                    dbDirty = true;
                                }
                                else if (MakingAirAttacks(dbPg))
                                {
	                                dbPg.PhaseId = dtoPg.PhaseId = 6; // Air Attack Setup
	                                dtoPg.PhaseName = GetPhaseName(6);
	                                dtoPg.Waiting = dbOpp.PhaseId > 5 ? "N" : "Y";
	                                dbDirty = true;
                                }
                                else
                                {
	                                AdvanceToSurfaceCombat(dbPg, dtoPg);
									dbDirty = true;
                                }
                            }
                            else
                            {
                                // Stuck on phase 4
                                dtoPg.Waiting = "Y";
                            }
                        }
                        else if (dbPg.PhaseId > 1 && 
                            (dbPg.Turn > dbOpp.Turn || (dbPg.Turn == dbOpp.Turn && dbPg.PhaseId > dbOpp.PhaseId)))
                        {
                            dtoPg.Waiting = "Y";
                        }

			            if (dbOpp.Turn > dbPg.Turn || (dbOpp.Turn == dbPg.Turn && dbOpp.PhaseId > dbPg.PhaseId))
			                dtoPg.OppWaiting = "Y";
			        }
			    }
                else
                {
                    // no opponent yet
                    dtoPg.OpponentId = 0;
                    dtoPg.OpponentPoints = 0;
                    dtoPg.Waiting = dtoPg.PhaseId > 1 ? "Y" : "N";
                    dtoPg.OppWaiting = "N";
                }
                dtoPgs.Add(dtoPg);
				if (dbDirty) _context.Save();
			}
            return dtoPgs;
		}
		//.....................................................................
		private bool IsNight(int turn)
		{
			switch (turn)
			{
				case 8:
				case 9:
				case 17:
				case 18:
				case 26:
				case 27:
					return true;
				default:
					return false;
			}
		}
		//.....................................................................
		private void AdvanceToSurfaceCombat(PlayerGame pg, DtoPlayerGame dtoPg)
		{
			if (SurfaceCombat(pg))
			{
				pg.PhaseId = dtoPg.PhaseId = 9; // Surface Combat Setup
				dtoPg.PhaseName = GetPhaseName(9);
				dtoPg.Waiting = "N";
			}
			else
			{
				pg.Turn++;
				dtoPg.Turn = pg.Turn;
				pg.PhaseId = dtoPg.PhaseId = 1; // Search Board Move
				dtoPg.PhaseName = GetPhaseName(1);
				dtoPg.Waiting = "N";
			}
		}
        //.....................................................................
        private string CreatePassword()
        {
            const string validChars = "abcdefghijkmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ1234567890!$%*23456789";
            string newPass = "";
            var rnd = new Random(Guid.NewGuid().GetHashCode());
            var length = rnd.Next(8, 12);
            while (0 < length--)
                newPass += validChars[rnd.Next(validChars.Length)];
            return newPass;
        }
        
        //.....................................................................
        private string RegisterPlayer(int id, string admin)
        {
            var token = Guid.NewGuid().ToString();
            var authEntry = new AuthCacheEntry
            {
                Id = id,
                Token = token,
                Role = (admin == "Y") ? "Admin" : "Player"
            };
            var expires = new DateTimeOffset(DateTime.Now.AddHours(authEntry.ExpirationHours));

            var cache = MemoryCache.Default;
            cache.Add(token, authEntry, expires);

            return token;
        }

        //.....................................................................
        private string GetPlayerKey(int id)
        {
            var cache = MemoryCache.Default;
            var entry = (DtoPlayer)cache.Get(id.ToString(CultureInfo.InvariantCulture));
            if (entry == null) return string.Empty;
            return entry.AuthKey;
        }

        //.....................................................................
        private bool UnderAirAttack(PlayerGame playerGame)
        {
            return (_context.AirOps.Count(a => a.GameId == playerGame.GameId && a.PlayerId != playerGame.PlayerId
                                            && a.Turn == playerGame.Turn && a.Mission == "Attack") > 0);
        }

        //.....................................................................
        private bool MakingAirAttacks(PlayerGame playerGame)
        {
            return (_context.AirOps.Count(a => a.GameId == playerGame.GameId && a.PlayerId == playerGame.PlayerId
                                               && a.Turn == playerGame.Turn && a.Mission == "Attack") > 0);
        }

        //.....................................................................
        private bool SurfaceCombat(PlayerGame playerGame)
        {
            // If the players have ships in a single zone and one of them knows it via a search, return true;
            return false;
        }

        //.....................................................................
        private string GetPhaseName(int phaseId)
        {
            return _context.Phases.Single(p => p.PhaseId == phaseId).Name;
        }
    }
}