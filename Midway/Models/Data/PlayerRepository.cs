﻿using System;
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

        // No authorization req'd: called from login page.
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

	        return ReturnDtoPlayer(dtoPlayer);
	    }

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

        public void SendPassword(int playerId)
        {
            Player dbPlayer = GetDbPlayer(playerId);
            var newPass = CreatePassword();

            dbPlayer.Password = newPass;
            dbPlayer.Lockout = 0; // remove any lockout condition
            _context.Save();

            new Mailer().SendNewPwdMessage(dbPlayer.Email, dbPlayer.Nickname, dbPlayer.Password);
        }

        public void SetPlayerLockout(int playerId, long lockout)
        {
            Player dbPlayer = GetDbPlayer(playerId);
            dbPlayer.Lockout = lockout;
            _context.Save();
        }

        public DtoPlayer UpdatePlayer(DtoPlayer dtoPlayer)
        {
			var buildNew = false;

            Player dbPlayer = GetDbPlayer(dtoPlayer.PlayerId);           
            dbPlayer.Email = dtoPlayer.Email;
            dbPlayer.Password = dtoPlayer.Password;
            dbPlayer.Nickname = dtoPlayer.Nickname;
			dbPlayer.Admin = dtoPlayer.Admin;

			// The only game data updated here is retirement/abandonment or the addition of new games.
            // Anything else is handled in the phase controller.
	        if (dtoPlayer.Games != null)
	        {
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
						// new game -- see if we can match it up to an existing one
					    if (string.IsNullOrEmpty(dtoPlayerGame.OpponentNickname))
					    {
						    // anyone out there looking to be the opposition?
					        var match = _context.PlayerGames
					                            .Include(pg => pg.Game)
					                            .OrderBy(pg => pg.Game.CreateDTime)
					                            .FirstOrDefault(pg => pg.Game.CompletedDTime == null
					                                                && pg.SideId != dtoPlayerGame.SideId
					                                                && pg.PlayerId != dtoPlayer.PlayerId
					                                                && pg.Game.PlayerGames.Count == 1);

                            if (match != null)
						    {
							    var dbPg = new PlayerGame
								    {
									    PlayerId = dtoPlayer.PlayerId,
									    GameId = match.GameId,
									    LastPlayed = null,
									    Points = 0,
									    SelectedLocation = "",
									    SurfaceCombatRound = 0,
									    PhaseIndeterminate = "N",
									    Turn = 1,
									    PhaseId = 1,
									    SideId = dtoPlayerGame.SideId,
									    MidwayInvadedTurn = 0
								    };
							    match.Game.PlayerGames.Add(dbPg);
						    }
						    else
						    {
							    buildNew = true;
						    }
					    }
					    else
					    {
							buildNew = true;
					    }

					    if (buildNew)
					    {
						    dbGame = new Game
							    {
								    CreateDTime = DateTime.Now.ToUniversalTime(),
								    Draw = "Y",
								    PlayerGames = new List<PlayerGame>()
							    };
						    _context.Games.Add(dbGame);

						    var dbPg = new PlayerGame
							    {
								    PlayerId = dtoPlayer.PlayerId,
								    LastPlayed = null,
								    Points = 0,
								    SelectedLocation = "",
								    SurfaceCombatRound = 0,
								    PhaseIndeterminate = "N",
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
									    PhaseIndeterminate = "N",
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

        // No authorization req'd: called to register new player.
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

        internal InsertStatus GetInsertStatus(DtoPlayer player)
		{
			if (_context.Players.Any(p => p.Email == player.Email))
				return InsertStatus.DuplicateEmail;

			if (_context.Players.Any(p => p.Nickname.ToLower() == player.Nickname.ToLower()))
				return InsertStatus.DuplicateNickname;

			return InsertStatus.Ok;
		}

        private Player GetDbPlayer(int playerId)
        {
            var dbPlayer = _context.Players.FirstOrDefault(p => p.PlayerId == playerId);
            if (dbPlayer == null) throw new Exception("Player not found");
            return dbPlayer;
        }

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
			var dbGames = qry.ToList();
			var dtoPlayerGames = new List<DtoPlayerGame>();

			foreach (var dbGame in dbGames)
			{
				var range = (dbGame.Side.ShortName == "USN" && dbGame.Airbases.Count > 0) ? 0 : 12;  //zero = range is whole map

				var dtoPlayerGame = new DtoPlayerGame
				    {
						GameId = dbGame.GameId,
						SideId = dbGame.Side.SideId,
                        PhaseId = dbGame.PhaseId,
                        PhaseName = dbGame.Phase.Name,
                        Turn = dbGame.Turn,
                        CompletedDTime = dbGame.Game.CompletedDTime == null ? "" :
                            dbGame.Game.CompletedDTime.Value.ToString("o"),
						TinyFlagUrl = dbGame.Side.TinyFlagUrl,
                        LastPlayed = dbGame.LastPlayed == null ? "" : dbGame.LastPlayed.Value.ToString("o"),
                        DTimeNow = DateTime.Now.ToUniversalTime().ToString("o"),
						Points = dbGame.Points,
						SelectedLocation = dbGame.SelectedLocation,
						SideShortName = dbGame.Side.ShortName,
                        Draw = dbGame.Game.Draw,
                        Waiting = "N",
                        OppWaiting = "N",
						SearchRange = range
					};

				// Opponent
				var dbOpp = _context.PlayerGames
					.Include(p => p.Player)
					.FirstOrDefault(p => p.GameId == dtoPlayerGame.GameId && p.PlayerId != playerId);

				if (dbOpp != null)
				{
				    dtoPlayerGame.OpponentId = dbOpp.PlayerId;
				    dtoPlayerGame.OpponentNickname = dbOpp.Player.Nickname;
				    dtoPlayerGame.OpponentPoints = dbOpp.Points;

                    if (dbOpp.LastPlayed != null)
                    {
                        if (dbGame.LastPlayed == null || dbOpp.LastPlayed > dbGame.LastPlayed) 
                            dtoPlayerGame.LastPlayed = dbOpp.LastPlayed.Value.ToString("o");
				    }
				    if (dtoPlayerGame.Turn > 1 || dtoPlayerGame.PhaseId > 1)
				    {
                        if (dbGame.Turn > dbOpp.Turn || (dbGame.Turn == dbOpp.Turn && dbGame.PhaseId > dbOpp.PhaseId))
                            dtoPlayerGame.Waiting = "Y";
                        else if (dbOpp.Turn > dbGame.Turn || (dbOpp.Turn == dbGame.Turn && dbOpp.PhaseId > dbGame.PhaseId))
                            dtoPlayerGame.OppWaiting = "Y";
				    }
				}
				else
				{
				    dtoPlayerGame.OpponentId = 0;
				    dtoPlayerGame.OpponentPoints = 0;
				    dtoPlayerGame.Waiting = dtoPlayerGame.PhaseId > 1 ? "Y" : "N";
				    dtoPlayerGame.OppWaiting = "N";
				}
				dtoPlayerGames.Add(dtoPlayerGame);
			}
			return dtoPlayerGames;
		}

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

        private string GetPlayerKey(int id)
        {
            var cache = MemoryCache.Default;
            var entry = (DtoPlayer)cache.Get(id.ToString(CultureInfo.InvariantCulture));
            if (entry == null) return string.Empty;
            return entry.AuthKey;
        }
    }
}