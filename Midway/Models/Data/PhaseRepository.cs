using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using Midway.Models.DTOs;

namespace Midway.Models.Data
{
    public class PhaseRepository
    {
        private readonly MidwayContext _context;

        // Constructor
        public PhaseRepository(IUnitOfWork context)
        {
            _context = context as MidwayContext;
        }

        public IList<DtoPhase> GetPhases()
        {
            return _context.Phases.Select(p => new DtoPhase
                {
                    PhaseId = p.PhaseId,
                    Name = p.Name,
                    Description = p.Description
                }).ToList();
        }

        public DtoPhase GetPhase(int id)
        {
            var dbPhase = _context.Phases
                                   .Include(p => p.PhaseActions)
                                   .Single(p => p.PhaseId == id);
            var dtoPhase = new DtoPhase
                {
                    PhaseId = dbPhase.PhaseId,
                    Name = dbPhase.Name,
                    Description = dbPhase.Description,
                    Actions = new List<DtoAction>()
                };
            foreach (var pa in dbPhase.PhaseActions)
            {
                dtoPhase.Actions.Add(new DtoAction
                    {
                        ActionKey = pa.ActionKey,
                        Order = pa.Order,
                        AvailWhenWaiting = pa.AvailWhenWaiting,
                        Description = _context.Actions
                            .Where(a => a.ActionKey == pa.ActionKey)
                            .Select(a => a.Description)
                            .Single()
                    });
            }
            return dtoPhase;
        }
    }
}