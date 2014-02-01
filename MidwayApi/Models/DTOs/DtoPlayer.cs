using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MidwayApi.Models.DTOs
{
	public class DtoPlayer
	{
		public int PlayerId { get; set; }
		public string Nickname { get; set; }
		public string Email { get; set; }
		public string Password { get; set; }
		public string Admin { get; set; }
		public long Lockout { get; set; }

		public IEnumerable<DtoGame> Games { get; set; }
	}
}