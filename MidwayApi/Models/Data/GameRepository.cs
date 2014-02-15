using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web;
using MidwayApi.Models.DTOs;

namespace MidwayApi.Models.Data
{
	public class GameRepository
	{
		private readonly MidwayContext _context;

        // Constructor
        public GameRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }


	}
}