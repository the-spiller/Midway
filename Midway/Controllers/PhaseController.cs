using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Midway.Helpers;
using Newtonsoft.Json;
using Midway.Models.DTOs;
using Midway.Models.Data;

namespace Midway.Controllers
{
    [Authorize]
    public class PhaseController : ApiController
    {
        private readonly IUnitOfWork _uow;
        private readonly PhaseRepository _phaseRepo;

        public PhaseController()
        {
            _uow = new MidwayContext();
            _phaseRepo = new PhaseRepository(_uow);
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
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/phase");
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
                return ControllerHelper.GenericErrorResponse(ex, "GET /api/phase/id");
            }
        }

        // PUT api/phase (UPDATE)
        public HttpResponseMessage PutPhaseData(DtoPhaseData phaseData)
        {
            try
            {
                if (phaseData.Ships != null && phaseData.Ships.Count > 0)
                    new ShipRepository(_uow).UpdateShips(phaseData.GameId, phaseData.PlayerId, phaseData.Ships);

                if (phaseData.Searches != null && phaseData.Searches.Count > 0)
                    new SearchRepository(_uow).RemoveSearchMarkers(phaseData.GameId, phaseData.PlayerId, phaseData.Searches);

                _phaseRepo.AdvancePhase(
                    phaseData.GameId, 
                    phaseData.PlayerId, 
                    phaseData.SelectedZone, 
                    phaseData.Points);

	            var dtoPlayer = new PlayerRepository(_uow).GetPlayerWithCurrentGame(phaseData.PlayerId, phaseData.GameId);

                return new HttpResponseMessage(HttpStatusCode.OK)
	                {
		                Content = new StringContent(JsonConvert.SerializeObject(dtoPlayer))
	                };

            }
            catch (Exception ex)
            {
                return ControllerHelper.GenericErrorResponse(ex, "PUT /api/phase");
            }
        }
    }
}
