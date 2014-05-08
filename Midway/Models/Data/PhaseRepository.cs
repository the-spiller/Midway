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
            foreach (var pa in dbPhase.PhaseActions.OrderBy(pa => pa.Sequence))
            {
                dtoPhase.Actions.Add(new DtoAction
                    {
                        ActionKey = pa.ActionKey,
                        Order = pa.Sequence,
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
            
            var dbOppPg = _context.PlayerGames.SingleOrDefault(p => p.GameId == gameId && p.PlayerId != playerId);
            if (dbOppPg != null)
            {
                if (dbPg.PhaseId == 3)  //Air Ops
                {
                    if (dbOppPg.PhaseId)
                    {
                        // opponent has not posted AirOps
                        dbPg.
                    }
                }
                    //IncrementPhase(dbPg);

                    // Get phase and opponent info to see if phase is skippable
                    var phase = _context.Phases.Single(p => p.PhaseId == dbPg.PhaseId);

                if (phase.MightSkip == "Y" &&
                    (dbOppPg == null || dbOppPg.Turn < dbPg.Turn || dbOppPg.PhaseId < dbPg.PhaseId))
                {
                    dbPg.PhaseIndeterminate = "Y";
                }
                else
                {
                    dbPg.PhaseIndeterminate = "N";

                    while (phase.MightSkip == "Y")
                    {
                        switch (phase.PhaseId)
                        {
                            case 4: //	Air Defense Setup
                            case 6: //  Allocate and Resolve
                                if (!UnderAirAttack(dbPg)) IncrementPhase(dbPg);
                                break;
                            case 5: //	Air Attack Setup
                            case 7: //	Air Attack Recovery
                                if (!MakingAirAttacks(dbPg)) IncrementPhase(dbPg);
                                break;
                            case 8: //	Surface Combat Setup
                                if (!SurfaceCombat(dbPg))
                                {
                                    dbPg.Turn++;
                                    dbPg.PhaseId = 1;
                                }
                                break;
                        }
                        // If we didn't change phase, we're done.
                        if (dbPg.PhaseId == phase.PhaseId) break;

                        // Get new phase to see if its skippable
                        phase = _context.Phases.Single(p => p.PhaseId == dbPg.PhaseId);
                    }
                }
            }
            dbPg.LastPlayed = DateTime.Now.ToUniversalTime();
            _context.Save();
        }

        //.....................................................................
        private void IncrementPhase(PlayerGame playerGame)
        {
            playerGame.PhaseId++;
            if (playerGame.PhaseId > _context.Phases.Count())
            {
                playerGame.PhaseId = 1;
                playerGame.Turn++;
            }
        }

        //.....................................................................
        internal bool UnderAirAttack(PlayerGame playerGame)
        {
            return (_context.AirOps.Count(a => a.GameId == playerGame.GameId && a.PlayerId != playerGame.PlayerId
                                            && a.Turn == playerGame.Turn && a.Mission == "attack") > 0);
        }

        //.....................................................................
        private bool MakingAirAttacks(PlayerGame playerGame)
        {
            return (_context.AirOps.Count(a => a.GameId == playerGame.GameId && a.PlayerId == playerGame.PlayerId
                                               && a.Turn == playerGame.Turn && a.Mission == "attack") > 0);
        }

        //.....................................................................
        private bool SurfaceCombat(PlayerGame playerGame)
        {
            // If the players have ships in a single zone and one of them knows it via a search, return true;
            return false;
        }
    }
}