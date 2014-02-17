using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using MidwayApi.Models.DTOs;

namespace MidwayApi.Models.Data
{
    public class ShipRepository
    {
        private readonly MidwayContext _context;

        // Constructor
        public ShipRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

        //.....................................................................
        public IList<DtoShip> GetShips()
        {
            return _context.Ships.Select(s => new DtoShip
                {
                    Id = s.ShipId,
                    OwningSide = s.Side.ShortName,
                    Location = "",
                    Name = s.Name,
                    ShipType = s.ShipType,
                    SearchImgPath = s.SearchImgPath,
                    BattleImgPath = s.BattleImgPath,
                    MovePoints = 0,
                    HitsToSink = s.HitsToSink,
                    Hits = 0,
                    ScreenStrength = s.ScreenStrength,
                    SurfaceStrength = s.SurfaceStrength,
                    AircraftCapacity = s.AircraftCapacity,
                    TSquadrons = s.TSquadrons,
                    FSquadrons = s.FSquadrons,
                    DSquadrons = s.DSquadrons,
                    AirReadyState = 0,
                    ArrivalTurn = s.ArrivalTurn
                }).ToList();
        }

        //.....................................................................
        public IList<DtoShip> GetShips(int playerId, int gameId)
        {
            var pg = _context.PlayerGames
                .Include(p => p.Side)
                .FirstOrDefault(p => p.PlayerId == playerId && p.GameId == gameId);

            var movePts = GetMovePoints(pg);
            var sideName = pg.Side.ShortName;

            var dbShips = _context.PlayerGameShips
                              .Include(p => p.Ship)
                              .Where(p => p.PlayerId == playerId && p.GameId == gameId)
                              .ToList();

            var dtoShips = dbShips.Select(dbShip => new DtoShip
                {
                    Id = dbShip.ShipId, 
                    OwningSide = sideName, 
                    Location = dbShip.Location,
                    Name = dbShip.Ship.Name, 
                    ShipType = dbShip.Ship.ShipType, 
                    SearchImgPath = dbShip.Ship.SearchImgPath, 
                    BattleImgPath = dbShip.Ship.BattleImgPath, 
                    MovePoints = movePts, 
                    HitsToSink = dbShip.Ship.HitsToSink, 
                    Hits = dbShip.Hits, 
                    ScreenStrength = dbShip.Ship.ScreenStrength, 
                    SurfaceStrength = dbShip.Ship.SurfaceStrength, 
                    AircraftCapacity = dbShip.Ship.AircraftCapacity, 
                    TSquadrons = dbShip.TSquadrons, 
                    FSquadrons = dbShip.FSquadrons, 
                    DSquadrons = dbShip.DSquadrons, 
                    AirReadyState = dbShip.AircraftReadyState, 
                    ArrivalTurn = dbShip.Ship.ArrivalTurn
                }).ToList();

            if (pg.PhaseId == 1)
            {
                var arrivals = _context.Ships
                    .Where(s => s.Side.SideId == pg.SideId && s.ArrivalTurn == pg.Turn ||
                        s.ShipType.Substring(0, 2) == "CV" && s.ArrivalTurn > pg.Turn)
                    .ToList();

                dtoShips.AddRange(arrivals.Select(s => new DtoShip
                    {
                        Id = s.ShipId,
                        OwningSide = pg.Side.ShortName,
                        Location = "ARR",
                        Name = s.Name,
                        ShipType = s.ShipType,
                        SearchImgPath = s.SearchImgPath,
                        BattleImgPath = s.BattleImgPath,
                        MovePoints = movePts,
                        HitsToSink = s.HitsToSink,
                        Hits = 0,
                        ScreenStrength = s.ScreenStrength,
                        SurfaceStrength = s.SurfaceStrength,
                        AircraftCapacity = s.AircraftCapacity,
                        TSquadrons = s.TSquadrons,
                        FSquadrons = s.FSquadrons,
                        DSquadrons = s.DSquadrons,
                        AirReadyState = 0,
                        ArrivalTurn = s.ArrivalTurn
                    }));
            }
            return dtoShips;
        }

        private int GetMovePoints(PlayerGame pg)
        {
            if (pg.PhaseId == 1)
            {
                if (pg.SideId == 1 && pg.Turn == 1) return 6;
                return 2;
            }
            return 0;
        }
    }
}