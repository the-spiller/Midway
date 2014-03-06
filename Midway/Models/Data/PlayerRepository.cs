using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Security;
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

	    public DtoPlayer GetPlayer(string email, bool includeGames = false)
	    {
		    var dtoPlayer = _context.Players.Select(p => new DtoPlayer
			    {
					PlayerId = p.PlayerId,
					Email = p.Email,
					Password = p.Password,
					Nickname  = p.Nickname,
					Admin = p.Admin,
					Lockout = p.Lockout
				}).FirstOrDefault(p => p.Email.ToLower() == email.ToLower());

			if (dtoPlayer == null) return null;

			if (includeGames)
			{
				dtoPlayer.Games = GetPlayerGames(dtoPlayer.PlayerId);
			}
			return dtoPlayer;
        }

        public DtoPlayer GetPlayer(int id, bool includeGames = false)
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

			if (dtoPlayer == null) return null;

	        if (includeGames)
	        {
		        dtoPlayer.Games = GetPlayerGames(dtoPlayer.PlayerId);
	        }
			return dtoPlayer;
        }

        public DtoPlayer UpdatePlayer(DtoPlayer dtoPlayer)
        {
	        var sendPwd = false;
			var buildNew = false;
			var dbPlayer = _context.Players.FirstOrDefault(p => p.PlayerId == dtoPlayer.PlayerId);

			if (dbPlayer == null)
			{
				throw new Exception("Player not found");
			}

            if (dtoPlayer.Password == null)  //Send new password to dtoPlayer's email addr.
            {
                var newPass = Membership.GeneratePassword(new Random().Next(8, 11), 1);
                dtoPlayer.Password = newPass;
				sendPwd = true;
            }
            
            dbPlayer.Email = dtoPlayer.Email;
            dbPlayer.Password = dtoPlayer.Password;
            dbPlayer.Nickname = dtoPlayer.Nickname;
            dbPlayer.Lockout = dtoPlayer.Lockout;
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
						    var matches = _context.Games
						        .Include(g => g.PlayerGames)
						        .Where(g => g.CompletedDTime == null &&
						                    g.PlayerGames.Count == 1 &&
						                    g.PlayerGames.Any(p => p.SideId != dtoPlayerGame.SideId &&
                                                p.PlayerId != dtoPlayer.PlayerId))
						        .OrderBy(g => g.CreateDTime)
						        .ToList();

						    if (matches.Any())
						    {
							    // hook 'em up w/ the oldest (first) one
							    foreach (var game in matches)
							    {
								    var dbPg = new PlayerGame
									    {
										    PlayerId = dtoPlayer.PlayerId,
										    GameId = game.GameId,
										    LastPlayed = null,
										    Points = 0,
										    SelectedLocation = "",
										    SurfaceCombatRound = 0,
										    PhaseIndeterminate = "N",
                                            AircraftReadyState = 0,
										    Turn = 1,
										    PhaseId = 1,
										    SideId = dtoPlayerGame.SideId,
										    MidwayInvadedTurn = 0
									    };
								    game.PlayerGames.Add(dbPg);
								    break;
							    }
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
                                    AircraftReadyState = 0,
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
                                        AircraftReadyState = 0,
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
			
			if (sendPwd)
				new Mailer().SendNewPwdMessage(dtoPlayer.Email, dtoPlayer.Password);

			return GetPlayer(dtoPlayer.PlayerId, true);
        }

        public DtoPlayer AddPlayer(DtoPlayer dtoPlayer)
        {
	        var newPass = Membership.GeneratePassword(new Random().Next(8, 11), 1);

			dtoPlayer.Password = newPass;
	        dtoPlayer.Admin = "N";
	        dtoPlayer.Lockout = 0;
	        var newDbPlayer = new Player
	            {
			        Email = dtoPlayer.Email,
			        Password = dtoPlayer.Password,
			        Nickname = dtoPlayer.Nickname,
			        Admin = dtoPlayer.Admin,
			        Lockout = dtoPlayer.Lockout,
					PlayerGames = new List<PlayerGame>()
		        };
            _context.Players.Add(newDbPlayer);
            _context.Save();
			dtoPlayer.PlayerId = newDbPlayer.PlayerId;

			new Mailer().SendNewRegMessage(dtoPlayer.Email, newPass);
            return dtoPlayer;
        }

		internal InsertStatus GetInsertStatus(DtoPlayer player)
		{
			if (_context.Players.Any(p => p.Email == player.Email))
				return InsertStatus.DuplicateEmail;

			if (_context.Players.Any(p => p.Nickname.ToLower() == player.Nickname.ToLower()))
				return InsertStatus.DuplicateNickname;

			return InsertStatus.Ok;
		}

		private IEnumerable<DtoPlayerGame> GetPlayerGames(int playerId)
		{
			var dbGames = _context.PlayerGames
				.Include(p => p.Side)
				.Include(p => p.Game)
				.Include(p => p.Airbases)
				.Where(p => p.PlayerId == playerId)
				.ToList();

			var dtoPlayerGames = new List<DtoPlayerGame>();

			foreach (var dbGame in dbGames)
			{
				var range = (dbGame.Side.ShortName == "USN" && dbGame.Airbases.Count > 0) ? 0 : 12;

				var dtoPlayerGame = new DtoPlayerGame
				    {
						GameId = dbGame.GameId,
						SideId = dbGame.Side.SideId,
                        PhaseId = dbGame.PhaseId,
                        Turn = dbGame.Turn,
                        AircraftReadyState = dbGame.AircraftReadyState,
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
    }
}