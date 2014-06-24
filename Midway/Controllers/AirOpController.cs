using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;
using Midway.Model.Data;
using Midway.Helpers;

namespace Midway.Controllers
{
    [Authorize]
    public class AirOpController : ApiController
    {
        private readonly AirOpRepository _repo;

		public AirOpController(IUnitOfWork uow)
		{
			_repo = new AirOpRepository(uow as MidwayContext);
		}

        public AirOpController()
        {
            IUnitOfWork uow = new MidwayContext();
            _repo = new AirOpRepository(uow);
        }

        // GET api/airop?playerId=x&gameId=y
        public HttpResponseMessage GetAirOpsForPlayerGame(int playerId, int gameId)
        {
            try
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(_repo.GetAirOps(playerId, gameId)))
                };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/airop?playerId&gameId");
            }
        }
    }
}
