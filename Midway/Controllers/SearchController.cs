using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Midway.Models.DTOs;
using Newtonsoft.Json;
using Midway.Helpers;
using Midway.Models.Data;

namespace Midway.Controllers
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
    }
}
