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
		    var searches = new List<DtoSearch>();
		    foreach (var s in _context.PlayerGameSearches
		                                   .Include(p => p.SearchMarkers)
		                                   .Where(p => p.GameId == gameId && p.PlayerId == playerId))
		    {
		        var search = new DtoSearch
		            {
		                GameId = s.GameId,
		                PlayerId = s.PlayerId,
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

		public void RemoveSearchMarker(DtoSearch search, string zone)
		{
			var marker = _context.PlayerGameSearchMarkers
				.SingleOrDefault(p => p.GameId == search.GameId && p.PlayerId == search.PlayerId 
                    && p.Turn == search.Turn && p.SearchNumber == search.SearchNumber && p.Zone == zone);

			if (search == null)
				throw new Exception("Marker not found");
			
			_context.PlayerGameSearchMarkers.Remove(marker);
			_context.Save();
		}
	}
}