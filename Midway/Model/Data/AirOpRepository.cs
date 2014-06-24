using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Http;
using Midway.Model.DTOs;

namespace Midway.Model.Data
{
    public class AirOpRepository
    {
        private readonly MidwayContext _context;

        // Constructor
        public AirOpRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

        //.....................................................................
        public IList<DtoAirOp> GetAirOps(int playerId, int gameId)
        {
            var turn = _context.PlayerGames
                               .Where(p => p.PlayerId == playerId && p.GameId == gameId)
                               .Select(p => p.Turn)
                               .Single();

            var dbOps = _context.AirOps
                              .Include(a => a.AirOpAircraftSet)
                              .Where(a => a.PlayerId == playerId && a.GameId == gameId && a.Turn == turn)
                              .ToList();

            var ops = new List<DtoAirOp>();

            foreach (var dbOp in dbOps)
            {
                int [ ] totals = { 0, 0, 0 };
                int? capSquadrons = null;
                if (dbOp.Mission == "Attack")
                {
                    capSquadrons = _context.AirOpAircraftSets
                                           .Include(s => s.AirOp)
                                           .Where(s => s.AirOp.PlayerId != playerId && s.AirOp.GameId == gameId
                                                       && s.AirOp.Turn == turn && s.AirOp.Mission == "CAP"
                                                       && s.AirOp.Zone == dbOp.Zone)
                                           .Sum(s => s.FSquadrons);
                }
                var op = new DtoAirOp
                    {
                        AirOpId = dbOp.AirOpId,
                        Zone = dbOp.Zone,
                        Mission = dbOp.Mission,
                        AircraftTotals = "",
                        AirOpSources = new List<DtoAirOpSource>(),
                        CapSquadrons = capSquadrons ?? 0
                    };

                foreach (var dbSource in dbOp.AirOpAircraftSet)
                {
                    totals[0] += dbSource.TSquadrons;
                    totals[1] += dbSource.FSquadrons;
                    totals[2] += dbSource.DSquadrons;

                    op.AirOpSources.Add(new DtoAirOpSource
                        {
                            SourceId = dbSource.SourceId,
                            SourceType = dbSource.SourceType,
                            SourceLocation = GetSourceLocation(playerId, gameId, dbSource.SourceId, dbSource.SourceType),
                            TSquadrons = dbSource.TSquadrons,
                            FSquadrons = dbSource.FSquadrons,
                            DSquadrons = dbSource.DSquadrons
                        });
                }
                op.AircraftTotals = string.Format(" T{0}  F{1}  D{2}", totals[0], totals[1], totals[2]);
                ops.Add(op);
            }
            return ops;
        }

        //.....................................................................
        public void SaveAirOps(int gameId, int playerId, IList<DtoAirOp> airOps)
        {
            // Save these new ones
            foreach (var op in airOps)
            {
                var dbOp = new AirOp
                    {
                        GameId = gameId,
                        PlayerId = playerId,
                        Turn = op.Turn,
                        Zone = op.Zone,
                        Mission = op.Mission,
                        AirOpAircraftSet = new List<AirOpAircraft>()
                    };

                foreach (var source in op.AirOpSources)
                {
	                var tot = source.TSquadrons + source.FSquadrons + source.DSquadrons;
	                if (tot > 0)
	                {
		                dbOp.AirOpAircraftSet.Add(new AirOpAircraft
			                {
				                SourceId = source.SourceId,
				                SourceType = source.SourceType,
				                TSquadrons = source.TSquadrons,
				                FSquadrons = source.FSquadrons,
				                DSquadrons = source.DSquadrons
			                });
	                }
                }
                _context.AirOps.Add(dbOp);
            }
            _context.Save();
        }

        private string GetSourceLocation(int playerId, int gameId, int sourceId, string sourceType)
        {
            if (sourceType == "BAS")
            {
                return _context.PlayerGameAirbases
                               .Include(a => a.Airbase)
                               .Where(a => a.PlayerId == playerId && a.GameId == gameId && a.AirbaseId == sourceId)
                               .Select(a => a.Airbase.Location)
                               .Single();
            }
            else
            {
                return _context.PlayerGameShips
                               .Where(s => s.PlayerId == playerId && s.GameId == gameId && s.ShipId == sourceId)
                               .Select(s => s.Location)
                               .Single();
            }
        }
    }
}