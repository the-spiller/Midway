using System;
using System.Collections.Generic;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using MidwayApi.Models;
using MidwayApi.Models.DTOs;
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

        
    }
}
