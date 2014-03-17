using System;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using Newtonsoft.Json;
using Midway.Helpers;
using Midway.Models.DTOs;
using Midway.Models.Data;

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
				return ControllerHelper.GenericErrorResponse(ex);
            }
        }

        // GET api/player/5....................................................
        public HttpResponseMessage GetPlayer(int id)
        {
            try
            {
                var player = _repo.GetPlayer(id, true);
                
                if (player == null)
                {
	                return NotFoundResponse(id);
                }
                return PlayerResponse(player);
            }
            catch (Exception ex)
            {
				return ControllerHelper.GenericErrorResponse(ex);
            }
        }

        // GET api/player?emailAddress=value
        public HttpResponseMessage GetPlayer(string emailAddress)
        {
            try
            {
                var player = _repo.GetPlayer(emailAddress, true);
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
                return ControllerHelper.GenericErrorResponse(ex);
            }
        }

        // POST api/player (INSERT)............................................
        public HttpResponseMessage PostPlayer(DtoPlayer player)
        {
            try
            {
                var insertStatus = _repo.GetInsertStatus(player);
                
                if (insertStatus == InsertStatus.DuplicateEmail)
                    return new HttpResponseMessage(HttpStatusCode.Conflict)
                        {
                            Content = new StringContent("Email address is already in use."),
                            ReasonPhrase = "Duplicate Email"
                        };

                if (insertStatus == InsertStatus.DuplicateNickname)
                    return new HttpResponseMessage(HttpStatusCode.Conflict)
                        {
                            Content = new StringContent("Nickname is taken by another player."),
                            ReasonPhrase = "Duplicate Nickname"
                        };

                var addedPlayer = _repo.AddPlayer(player);
                return new HttpResponseMessage(HttpStatusCode.Created)
                    {
                        Content = new StringContent(JsonConvert.SerializeObject(addedPlayer))
                    };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex);
            }
        }

        // PUT api/player (UPDATE).............................................
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

                return ControllerHelper.GenericErrorResponse(ex);
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