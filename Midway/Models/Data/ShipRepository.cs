﻿using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Http;
using Midway.Models.DTOs;

namespace Midway.Models.Data
{
	[Authorize]
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
            var dbShips = _context.Ships.Select(s => new DtoShip
                {
                    ShipId = s.ShipId,
                    AirbaseId = 0,
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
                    OriginalFortificationStrength = 0,
                    FortificationStrength = 0,
                    AircraftCapacity = s.AircraftCapacity,
                    TSquadrons = s.TSquadrons,
                    FSquadrons = s.FSquadrons,
                    DSquadrons = s.DSquadrons,
                    AircraftState = 0,
                    ArrivalTurn = s.ArrivalTurn
                }).ToList();

            dbShips.AddRange(_context.Airbases.Select(a => new DtoShip
                {
                    ShipId = 0,
                    AirbaseId = a.AirbaseId,
                    OwningSide = a.Side.ShortName,
                    Location = a.Location,
                    Name = a.AirbaseName,
                    ShipType = "BAS",
                    SearchImgPath = a.SearchImgPath,
                    BattleImgPath = a.BattleImgPath,
                    MovePoints = 0,
                    HitsToSink = 0,
                    Hits = 0,
                    ScreenStrength = 0,
                    SurfaceStrength = 0,
                    OriginalFortificationStrength = a.FortificationStrength,
                    FortificationStrength = a.FortificationStrength,
                    AircraftCapacity = a.AircraftCapacity,
                    TSquadrons = a.TSquadrons,
                    FSquadrons = a.FSquadrons,
                    DSquadrons = a.DSquadrons,
                    AircraftState = 0,
                    ArrivalTurn = 0
                }).ToList());

