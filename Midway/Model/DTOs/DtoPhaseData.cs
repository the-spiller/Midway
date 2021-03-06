﻿using System.Collections.Generic;

namespace Midway.Model.DTOs
{
    public class DtoPhaseData
    {
        public int GameId { get; set; }
        public int PlayerId { get; set; }
        public string SelectedZone { get; set; }
        public int Points { get; set; }

        public IList<DtoShip> Ships { get; set; }
        public IList<DtoAirOp> AirOps { get; set; }
    }
}