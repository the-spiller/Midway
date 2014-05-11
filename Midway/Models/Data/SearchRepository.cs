using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Http;
using Midway.Models.DTOs;

namespace Midway.Models.Data
{
	[Authorize]
	public class SearchRepository
	{
		private readonly MidwayContext _context;

        // Constructor
        public SearchRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

		public IOrderedEnumerable<DtoSearch> GetSearches(int gameId, int playerId)
		{
			var pg = _context.PlayerGames
				.Include(p => p.Side)
				.SingleOrDefault(p => p.GameId == gameId && p.PlayerId == playerId);
			if (pg == null)
				throw new ArgumentException("Unable to find PlayerGame having input game and player IDs.");

            // Housekeeping: if it's the first phase of a new turn, delete searches from prior turns that do not
            // have a marked zone (e.g. were not successful).
            if (pg.PhaseId == 1)
            {
                var dbDelSearches = _context.PlayerGameSearches
                                         .Include(s => s.SearchMarkers)
                                         .Where(
                                             s =>
                                             s.GameId == gameId && s.PlayerId == playerId 
                                                && (s.Turn < pg.Turn && s.SearchMarkers.Count == 0)
                                                || (pg.Turn - s.Turn > 4))
                                         .ToList();

                foreach (var dbSearch in dbDelSearches)
                {
                    while (dbSearch.SearchMarkers.Count > 0)
                    {
                        dbSearch.SearchMarkers.Remove(dbSearch.SearchMarkers[0]);
                    }
                    _context.PlayerGameSearches.Remove(dbSearch);
                }
                _context.Save();
            }

            // Three groups in the searches to be returned:
            // 1) searches w/ markers from prior turns
			// 2) new searches available for, and those executed in, the search phase in this turn
            // 3) opponent's searches this turn if game phase is Air Operations.

			// Get group 1.
		    var dtoSearches = new List<DtoSearch>();
		    var dbSearches = _context.PlayerGameSearches
		                             .Include(s => s.SearchMarkers)
		                             .Where(s => s.GameId == gameId && s.PlayerId == playerId)
		                             .ToList();

		    foreach (var dbSearch in dbSearches)
		    {
		        if (pg.PhaseId == 2 && dbSearch.Turn == pg.Turn) continue;  //we'll get them w/ group 2

		        var dtoSearch = new DtoSearch
		            {
		                GameId = dbSearch.GameId,
		                PlayerId = dbSearch.PlayerId,
		                Turn = dbSearch.Turn,
		                SearchNumber = dbSearch.SearchNumber,
		                SearchType = dbSearch.SearchType,
		                Area = dbSearch.Area,
		                Markers = new List<DtoSearchMarker>()
		            };

		        foreach (var dbMarker in dbSearch.SearchMarkers)
		        {
		            dtoSearch.Markers.Add(new DtoSearchMarker
		                {
		                    Zone = dbMarker.Zone,
		                    TypesFound = dbMarker.TypesFound
		                });
		        }
		        dtoSearches.Add(dtoSearch);
		    }

            //Get group 2: new searches available for the search phase in this turn
			if (pg.PhaseId == 2)
			{
				// determine the number of searches available
				var airSearchMax = pg.Side.ShortName == "USN" ? 4 : 3;  // USN player always gets four, even after losing Midway
				var seaSearchMax = _context.PlayerGameShips
							.Where(s => s.GameId == gameId && s.PlayerId == playerId
								&& ("1234567").Contains(s.Location.Substring(1, 1)))   // on the map
					        .Select(s => s.Location)
					        .Distinct()
					        .Count();
				var airSearchCount = 0;
				var seaSearchCount = 0;
				var searchNumber = 0;

				foreach (var s in _context.PlayerGameSearches
				                          .Include(p => p.SearchMarkers)
				                          .Where(p => p.GameId == gameId && p.PlayerId == playerId && p.Turn == pg.Turn))
				{
					if (s.SearchNumber > searchNumber) searchNumber = s.SearchNumber;
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
					dtoSearches.Add(search);

					if (s.SearchType == "air")
						airSearchCount++;
					else
						seaSearchCount++;
				}
				while (true)
				{
					if (airSearchCount < airSearchMax)
					{
						dtoSearches.Add(new DtoSearch
							{
								GameId = gameId,
								PlayerId = playerId,
								Turn = pg.Turn,
								SearchNumber = ++searchNumber,
								SearchType = "air",
								Area = "",
								Markers = new List<DtoSearchMarker>()
							});
						airSearchCount++;
					}
					if (seaSearchCount < seaSearchMax)
					{
						dtoSearches.Add(new DtoSearch
							{
								GameId = gameId,
								PlayerId = playerId,
								Turn = pg.Turn,
								SearchNumber = ++searchNumber,
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
			// Part III
            if (pg.PhaseId == 3) // Air Ops
            {
                foreach (var oppsearch in _context.PlayerGameSearches
                    .Include(p => p.SearchMarkers)
                    .Where(p => p.GameId == gameId && p.PlayerId != playerId && p.Turn == pg.Turn)
                    .ToList())
                {
                    var search = new DtoSearch
                        {
                            GameId = oppsearch.GameId,
                            PlayerId = oppsearch.PlayerId,
                            Turn = oppsearch.Turn,
                            SearchNumber = oppsearch.SearchNumber,
                            SearchType = oppsearch.SearchType,
                            Area = oppsearch.Area,
                            Markers = new List<DtoSearchMarker>()
                        };
                    if (oppsearch.SearchMarkers != null)
                    {
                        foreach (var marker in oppsearch.SearchMarkers)
                        {
                            search.Markers.Add(new DtoSearchMarker
                            {
                                Zone = marker.Zone,
                                TypesFound = marker.TypesFound
                            });
                        }
                    }
                    dtoSearches.Add(search);
                }
            }
            return dtoSearches.OrderBy(s => s.Turn).ThenBy(s => s.PlayerId).ThenBy(s => s.SearchType).ThenBy(s => s.Area);
		    //return searches.OrderBy(s => new { s.Turn, s.PlayerId, s.SearchType, s.Area });
		}

		public DtoSearch AddSearch(DtoSearch dtoSearch)
		{
             //var pg = _context.PlayerGames
             //    .Include(p => p.Searches)
             //   .FirstOrDefault(p => p.GameId == dtoSearch.GameId && p.PlayerId == dtoSearch.PlayerId);

            // Add the search to the DB
			var search = new PlayerGameSearch
				{
                    GameId = dtoSearch.GameId,
                    PlayerId = dtoSearch.PlayerId,
                    Turn = dtoSearch.Turn,
                    SearchNumber = dtoSearch.SearchNumber,
                    SearchType = dtoSearch.SearchType,
                    Area = dtoSearch.Area
				};
		    _context.PlayerGameSearches.Add(search);
            
            // See if the search was successful: any opponent's ships in the area?
		    var ships = (from p in _context.PlayerGameShips
		                 join s in _context.Ships on p.ShipId equals s.ShipId
		                 where (p.GameId == dtoSearch.GameId && p.PlayerId != dtoSearch.PlayerId &&
		                        p.Location.Substring(0, 2) == dtoSearch.Area)
		                 select new { p.Location, s.ShipType })
		        .Distinct();
                      
		    if (ships.Any())
		    {
		        // Add a marker for each zone in the searched area where ship(s) were found
		        // (to both the DB and the DtoSearch we'll return).
		        search.SearchMarkers = new List<PlayerGameSearchMarker>();
		        dtoSearch.Markers = new List<DtoSearchMarker>();

		        // Build up ship type list strings for each location
		        var zones = new Dictionary<string, string>();
		        foreach (var ship in ships)
		        {
		            if (zones.Keys.Contains(ship.Location))
		            {
		                zones[ship.Location] += "," + ship.ShipType;
		            }
		            else
		            {
		                zones.Add(ship.Location, ship.ShipType);
		            }
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
		    else
		    {
		        // No ships sighted, so if there are older markers in this area, get rid of them
		        var oldMarkers = _context.PlayerGameSearchMarkers
		                                 .Where(m => m.GameId == search.GameId && m.PlayerId == search.PlayerId
                                                     && m.Turn < search.Turn && m.Zone.Substring(0, 2) == search.Area)
		                                 .ToList();
                foreach (var oldMarker in oldMarkers)
                {
                    _context.PlayerGameSearchMarkers.Remove(oldMarker);
                }
		    }
		    _context.Save();
            return dtoSearch;
		}
	}
}