            return dbShips;
        }

        //.....................................................................
        public IList<DtoShip> GetShips(int playerId, int gameId)
        {
            var pg = _context.PlayerGames
                .Include(p => p.Side)
                .First(p => p.PlayerId == playerId && p.GameId == gameId);

            var movePts = GetMovePoints(pg);
            var sideName = pg.Side.ShortName;

            var dbShips = _context.PlayerGameShips
                              .Include(p => p.Ship)
                              .Where(p => p.PlayerId == playerId && p.GameId == gameId)
                              .ToList();

            var dtoShips = dbShips.Select(dbShip => new DtoShip
                {
                    ShipId = dbShip.ShipId, 
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
                    OriginalFortificationStrength = 0,
                    FortificationStrength = 0,
                    AircraftCapacity = dbShip.Ship.AircraftCapacity, 
                    TSquadrons = dbShip.TSquadrons, 
                    FSquadrons = dbShip.FSquadrons, 
                    DSquadrons = dbShip.DSquadrons, 
                    AircraftState = pg.PhaseId == 1 && dbShip.AircraftState == 1 ? 2 : dbShip.AircraftState,
                    ArrivalTurn = dbShip.Ship.ArrivalTurn
                }).ToList();


            var arrivals = _context.Ships
                                .Where(s => s.Side.SideId == pg.SideId && 
                                    (pg.PhaseId == 1 && s.ArrivalTurn == pg.Turn || s.ArrivalTurn > pg.Turn))
                                .ToList();
            
            dtoShips.AddRange(arrivals.Select(s => new DtoShip
                {
                    ShipId = s.ShipId,
                    OwningSide = sideName,
                    Location = s.ArrivalTurn > pg.Turn ? "DUE" : "ARR",
                    Name = s.Name,
                    ShipType = s.ShipType,
                    SearchImgPath = s.SearchImgPath,
                    BattleImgPath = s.BattleImgPath,
                    MovePoints = movePts,
                    HitsToSink = s.HitsToSink,
                    Hits = 0,
                    ScreenStrength = s.ScreenStrength,
                    SurfaceStrength = s.SurfaceStrength,
                    OriginalFortificationStrength = 0,
                    FortificationStrength = 0,
                    AircraftCapacity = s.AircraftCapacity,
                    TSquadrons = s.TSquadrons,
                    FSquadrons = s.FSquadrons,
                    DSquadrons = s.DSquadrons,
                    AircraftState = 0,
                    ArrivalTurn = s.ArrivalTurn
                }).ToList());
             
            if (pg.Turn == 1 && pg.PhaseId == 1)
            {
                var airbases = _context.Airbases
                                       .Include(a => a.Side)
                                       .Where(a => a.Side.SideId == pg.SideId)
                                       .ToList();
                dtoShips.AddRange(airbases.Select(a => new DtoShip
                    {
                        ShipId = 0,
                        AirbaseId = a.AirbaseId,
                        OwningSide = sideName,
                        Location = a.Location,
                        Name = a.AirbaseName,
                        ShipType = "BAS",
                        SearchImgPath = a.SearchImgPath,
                        BattleImgPath = a.BattleImgPath,
                        MovePoints = 0,
                        HitsToSink = 0,
                        Hits = 0,
                        ScreenStrength = 0,
                        SurfaceStrength = 0,
                        OriginalFortificationStrength = a.FortificationStrength,
                        FortificationStrength = a.FortificationStrength,
                        AircraftCapacity = a.AircraftCapacity,
                        TSquadrons = a.TSquadrons,
                        FSquadrons = a.FSquadrons,
                        DSquadrons = a.DSquadrons,
                        AircraftState = 0,
                        ArrivalTurn = 0
                    }).ToList());
            }
            else
            {
                var airbases = _context.PlayerGameAirbases
                                       .Include(p => p.Airbase)
                                       .Where(p => p.PlayerId == pg.PlayerId && p.GameId == pg.GameId)
                                       .ToList();
                dtoShips.AddRange(airbases.Select(a => new DtoShip
                {
                    ShipId = 0,
                    AirbaseId = a.AirbaseId,
                    OwningSide = pg.Side.ShortName,
                    Location = a.Airbase.Location,
                    Name = a.Airbase.AirbaseName,
                    ShipType = "BAS",
                    SearchImgPath = a.Airbase.SearchImgPath,
                    BattleImgPath = a.Airbase.BattleImgPath,
                    MovePoints = 0,
                    HitsToSink = 0,
                    Hits = 0,
                    ScreenStrength = 0,
                    SurfaceStrength = 0,
                    OriginalFortificationStrength = a.Airbase.FortificationStrength,
                    FortificationStrength = a.FortificationStrength,
                    AircraftCapacity = a.Airbase.AircraftCapacity,
                    TSquadrons = a.TSquadrons,
                    FSquadrons = a.FSquadrons,
                    DSquadrons = a.DSquadrons,
                    AircraftState = a.AircraftState,
                    ArrivalTurn = 0
                }).ToList());
            }

            return dtoShips;
        }

		//...........................................................................
		public void UpdateShips(int gameId, int playerId, IList<DtoShip> dtoShips)
		{
		    var phase = _context.PlayerGames.Single(p => p.GameId == gameId && p.PlayerId == playerId).PhaseId;
            if (phase > 1) return;

			foreach (var dtoShip in dtoShips)
			{
				if (dtoShip.AirbaseId > 0)
				{
					 var dbAirbase = _context.PlayerGameAirbases
						.SingleOrDefault(a => a.GameId == gameId && a.PlayerId == playerId 
							&& a.AirbaseId == dtoShip.AirbaseId);
					if (dbAirbase == null)
					{
						dbAirbase = new PlayerGameAirbase
						{
							GameId = gameId,
							PlayerId = playerId,
							AirbaseId = dtoShip.AirbaseId
						};

						var airbase = _context.Airbases
							.Include(b => b.Side)
							.Single(b => b.AirbaseId == dtoShip.AirbaseId);
						if (dtoShip.OwningSide == airbase.Side.ShortName)
						{
							dbAirbase.FortificationStrength = airbase.FortificationStrength;
							dbAirbase.TSquadrons = airbase.TSquadrons;
							dbAirbase.FSquadrons = airbase.FSquadrons;
							dbAirbase.DSquadrons = airbase.DSquadrons;
						    dbAirbase.AircraftState = 0;
						}
						else  //switched sides!
						{
							dbAirbase.FortificationStrength = 0;
							dbAirbase.TSquadrons = 0;
							dbAirbase.FSquadrons = 0;
							dbAirbase.DSquadrons = 0;
						    dbAirbase.AircraftState = 0;
						}
						_context.PlayerGameAirbases.Add(dbAirbase);
					}
					else
					{
						dbAirbase.FortificationStrength = dtoShip.FortificationStrength;
						dbAirbase.TSquadrons = dtoShip.TSquadrons;
						dbAirbase.FSquadrons = dtoShip.FSquadrons;
						dbAirbase.DSquadrons = dtoShip.DSquadrons;
					    dbAirbase.AircraftState = dtoShip.AircraftState;
					}
				}
				else
				{
					var dbShip = _context.PlayerGameShips
						.Include(s => s.Ship)
						.SingleOrDefault(s => s.GameId == gameId && s.PlayerId == playerId && s.ShipId == dtoShip.ShipId);

				    if (dbShip == null)
				    {
				        dbShip = _context.PlayerGameShips.Add(new PlayerGameShip
				            {
				                GameId = gameId,
				                PlayerId = playerId,
				                Ship = _context.Ships.Single(s => s.ShipId == dtoShip.ShipId)
				            });
				    }

				    dbShip.Location = dtoShip.Location;
					dbShip.Hits = dtoShip.Hits;
					dbShip.TSquadrons = dtoShip.TSquadrons;
					dbShip.FSquadrons = dtoShip.FSquadrons;
					dbShip.DSquadrons = dtoShip.DSquadrons;
				    dbShip.AircraftState = dtoShip.AircraftState;
				}

			}
		}

		//...........................................................................
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