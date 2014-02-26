using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web;
using MidwayApi.Models.DTOs;

namespace MidwayApi.Models.Data
{
	public class SearchRepository
	{
		private readonly MidwayContext _context;

        // Constructor
        public SearchRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

		public IList<PlayerGameSearchMarker> GetSearches(int gameId, int playerId)
		{
			return _context.PlayerGameSearchMarkers
			               .Where(p => p.GameId == gameId && p.PlayerId == playerId)
			               .ToList();
		}

		public void AddSearch(DtoSearch dtoSearch)
		{
			_context.PlayerGameSearchMarkers.Add(new PlayerGameSearchMarker
				{
					GameId = dtoSearch.GameId,
					PlayerId = dtoSearch.PlayerId,
					Zone = dtoSearch.Zone,
					TypesFound = dtoSearch.TypesFound,
					PlacedTurn = dtoSearch.PlacedTurn
				}
			);
			_context.Save();
		}

		public void RemoveSearch(int gameId, int playerId, string zone)
		{
			var search = _context.PlayerGameSearchMarkers
				.SingleOrDefault(p => p.GameId == gameId && p.PlayerId == playerId && p.Zone == zone);

			if (search == null)
				throw new Exception("Marker not found");
			
			_context.PlayerGameSearchMarkers.Remove(search);
			_context.Save();
		}
	}
}