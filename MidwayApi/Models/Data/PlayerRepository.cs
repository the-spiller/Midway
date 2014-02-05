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

        public DtoPlayer UpdatePlayer(DtoPlayer player)
        {
            var dbPlayer = _context.Players.FirstOrDefault(p => p.PlayerId == player.PlayerId);
			if (dbPlayer == null)
			{
				throw new Exception("Player not found");
			}

            if (player.Password == null)  //Send new password to player's email addr.
            {
                var newPass = Membership.GeneratePassword(new Random().Next(8, 11), 1);
                new Mailer().SendNewPwdMessage(player.Email, newPass);
                player.Password = newPass;
            }
            
            dbPlayer.Email = player.Email;
            dbPlayer.Password = player.Password;
            dbPlayer.Nickname = player.Nickname;
            dbPlayer.Lockout = player.Lockout;

			// The only game data updated here is retire/abandonment or the addition of new games.
            // Anything else is handled in the game controller.
			foreach (var dtoGame in player.Games)
			{
				var dbGame = _context.Games
                    .Include(g => g.PlayerGames)
                    .FirstOrDefault(g => g.GameId == dtoGame.GameId);

				if (dbGame != null && !string.IsNullOrEmpty(dtoGame.CompletedDTime)) // update fields affected by retire/abandonment
				{
				    dbGame.CompletedDTime = DateTime.Parse(dtoGame.CompletedDTime);

				    var oppPg = dbGame.PlayerGames.FirstOrDefault(p => p.PlayerId == dtoGame.OpponentId);
                    if (oppPg != null) oppPg.Points = dtoGame.OpponentPoints;

				    var pg = dbGame.PlayerGames.First(p => p.SideId == dtoGame.SideId);
                    pg.Points = dtoGame.Points;
                    dbGame.Draw = dtoGame.Draw;
				}
				else if (dbGame == null) // new game
				{
					dbGame = new Game { CreateDTime = DateTime.Now, PlayerGames = new List<PlayerGame>() };
					var dbPg = new PlayerGame
						{
							PlayerId = player.PlayerId,
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

					if (dtoGame.OpponentId > 0)
					{
						var oppPg = new PlayerGame
							{
								PlayerId = dtoGame.OpponentId,
								Points = 0,
								SurfaceCombatRound = 0,
								Turn = 1,
								PhaseId = 1,
								SideId = (dtoGame.SideId == 1) ? 2 : 1,
								MidwayInvadedTurn = 0
							};
						dbGame.PlayerGames.Add(oppPg);
					}
				}
                _context.Save();
                dtoGame.GameId = dbGame.GameId;
			}
			return player;
        }

        public DtoPlayer AddPlayer(DtoPlayer player)
        {
            var newPass = Membership.GeneratePassword(new Random().Next(8, 11), 1);
            var recips = new List<string> { player.Email };

            new Mailer().Send(new Message
                {
                    FromAddress = "admin@midwaygame.org",
                    RecipientAddresses = recips,
                    Subject = "MIDWAY Password",
                    Body = "Hello!\r\n\r\n" +
                            "Welcome! Here is your first-time password for the Midway game site. Use it " +
                            "the next time you log in:\r\n\t" + newPass +
                            "\r\n\r\nThanks, and we hope you enjoy our game.\r\n" +
                            "MIDWAY Site Admins"
                }
            );
			player.Password = newPass;
	        player.Admin = "N";
	        player.Lockout = 0;
	        var newPlayer = new Player
	            {
			        Email = player.Email,
			        Password = player.Password,
			        Nickname = player.Nickname,
			        Admin = player.Admin,
			        Lockout = player.Lockout
		        };
            _context.Players.Add(newPlayer);
            _context.Save();
			player.PlayerId = newPlayer.PlayerId;
            return player;
        }

		internal InsertStatus GetInsertStatus(DtoPlayer player)
		{
			if (_context.Players.Any(p => p.Email == player.Email))
				return InsertStatus.DuplicateEmail;

			if (_context.Players.Any(p => p.Nickname == player.Nickname))
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