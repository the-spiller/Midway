﻿using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Midway.Model.DTOs;
using Newtonsoft.Json;
using Midway.Helpers;
using Midway.Model.Data;

namespace Midway.Controllers
{
    [Authorize]
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

		// GET api/search?gameId=x&playerId=y..................................
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
				if (ex.Message.Contains("Unable to find game"))
				{
					return new HttpResponseMessage(HttpStatusCode.NotFound)
						{
							Content = new StringContent(ex.Message)
						};
				}
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/search?gameId&playerId");
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
				return ControllerHelper.GenericErrorResponse(ex,"POST /api/search");
			}
		}
    }
}
