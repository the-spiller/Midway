using System.Collections.Generic;

namespace Midway.Models.DTOs
{
    public class DtoPhase
    {
        public int PhaseId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ReadOnly { get; set; }

        public IList<DtoAction> Actions { get; set; }
    }
}