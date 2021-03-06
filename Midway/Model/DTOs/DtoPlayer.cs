﻿using System.Collections.Generic;

namespace Midway.Model.DTOs
{
	public class DtoPlayer
	{
		public int PlayerId { get; set; }
		public string Nickname { get; set; }
		public string Email { get; set; }
		public string Password { get; set; }
		public string Admin { get; set; }
		public long Lockout { get; set; }
        public string AuthKey { get; set; }

		public IEnumerable<DtoPlayerGame> Games { get; set; }
	}
}