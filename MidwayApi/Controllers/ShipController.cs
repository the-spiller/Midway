﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using MidwayApi.Models.Data;
using MidwayApi.Models.DTOs;
using Newtonsoft.Json;

namespace MidwayApi.Controllers
{
    public class ShipController : ApiController
    {
        private readonly ShipRepository _repo;

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

        // GET api/ship?pid=playerId&gid=gameId
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
