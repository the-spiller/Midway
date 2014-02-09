using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Security;
using MidwayApi.Models.Services;
using MidwayApi.Models.DTOs;

namespace MidwayApi.Models.Data
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
				dtoPlayer.Games = GetDtoGames(dtoPlayer.PlayerId);
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
		        dtoPlayer.Games = GetDtoGames(dtoPlayer.PlayerId);
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
            // Anything else is handled in the game controller.
	        if (dtoPlayer.Games != null)
	        {
			    foreach (var dtoGame in dtoPlayer.Games)
			    {
				    var dbGame = _context.Games
				                            .Include(g => g.PlayerGames)
				                            .FirstOrDefault(g => g.GameId == dtoGame.GameId);

				    if (dbGame != null && !string.IsNullOrEmpty(dtoGame.CompletedDTime))
					{
					    // game exists and is now marked complete: update fields affected by retire/abandonment
					    dbGame.CompletedDTime = DateTime.Parse(dtoGame.CompletedDTime);

					    var oppPg = dbGame.PlayerGames.FirstOrDefault(p => p.PlayerId == dtoGame.OpponentId);
					    if (oppPg != null) oppPg.Points = dtoGame.OpponentPoints;

					    var pg = dbGame.PlayerGames.First(p => p.SideId == dtoGame.SideId);
					    pg.Points = dtoGame.Points;
					    dbGame.Draw = dtoGame.Draw;
				    }
				    else if (dbGame == null)
				    {
						// new game -- see if we can match it up to an existing one
					    if (string.IsNullOrEmpty(dtoGame.OpponentNickname))
					    {
						    // anyone out there looking to be the opposition?
						    var matches = _context.Games
						        .Include(g => g.PlayerGames)
						        .Where(g => g.CompletedDTime == null &&
						                    g.PlayerGames.Count == 1 &&
						                    g.PlayerGames.Any(p => p.SideId != dtoGame.SideId &&
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
										    Turn = 1,
										    PhaseId = 1,
										    SideId = dtoGame.SideId,
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
								    CreateDTime = DateTime.Now,
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
								    SideId = dtoGame.SideId,
								    MidwayInvadedTurn = 0
							    };
						    dbGame.PlayerGames.Add(dbPg);

						    if (!string.IsNullOrEmpty(dtoGame.OpponentNickname))
						    {
							    var dbOpponent = _context.Players
							        .FirstOrDefault(p => p.Nickname.ToLower() == dtoGame.OpponentNickname.ToLower());

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
									    SideId = (dtoGame.SideId == 1) ? 2 : 1, //opposite
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

		private IEnumerable<DtoGame> GetDtoGames(int playerId)
		{
			var dbGames = _context.PlayerGames
				.Include(p => p.Side)
				.Include(p => p.Game)
				.Where(p => p.PlayerId == playerId)
				.ToList();

			var dtoGames = new List<DtoGame>();

			foreach (var dbGame in dbGames)
			{
				var dtoGame = new DtoGame
				    {
						GameId = dbGame.GameId,
						SideId = dbGame.Side.SideId,
                        CompletedDTime = dbGame.Game.CompletedDTime == null ? "" :
                            dbGame.Game.CompletedDTime.Value.ToUniversalTime().ToString("o"),
						TinyFlagUrl = dbGame.Side.TinyFlagUrl,
                        LastPlayed = dbGame.LastPlayed == null ? "" :
                            dbGame.LastPlayed.Value.ToUniversalTime().ToString("o"),
						Points = dbGame.Points,
                        Draw = dbGame.Game.Draw,
						SelectedLocation = dbGame.SelectedLocation,
						SideShortName = dbGame.Side.ShortName
					};

				// Opponent
				var dbOpp = _context.PlayerGames
					.Include(p => p.Player)
					.FirstOrDefault(p => p.GameId == dtoGame.GameId && p.PlayerId != playerId);

				if (dbOpp != null)
				{
				    dtoGame.OpponentId = dbOpp.PlayerId;
				    dtoGame.OpponentNickname = dbOpp.Player.Nickname;
				    dtoGame.OpponentPoints = dbOpp.Points;

				    if (dbOpp.LastPlayed != null && dbGame.LastPlayed != null)
				    {
                        if (dbOpp.LastPlayed.Value > dbGame.LastPlayed)
				            dtoGame.LastPlayed = dbOpp.LastPlayed.Value.ToUniversalTime().ToString("o");
				    }
				}
				else
				{
				    dtoGame.OpponentId = 0;
				    dtoGame.OpponentPoints = 0;
				}
				dtoGames.Add(dtoGame);
			}
			return dtoGames;
		}
    }
}