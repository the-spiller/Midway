using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Midway.Models.DTOs;
using Newtonsoft.Json;
using Midway.Helpers;
using Midway.Models.Data;

namespace Midway.Controllers
{
    public class ShipController : ApiController
    {
        private readonly ShipRepository _repo;

		public ShipController(IUnitOfWork uow)
		{
			_repo = new ShipRepository(uow as MidwayContext);
		}

        public ShipController()
        {
            IUnitOfWork uow = new MidwayContext();
            _repo = new ShipRepository(uow);
        }

        // GET api/ship
        public HttpResponseMessage GetShips()
        {
            try
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(_repo.GetShips()))
                };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex);
            }
        }

        // GET api/ship?playerId=x&gameId=y
        public HttpResponseMessage GetShipsForPlayerGame(int playerId, int gameId)
        {
            try
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(_repo.GetShips(playerId, gameId)))
                };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex);
            }
        }           
    }
}
