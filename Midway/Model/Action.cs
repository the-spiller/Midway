using System;
using System.Collections.Generic;

namespace Midway.Model
{
	public class Action
	{
		public string ActionKey { get; set; }
		public string Description { get; set; }

		public virtual IList<PhaseAction> PhaseActions { get; set; }
	}
}