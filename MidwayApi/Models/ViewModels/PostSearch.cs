using System;
using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
	public class PostSearch
	{
		public string Area { get; set; }
        public string Type { get; set; }
        public IList<PostSearchMarker> Markers { get; set; }
	}
}