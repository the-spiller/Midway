using System;
using System.Collections.Generic;

namespace MidwayApi.Models
{
	public class PhaseAction
	{
		public int PhaseId { get; set; }
		public string ActionKey { get; set; }
		public int Order { get; set; }
        public string AvailWhenWaiting { get; set; }

		public virtual Phase Phase { get; set; }
		public virtual Action Action { get; set; }
	}
}