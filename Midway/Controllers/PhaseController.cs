using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Midway.Helpers;
using Midway.Models.DTOs;
using Midway.Models.Data;
using Newtonsoft.Json;

namespace Midway.Controllers
{
    public class PhaseController : ApiController
    {
        //private readonly PlayerRepository _playerRepo;
        private readonly PhaseRepository _phaseRepo;
        private readonly ShipRepository _shipRepo;
        private readonly SearchRepository _searchRepo;

        public PhaseController()
        {
            IUnitOfWork uow = new MidwayContext();
            //_playerRepo = new PlayerRepository(uow);
            _phaseRepo = new PhaseRepository(uow);
            _shipRepo = new ShipRepository(uow);
            _searchRepo = new SearchRepository(uow);
        }

        // GET api/phase
        public HttpResponseMessage GetPhases()
        {
            try
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(JsonConvert.SerializeObject(_phaseRepo.GetPhases()))
                    };
            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex);
            }
        }

        // GET api/phase/id
        public HttpResponseMessage GetPhase(int id)
        {
            try
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(JsonConvert.SerializeObject(_phaseRepo.GetPhase(id)))
                    };
            }
            catch (Exception ex)
            {
                if (ex.Message == "Phase not found")
                {
                    return new HttpResponseMessage(HttpStatusCode.NotFound)
                        {
                            Content =
                                new StringContent("Phase with PhaseId value " + id + " does not exist."),
                            ReasonPhrase = "Phase Not Found"
                        };
                }
                else
                {
                    return ControllerHelper.GenericErrorResponse(ex);
                }
            }
        }

        // PUT api/phase (UPDATE)
        public HttpResponseMessage PutPhaseData(int gameId, int playerId, IList<DtoShip> ships, IList<DtoSearch> searches)
        {
            try
            {
                if (ships != null)
                    _shipRepo.UpdateShips(gameId, playerId, ships);

                if (searches != null)
                    _searchRepo.RemoveSearchMarkers(searches);

                return new HttpResponseMessage(HttpStatusCode.NoContent);

            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex);
            }
        }
    }
}
