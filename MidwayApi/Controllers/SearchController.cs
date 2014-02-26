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
		public HttpResponseMessage GetSearchesForPlayerGame(int playerId, int gameId)
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
				return new HttpResponseMessage(HttpStatusCode.OK)
				    {
				        Content = new StringContent(JsonConvert.SerializeObject(_repo.AddSearch(dtoSearch)))
				    };
			}
			catch (Exception ex)
			{
				return ControllerHelper.GenericErrorResponse(ex);
			}
		}

		// DELETE api/search?gameId=x&playerId=y&zone=z
		public HttpResponseMessage DeleteSearchMarker(DtoSearch search, string zone)
		{
			try
			{
				_repo.RemoveSearchMarker(search, zone);
				return new HttpResponseMessage(HttpStatusCode.NoContent);
			}
			catch (Exception ex)
			{
				if (ex.Message == "Marker not found")
				{
					return new HttpResponseMessage(HttpStatusCode.NotFound)
						{
							Content = new StringContent("Unable to locate indicated search marker in database."),
							ReasonPhrase = "Marker Not Found"
						};
				}
				return ControllerHelper.GenericErrorResponse(ex);
			}			
		}
    }
}
