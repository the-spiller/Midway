using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Http;
using Midway.Models.DTOs;

namespace Midway.Models.Data
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
            var dbOps = _context.AirOps
                              .Include(a => a.AirOpsAircraft)
                              .Where(a => a.PlayerId == playerId && a.GameId == gameId)
                              .ToList();

            var ops = new List<DtoAirOp>();

            foreach (var dbOp in dbOps)
            {
                int [ ] totals = { 0, 0, 0 };

                var op = new DtoAirOp
                    {
                        AirOpId = dbOp.AirOpId,
                        Zone = dbOp.Zone,
                        Mission = dbOp.Mission,
                        AircraftTotals = "",
                        AirOpsSources = new List<DtoAirOpSource>()
                    };

                foreach (var dbSource in dbOp.AirOpsAircraft)
                {
                    totals[0] += dbSource.TSquadrons;
                    totals[1] += dbSource.FSquadrons;
                    totals[2] += dbSource.DSquadrons;

                    op.AirOpsSources.Add(new DtoAirOpSource
                        {
                            SourceId = dbSource.SourceId,
                            SourceType = dbSource.SourceType,
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
                        AirOpsAircraft = new List<AirOpAircraft>()
                    };
                _context.AirOps.Add(dbOp);

                foreach (var source in op.AirOpsSources)
                {
                        _context.AirOpAircraftSets.Add(new AirOpAircraft
                        {
                            AirOpId = dbOp.AirOpId,
                            SourceId = source.SourceId,
                            SourceType = source.SourceType,
                            TSquadrons=source.TSquadrons,
                            FSquadrons = source.FSquadrons,
                            DSquadrons = source.DSquadrons
                        });
                }
            }
            _context.Save();
        }
    }
}