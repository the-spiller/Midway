using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Http;
using Midway.Models.DTOs;

namespace Midway.Models.Data
{
	[Authorize]
    public class PhaseRepository
    {
        private readonly MidwayContext _context;

        // Constructor
        public PhaseRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

        public IList<DtoPhase> GetPhases()
        {
            return _context.Phases.Select(p => new DtoPhase
                {
                    PhaseId = p.PhaseId,
                    Name = p.Name,
                    Description = p.Description
                }).ToList();
        }

        public DtoPhase GetPhase(int id)
        {
            var dbPhase = _context.Phases
                .Include(p => p.PhaseActions)
                .Single(p => p.PhaseId == id);
            var dtoPhase = new DtoPhase
                {
                    PhaseId = dbPhase.PhaseId,
                    Name = dbPhase.Name,
                    Description = dbPhase.Description,
                    Actions = new List<DtoAction>()
                };
            foreach (var pa in dbPhase.PhaseActions.OrderBy(pa => pa.Order))
            {
                dtoPhase.Actions.Add(new DtoAction
                    {
                        ActionKey = pa.ActionKey,
                        Order = pa.Order,
                        AvailWhenWaiting = pa.AvailWhenWaiting,
                        Description = _context.Actions
                                              .Where(a => a.ActionKey == pa.ActionKey)
                                              .Select(a => a.Description)
                                              .Single()
                    });
            }
            return dtoPhase;
        }

        public void AdvancePhase(int gameId, int playerId, string selectedZone, int points)
        {
            var dbPg = _context.PlayerGames.Single(p => p.GameId == gameId && p.PlayerId == playerId);
            dbPg.SelectedLocation = selectedZone;
            dbPg.Points = points;
            IncrementPhase(dbPg);

            var phase = _context.Phases.Single(p => p.PhaseId == dbPg.PhaseId);
            while (phase.MightSkip == "Y")
            {
                switch (phase.PhaseId)
                {
                    case 4: //	Air Defense Setup
                    case 6: //  Allocate and Resolve
                        if (!UnderAirAttack(dbPg)) dbPg.PhaseId++;
                        break;
                    case 5: //	Air Attack Setup
                    case 7: //	Air Attack Recovery
                        if (!MakingAirAttacks(dbPg)) dbPg.PhaseId++;
                        break;
                    case 8: //	Surface Combat Setup
                        break;
                    default:
                        break;
                }

                if (dbPg.PhaseId == phase.PhaseId) break;
                phase = _context.Phases.Single(p => p.PhaseId == dbPg.PhaseId);
            }

            dbPg.LastPlayed = DateTime.Now.ToUniversalTime();
            _context.Save();
        }

        private void IncrementPhase(PlayerGame playerGame)
        {
            playerGame.PhaseId++;
            if (playerGame.PhaseId > _context.Phases.Count())
            {
                playerGame.PhaseId = 1;
                playerGame.Turn++;
            }
        }

        private bool UnderAirAttack(PlayerGame playerGame)
        {
            return (_context.AirOps.Count(a => a.GameId == playerGame.GameId && a.PlayerId != playerGame.PlayerId
                                            && a.Turn == playerGame.Turn && a.Mission == "attack") > 0);
        }

        private bool MakingAirAttacks(PlayerGame playerGame)
        {
            return (_context.AirOps.Count(a => a.GameId == playerGame.GameId && a.PlayerId == playerGame.PlayerId
                                               && a.Turn == playerGame.Turn && a.Mission == "attack") > 0);
        }
    }
}