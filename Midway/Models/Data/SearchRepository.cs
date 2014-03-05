using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using Midway.Models.DTOs;

namespace Midway.Models.Data
{
	public class SearchRepository
	{
		private readonly MidwayContext _context;

        // Constructor
        public SearchRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

		public IList<DtoSearch> GetSearches(int gameId, int playerId)
		{
			// Two parts: searches from prior turns that still have marker records, and
			// searches for/from the current turn.

			var pg = _context.PlayerGames
				.Include(p => p.Side)
				.SingleOrDefault(p => p.GameId == gameId && p.PlayerId == playerId);
			if (pg == null)
				throw new ArgumentException("Unable to find game having input game and player IDs.");

			// Part One:
		    var searches = new List<DtoSearch>();
		    foreach (var s in _context.PlayerGameSearchMarkers
				              .Include(p => p.PlayerGameSearch)
				              .Where(p => p.GameId == gameId && p.PlayerId == playerId)
							  .ToList())
		    {
			    if (pg.PhaseId == 2 && s.Turn == pg.Turn) continue;

			    var marker = new DtoSearchMarker
				    {
					    Zone = s.Zone,
					    TypesFound = s.TypesFound
				    };
			    var search = searches.SingleOrDefault(e => e.Turn == s.Turn && e.SearchNumber == s.SearchNumber);
			    if (search == null)
			    {
				    search = new DtoSearch
					    {
						    GameId = gameId,
						    PlayerId = playerId,
						    Turn = s.Turn,
						    SearchNumber = s.SearchNumber,
						    SearchType = s.PlayerGameSearch.SearchType,
						    Area = s.PlayerGameSearch.Area,
						    Markers = new List<DtoSearchMarker>()
					    };
				    searches.Add(search);
			    }
			    search.Markers.Add(marker);
		    }

			//Part Two:
			if (pg.PhaseId == 2)	// add used/unused searches for this turn
			{
				// determine the number of searches available
				var airSearchMax = pg.Side.ShortName == "USN" ? 4 : 3;
				var seaSearchMax = _context.PlayerGameShips
							.Where(s => s.GameId == gameId && s.PlayerId == playerId
								&& ("1234567").Contains(s.Location.Substring(1, 1)))
					        .Select(s => s.Location)
					        .Distinct()
					        .Count();
				var airSearchCount = 0;
				var seaSearchCount = 0;

				foreach (var s in _context.PlayerGameSearches
				                          .Include(p => p.SearchMarkers)
				                          .Where(p => p.GameId == gameId && p.PlayerId == playerId && p.Turn == pg.Turn))
				{
					var search = new DtoSearch
						{
							GameId = gameId,
							PlayerId = playerId,
							Turn = s.Turn,
							SearchNumber = s.SearchNumber,
							SearchType = s.SearchType,
							Area = s.Area,
							Markers = new List<DtoSearchMarker>()
						};
					foreach (var m in s.SearchMarkers)
					{
						search.Markers.Add(new DtoSearchMarker
							{
								Zone = m.Zone,
								TypesFound = m.TypesFound
							});
					}
					searches.Add(search);

					if (s.SearchType == "air")
						airSearchCount++;
					else
						seaSearchCount++;
				}
				while (true)
				{
					if (airSearchCount < airSearchMax)
					{
						searches.Add(new DtoSearch
							{
								GameId = gameId,
								PlayerId = playerId,
								Turn = pg.Turn,
								SearchNumber = airSearchCount + 1,
								SearchType = "air",
								Area = "",
								Markers = new List<DtoSearchMarker>()
							});
						airSearchCount++;
					}
					if (seaSearchCount < seaSearchMax)
					{
						searches.Add(new DtoSearch
							{
								GameId = gameId,
								PlayerId = playerId,
								Turn = pg.Turn,
								SearchNumber = seaSearchCount + 1,
								SearchType = "sea",
								Area = "",
								Markers = new List<DtoSearchMarker>()
							});
						seaSearchCount++;
					}
					if (airSearchCount == airSearchMax && seaSearchCount == seaSearchMax)
						break;
				}
			}
            return searches;
		}

		public DtoSearch AddSearch(DtoSearch dtoSearch)
		{
             var pg = _context.PlayerGames
                .FirstOrDefault(p => p.GameId == dtoSearch.GameId && p.PlayerId == dtoSearch.PlayerId);

            // Add the search to the DB
		    dtoSearch.Turn = pg == null ? 0 : pg.Turn;
			var search = new PlayerGameSearch
				{
					GameId = dtoSearch.GameId,
					PlayerId = dtoSearch.PlayerId,
                    Turn = dtoSearch.Turn,
                    SearchNumber = dtoSearch.SearchNumber,
                    Area = dtoSearch.Area
				};
		    _context.PlayerGameSearches.Add(search);
            
            // See if the search was successful
		    var ships = _context.PlayerGameShips
                .Include(s => s.Ship)
		        .Where(s => s.GameId == dtoSearch.GameId && s.PlayerId != dtoSearch.PlayerId
                    && s.Location.Substring(0, 2) == dtoSearch.Area)
                .OrderBy(s => new { s.Location, s.Ship.ShipType })
		        .ToList();

		    if (ships.Count > 0)
		    {
		        // Add a marker for each zone in the searched area where ship(s) were found
                // (to both the DB and the DtoSearch we'll return).
		        search.SearchMarkers = new List<PlayerGameSearchMarker>();
		        dtoSearch.Markers = new List<DtoSearchMarker>();

		        var zones = new Dictionary<string, string>();
		        foreach (var ship in ships)
		        {
		            if (zones.Keys.Contains(ship.Location))
		                zones[ship.Location] += ", " + ship.Ship.ShipType;
		            else
		                zones.Add(ship.Location, ship.Ship.ShipType);
		        }
		        foreach (var zone in zones)
		        {
		            search.SearchMarkers.Add(new PlayerGameSearchMarker
		                {
		                    Zone = zone.Key,
		                    TypesFound = zone.Value
		                });

		            dtoSearch.Markers.Add(new DtoSearchMarker
		                {
		                    Zone = zone.Key,
		                    TypesFound = zone.Value
		                });
		        }
		    }
		    _context.Save();
            return dtoSearch;
		}

		public void RemoveSearchMarkers(IList<DtoSearch> searches)
		{
			if (searches.Count == 0) return;

			var dbSearches = _context.PlayerGameSearches
			                         .Include(p => p.SearchMarkers)
			                         .Where(p => p.GameId == searches[0].GameId && p.PlayerId == searches[0].PlayerId
										 && p.Turn == searches[0].Turn)
			                         .ToList();
			foreach (var dbSearch in dbSearches)
			{
				var matchedArea = searches.SingleOrDefault(s => s.Area == dbSearch.Area);
				if (matchedArea == null)
				{
					dbSearches.Remove(dbSearch);
				}
				else
				{
					foreach (var dbMarker in dbSearch.SearchMarkers)
					{
						if (matchedArea.Markers == null || matchedArea.Markers.All(m => m.Zone != dbMarker.Zone))
							dbSearch.SearchMarkers.Remove(dbMarker);
					}
				}
			}
		}
	}
}