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
			// Three parts: 1) searches from prior turns that still have marker records,
			// 2) searches for/from the current turn (including as yet unused searches),
            // and 3) opponent's searches this turn if game phase is Air Operations.
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
								SearchNumber = ++searchNumber,
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
                    searches.Add(search);
                }
            }
            return searches.OrderBy(s => s.Turn).ThenBy(s => s.PlayerId).ThenBy(s => s.SearchType).ThenBy(s => s.Area);
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

                foreach (var zone in zones) {
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

		internal void RemoveSearchMarkers(int gameId, int playerId, IList<DtoSearch> searches)
		{
			if (searches == null || searches.Count == 0) return;

		    int currentTurn =  _context.PlayerGames
                .Where(p => p.GameId == gameId && p.PlayerId == playerId)
                .Select(p => p.Turn)
                .Single();

            // Becuase users can delete search markers, remove search marker records without a corresponding marker
            // in the input search.
            foreach (var search in searches)
            {
                var dbMatch = _context.PlayerGameSearches
                    .SingleOrDefault(p => p.GameId == search.GameId
                        && p.PlayerId == search.PlayerId
                        && p.Turn == search.Turn
                        && p.Area == search.Area);

                if (dbMatch != null)
                {
                    if (search.Markers != null && search.Markers.Count > 0)
                    {
                        IList<string> inputZones = search.Markers.Select(m => m.Zone).ToList();
                        var noGood = dbMatch.SearchMarkers.Where(m => !inputZones.Contains(m.Zone)).ToList();

                        while (noGood.Count > 0)
                        {
                            dbMatch.SearchMarkers.Remove(noGood[0]);
                        }
                    }
                }
            }

            // Remove all searches from earlier turns that do not have markers
		    var searchesToDelete = _context.PlayerGameSearches
                .Include(p => p.SearchMarkers)
		        .Where(p => p.Turn < currentTurn && p.SearchMarkers.Count == 0)
                .ToList();

            while (searchesToDelete.Count > 0)
            {
                _context.PlayerGameSearches.Remove(searchesToDelete[0]);
            }
		    _context.Save();
		}
	}
}