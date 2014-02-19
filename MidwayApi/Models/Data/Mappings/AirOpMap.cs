﻿using System.Data.Entity.ModelConfiguration;

namespace MidwayApi.Models.Data.Mappings
{
    public class AirOpMap : EntityTypeConfiguration<AirOp>
    {
		public AirOpMap()
		{
			ToTable("AirOp");

			HasKey(a => a.AirOpId);

            Property(a => a.AirOpId).IsRequired();
			Property(a => a.GameId).IsRequired();
			Property(a => a.PlayerId).IsRequired();
            Property(a => a.Turn).IsRequired();
			Property(a => a.Zone).IsRequired();
            Property(a => a.Mission).IsRequired();

            HasMany(a => a.AirOpsAircraft).WithRequired(o => o.AirOp).HasForeignKey(o => o.AirOpId);
		}
    }
}