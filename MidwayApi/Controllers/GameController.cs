using System;
using System.Collections.Generic;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using MidwayApi.Models;
using MidwayApi.Models.Data;
using Newtonsoft.Json;

namespace MidwayApi.Controllers
{
    public class GameController : ApiController
    {
        private readonly GameRepository _repo;

        public GameController()
        {
            IUnitOfWork uow = new MidwayContext();
            _repo = new GameRepository(uow);
        }

		// GET api/game
		public HttpResponseMessage GetGames()
		{
			return new HttpResponseMessage(HttpStatusCode.OK)
				{
					Content = new StringContent(JsonConvert.SerializeObject(_repo.GetGames()))
				};
		}

		// GET api/game/id
		public HttpResponseMessage GetGame(int id)
		{
			try
			{
				var game = _repo.GetGame(id);
				if (game == null)
				{
					return NotFoundResponse(id);
				}
				return GameResponse(game);
			}
			catch (Exception ex)
			{
				return ControllerHelper.GenericErrorResponse(ex);
			}
		}

		// GET api/game?playerId=value
		public HttpResponseMessage GetGamesForPlayer(int playerId)
		{
			try
			{
				var games = _repo.GetGamesForPlayer(playerId);
				return new HttpResponseMessage(HttpStatusCode.OK)
					{
						Content = new StringContent(JsonConvert.SerializeObject(games))
					};

			}
			catch (Exception ex)
			{
				return ControllerHelper.GenericErrorResponse(ex);
			}
		}

		// POST api/game (INSERT)
		public HttpResponseMessage PostGame(Game game)
		{
			try
			{
				var addedGame = _repo.AddGame(game);
                return new HttpResponseMessage(HttpStatusCode.Created)
                    {
                        Content = new StringContent(JsonConvert.SerializeObject(addedGame))
                    };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex);
            
			}
		}


		// PUT api/game (UPDATE)
		public HttpResponseMessage PutGame(Game game)
		{
			try
			{
				_repo.UpdateGame(game);
				return new HttpResponseMessage(HttpStatusCode.OK);
			}
			catch (Exception ex)
			{
				if (ex.Message == "Game not found")
				{
					return NotFoundResponse(game.GameId);
				}
				return ControllerHelper.GenericErrorResponse(ex);
			}
		}

		//// DELETE api/game/id
		//public void Delete(int id)
		//{
		//}

		private HttpResponseMessage NotFoundResponse(int gameId)
		{
			return new HttpResponseMessage(HttpStatusCode.NotFound)
			{
				Content = new StringContent("Game with GameId value " + gameId + " does not exist."),
				ReasonPhrase = "Game not found."
			};
		}

		private HttpResponseMessage GameResponse(Game game)
		{
			return new HttpResponseMessage(HttpStatusCode.OK)
			{
				Content = new StringContent(JsonConvert.SerializeObject(game))
			};
		}
    }
}
