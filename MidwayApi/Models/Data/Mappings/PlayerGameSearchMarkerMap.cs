﻿using System.Data.Entity.ModelConfiguration;


namespace MidwayApi.Models.Data.Mappings
{
	public class PlayerGameSearchMarkerMap : EntityTypeConfiguration<PlayerGameSearchMarker>
	{
		public PlayerGameSearchMarkerMap()
		{
			ToTable("PlayerGameSearchMarker");

			HasKey(s => new { s.GameId, s.PlayerId, s.Zone });
			Property(s => s.GameId).IsRequired();
			Property(s => s.PlayerId).IsRequired();
			Property(s => s.Zone).HasMaxLength(3).IsRequired();
			Property(s => s.TypesFound).HasMaxLength(24).IsRequired();
			Property(s => s.PlacedTurn).IsRequired();
		}
	}
}