using System;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using Newtonsoft.Json;
using Midway.Helpers;
using Midway.Model.DTOs;
using Midway.Model.Data;

namespace Midway.Controllers
{
    public class PlayerController : ApiController
    {
        private readonly PlayerRepository _repo;

		public PlayerController(IUnitOfWork uow)
		{
			_repo = new PlayerRepository(uow as MidwayContext);
		}

        public PlayerController()
        {
            IUnitOfWork uow = new MidwayContext();
            _repo = new PlayerRepository(uow);
        }
        
        // GET api/player......................................................
        // List all players
        [Authorize]
        public HttpResponseMessage GetPlayers()
        {
            try
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(JsonConvert.SerializeObject(_repo.GetPlayers()))
                    };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/player");
            }
        }

        // GET api/player/id...................................................
        // Get one player by id
        [Authorize]
        public HttpResponseMessage GetPlayer(int id)
        {
            try
            {
                var player = _repo.GetPlayer(id);
                
                if (player == null)
                {
	                return NotFoundResponse(id);
                }
                return PlayerResponse(player);
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/player/id");
            }
        }

        // GET api/player?emailAddress=value...................................
        // Get one player by email address
        public HttpResponseMessage GetPlayer(string emailAddress)
        {
            try
            {
                var player = _repo.GetPlayer(emailAddress);
                if (player == null)
                {
                    return new HttpResponseMessage(HttpStatusCode.NotFound)
                        {
                            Content =
                                new StringContent("Player with email address '" + emailAddress + "' does not exist."),
                            ReasonPhrase = "Player Not Found"
                        };
                }
                return PlayerResponse(player);
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/player?emailAddress");
            }
        }

        // POST api/player (INSERT)............................................
        // Open call to add a new player
        public HttpResponseMessage PostPlayer(DtoPlayer player)
        {
            try
            {
                var insertStatus = _repo.GetInsertStatus(player);
                
                if (insertStatus == InsertStatus.DuplicateEmail)
                    return new HttpResponseMessage(HttpStatusCode.Conflict)
                        {
                            Content = new StringContent("Email address is already in use."),
                            ReasonPhrase = "Conflict"
                        };

                if (insertStatus == InsertStatus.DuplicateNickname)
                    return new HttpResponseMessage(HttpStatusCode.Conflict)
                        {
                            Content = new StringContent("Nickname is taken by another player."),
                            ReasonPhrase = "Conflict"
                        };

                var addedPlayer = _repo.AddPlayer(player);
                return new HttpResponseMessage(HttpStatusCode.Created)
                    {
                        Content = new StringContent(JsonConvert.SerializeObject(addedPlayer))
                    };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex, "POST /api/player");
            }
        }

        // PUT api/player?playerId=playerId&lockout=lockout (UPDATE)...........
        // Open call to reset password or set lockout.
        public HttpResponseMessage PutPlayer(int playerId, long lockout)
        {
            try
            {
                if (lockout > 0)
                {
                    _repo.SetPlayerLockout(playerId, lockout);
                }
                else
                {
                    _repo.SendPassword(playerId);
                }
                return new HttpResponseMessage(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                if (ex.Message == "Player not found")
                    return NotFoundResponse(playerId);

                return ControllerHelper.GenericErrorResponse(ex, "PUT /api/player?playerId&lockout");
            }
        }

        // PUT api/player (UPDATE).............................................
        // Call for player updates incl. new games
        [Authorize]
        public HttpResponseMessage PutPlayer(DtoPlayer player)
        {
            try
            {
                var retPlayer = _repo.UpdatePlayer(player);
                return new HttpResponseMessage(HttpStatusCode.OK)
	                {
		                Content = new StringContent(JsonConvert.SerializeObject(retPlayer))
	                };
            }
            catch (Exception ex)
            {
				if (ex.Message == "Player not found")
					return NotFoundResponse(player.PlayerId);

	            if (ex.Message == "Opponent not found")
		            return new HttpResponseMessage(HttpStatusCode.NotFound)
			            {
							Content = new StringContent("Unable to find a player that has the submitted nickname."),
							ReasonPhrase = "Opponent Not Found"
			            };

                return ControllerHelper.GenericErrorResponse(ex, "PUT /api/player");
            }
        }
        // DELETE api/player/id................................................
        [Authorize]
        public HttpResponseMessage DeletePlayer(int id)
        {
            try
            {
                _repo.DeletePlayer(id);
                return new HttpResponseMessage(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                if (ex.Message == "Player not found")
                    return NotFoundResponse(id);

                return ControllerHelper.GenericErrorResponse(ex, "DELETE /api/player/id");
            }
        }

        // Private methods.....................................................
		private HttpResponseMessage NotFoundResponse(int playerId)
		{
			return new HttpResponseMessage(HttpStatusCode.NotFound)
			{
				Content = new StringContent("Player with PlayerId value " + playerId + " does not exist."),
				ReasonPhrase = "Player Not Found"
			};
		}

        private HttpResponseMessage PlayerResponse(DtoPlayer player)
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(player))
                };
        }
    }
}