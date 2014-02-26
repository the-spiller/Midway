using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using MidwayApi.Models.DTOs;
using Newtonsoft.Json;
using MidwayApi.Helpers;
using MidwayApi.Models.Data;

namespace MidwayApi.Controllers
{
    public class SearchController : ApiController
    {
        private readonly SearchRepository _repo;

		public SearchController(IUnitOfWork uow)
		{
			_repo = new SearchRepository(uow as MidwayContext);
		}

        public SearchController()
        {
            IUnitOfWork uow = new MidwayContext();
            _repo = new SearchRepository(uow);
        }

		// GET api/search?gameId=x&playerId=y
		public HttpResponseMessage GetSearches(int gameId, int playerId)
		{
			try
			{
				return new HttpResponseMessage(HttpStatusCode.OK)
				{
					Content = new StringContent(JsonConvert.SerializeObject(_repo.GetSearches(gameId, playerId)))
				};
			}
			catch (Exception ex)
			{
				return ControllerHelper.GenericErrorResponse(ex);
			}
		}

		// POST api/search (INSERT)
		public HttpResponseMessage PostSearch(DtoSearch dtoSearch)
		{
			try
			{
				_repo.AddSearch(dtoSearch);
				return new HttpResponseMessage(HttpStatusCode.NoContent);
			}
			catch (Exception ex)
			{
				return ControllerHelper.GenericErrorResponse(ex);
			}
		}

		// DELETE api/search?gameId=x&playerId=y&zone=z
		public HttpResponseMessage DeleteSearch(int gameId, int playerId, string zone)
		{
			try
			{
				_repo.RemoveSearch(gameId, playerId, zone);
				return new HttpResponseMessage(HttpStatusCode.NoContent);
			}
			catch (Exception ex)
			{
				if (ex.Message == "Marker not found")
				{
					return new HttpResponseMessage(HttpStatusCode.NotFound)
						{
							Content = new StringContent("Unable to find a marker for the input game, player and zone."),
							ReasonPhrase = "Marker Not Found"
						};
				}
				return ControllerHelper.GenericErrorResponse(ex);
			}			
		}
    }
}
