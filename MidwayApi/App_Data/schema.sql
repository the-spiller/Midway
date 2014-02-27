-- Script Date: 2/27/2014 7:50 AM  - ErikEJ.SqlCeScripting version 3.5.2.37
-- Database information:
-- Locale Identifier: 1033
-- Encryption Mode: 
-- Case Sensitive: False
-- Database: C:\GitHub\Midway\MidwayApi\App_Data\cm.sdf
-- ServerVersion: 4.0.8876.1
-- DatabaseSize: 404 KB
-- SpaceAvailable: 3.999 GB
-- Created: 1/31/2014 5:25 PM

-- User Table information:
-- Number of tables: 15
-- Action: 19 row(s)
-- Airbase: 1 row(s)
-- AirOp: 0 row(s)
-- AirOpAircraft: 0 row(s)
-- Game: 8 row(s)
-- Phase: 13 row(s)
-- PhaseAction: 22 row(s)
-- Player: 6 row(s)
-- PlayerGame: 12 row(s)
-- PlayerGameAirbase: 0 row(s)
-- PlayerGameSearch: 0 row(s)
-- PlayerGameSearchMarker: 0 row(s)
-- PlayerGameShip: 0 row(s)
-- Ship: 37 row(s)
-- Side: 2 row(s)

CREATE TABLE [Side] (
  [SideId] int IDENTITY (1,1) NOT NULL
, [ShortName] nvarchar(3) NOT NULL
, [LongName] nvarchar(60) NOT NULL
, [FlagUrl] nvarchar(256) NULL
, [TinyFlagUrl] nvarchar(256) NULL
);
GO
CREATE TABLE [Ship] (
  [ShipId] int NOT NULL
, [Name] nvarchar(60) NOT NULL
, [ShipType] nvarchar(4) NULL
, [HullNumber] nvarchar(3) NULL
, [TaskForce] nvarchar(60) NULL
, [HitsToSink] int NULL
, [PointsToSink] int NULL
, [ScreenStrength] int NULL
, [SurfaceStrength] int NULL
, [SideId] int NULL
, [SearchImgPath] nvarchar(256) NULL
, [BattleImgPath] nvarchar(256) NULL
, [AircraftCapacity] int DEFAULT 0 NULL
, [TSquadrons] int NULL
, [FSquadrons] int NULL
, [DSquadrons] int NULL
, [ArrivalTurn] int DEFAULT 1 NOT NULL
);
GO
CREATE TABLE [Player] (
  [PlayerId] int IDENTITY (1,1) NOT NULL
, [Email] nvarchar(100) NOT NULL
, [Password] nvarchar(30) NOT NULL
, [Nickname] nvarchar(100) NOT NULL
, [Admin] nvarchar(1) DEFAULT 'N' NOT NULL
, [Lockout] bigint DEFAULT 0 NOT NULL
);
GO
CREATE TABLE [Phase] (
  [PhaseId] int NOT NULL
, [Name] nvarchar(40) NOT NULL
, [Description] nvarchar(256) NULL
, [MightSkip] nvarchar(1) DEFAULT 'N' NOT NULL
);
GO
CREATE TABLE [Game] (
  [GameId] int IDENTITY (1,1) NOT NULL
, [CreateDTime] datetime NULL
, [CompletedDTime] datetime NULL
, [Draw] nvarchar(1) DEFAULT 'Y' NOT NULL
);
GO
CREATE TABLE [PlayerGame] (
  [GameId] int NOT NULL
, [PlayerId] int NOT NULL
, [SideId] int NOT NULL
, [PhaseId] int NULL
, [LastPlayed] datetime NULL
, [Points] int DEFAULT 0 NOT NULL
, [SelectedLocation] nvarchar(3) NULL
, [SurfaceCombatRound] int DEFAULT 0 NOT NULL
, [PhaseIndeterminate] nvarchar(1) DEFAULT 'N' NOT NULL
, [Turn] int DEFAULT 0 NOT NULL
, [MidwayInvadedTurn] int DEFAULT 0 NOT NULL
, [AircraftReadyState] int NOT NULL
);
GO
CREATE TABLE [PlayerGameShip] (
  [GameId] int NOT NULL
, [PlayerId] int NOT NULL
, [ShipId] int NOT NULL
, [Hits] int NULL
, [Location] nvarchar(3) NULL
, [TSquadrons] int NULL
, [FSquadrons] int NULL
, [DSquadrons] int NULL
);
GO
CREATE TABLE [PlayerGameSearch] (
  [GameId] int NOT NULL
, [PlayerId] int NOT NULL
, [Turn] int NOT NULL
, [SearchNumber] int NOT NULL
, [SearchType] nvarchar(3) NOT NULL
, [Area] nvarchar(2) NULL
);
GO
CREATE TABLE [PlayerGameSearchMarker] (
  [GameId] int NOT NULL
, [PlayerId] int NOT NULL
, [Turn] int NOT NULL
, [SearchNumber] int NOT NULL
, [Zone] nvarchar(3) NOT NULL
, [TypesFound] nvarchar(30) NOT NULL
);
GO
CREATE TABLE [AirOp] (
  [AirOpId] int IDENTITY (1,1) NOT NULL
, [GameId] int NOT NULL
, [PlayerId] int NOT NULL
, [Zone] nvarchar(3) NOT NULL
, [Mission] nvarchar(7) NOT NULL
, [Turn] int DEFAULT 0 NOT NULL
);
GO
CREATE TABLE [AirOpAircraft] (
  [AirOpId] int NOT NULL
, [SourceId] int NOT NULL
, [SourceType] nvarchar(7) NOT NULL
, [TSquadrons] smallint NULL
, [FSquadrons] smallint NULL
, [DSquadrons] smallint NULL
);
GO
CREATE TABLE [Airbase] (
  [FortificationStrength] int NULL
, [Location] nvarchar(3) NULL
, [SideId] int NOT NULL
, [AircraftCapacity] int NULL
, [TSquadrons] int NULL
, [FSquadrons] int NULL
, [DSquadrons] int NULL
, [SearchImgPath] nvarchar(256) NULL
, [BattleImgPath] nvarchar(100) NULL
, [AirbaseId] int NOT NULL
, [AirbaseName] nvarchar(60) NULL
);
GO
CREATE TABLE [PlayerGameAirbase] (
  [PlayerId] int NOT NULL
, [FortificationStrength] int NULL
, [TSquadrons] int NULL
, [FSquadrons] int NULL
, [DSquadrons] int NULL
, [AirbaseId] int NOT NULL
, [GameId] int NOT NULL
);
GO
CREATE TABLE [Action] (
  [ActionKey] nvarchar(16) NOT NULL
, [Description] nvarchar(40) NULL
, [Map] nvarchar(6) NULL
);
GO
CREATE TABLE [PhaseAction] (
  [PhaseId] int NOT NULL
, [ActionKey] nvarchar(16) NOT NULL
, [Order] int NULL
, [AvailWhenWaiting] nvarchar(1) NULL
);
GO
ALTER TABLE [Side] ADD CONSTRAINT [PK_Side] PRIMARY KEY ([SideId]);
GO
ALTER TABLE [Ship] ADD CONSTRAINT [PK_Ship] PRIMARY KEY ([ShipId]);
GO
ALTER TABLE [Player] ADD CONSTRAINT [PK_Player] PRIMARY KEY ([PlayerId]);
GO
ALTER TABLE [Phase] ADD CONSTRAINT [PK_Phase] PRIMARY KEY ([PhaseId]);
GO
ALTER TABLE [Game] ADD CONSTRAINT [PK_Game] PRIMARY KEY ([GameId]);
GO
ALTER TABLE [PlayerGame] ADD CONSTRAINT [PK_PlayerGame] PRIMARY KEY ([GameId],[PlayerId]);
GO
ALTER TABLE [PlayerGameShip] ADD CONSTRAINT [PK_PlayerGameShip] PRIMARY KEY ([GameId],[PlayerId],[ShipId]);
GO
ALTER TABLE [PlayerGameSearch] ADD CONSTRAINT [PK_PlayerGameSearch] PRIMARY KEY ([GameId],[PlayerId],[Turn],[SearchNumber]);
GO
ALTER TABLE [PlayerGameSearchMarker] ADD CONSTRAINT [PK__PlayerGameSearchMarker__0000000000000639] PRIMARY KEY ([GameId],[PlayerId],[Turn],[SearchNumber],[Zone]);
GO
ALTER TABLE [AirOp] ADD CONSTRAINT [PK_AirOp] PRIMARY KEY ([AirOpId]);
GO
ALTER TABLE [AirOpAircraft] ADD CONSTRAINT [PK_AirOpAircraft] PRIMARY KEY ([AirOpId],[SourceId],[SourceType]);
GO
ALTER TABLE [Airbase] ADD CONSTRAINT [PK__Airbase__00000000000003EB] PRIMARY KEY ([AirbaseId]);
GO
ALTER TABLE [PlayerGameAirbase] ADD CONSTRAINT [PK__PlayerGameAirbase__00000000000003AF] PRIMARY KEY ([PlayerId],[AirbaseId],[GameId]);
GO
ALTER TABLE [Action] ADD CONSTRAINT [PK_Action] PRIMARY KEY ([ActionKey]);
GO
ALTER TABLE [PhaseAction] ADD CONSTRAINT [PK__PhaseAction__0000000000000437] PRIMARY KEY ([PhaseId],[ActionKey]);
GO
CREATE UNIQUE INDEX [UQ__Side__000000000000004A] ON [Side] ([SideId] ASC);
GO
CREATE UNIQUE INDEX [UQ__Side__000000000000004F] ON [Side] ([ShortName] ASC);
GO
CREATE UNIQUE INDEX [UQ__Side__0000000000000054] ON [Side] ([LongName] ASC);
GO
CREATE UNIQUE INDEX [UQ__Ship__00000000000000EF] ON [Ship] ([ShipId] ASC);
GO
CREATE UNIQUE INDEX [UQ__Player__0000000000000035] ON [Player] ([PlayerId] ASC);
GO
CREATE UNIQUE INDEX [UQ__Player__000000000000003A] ON [Player] ([Email] ASC);
GO
CREATE UNIQUE INDEX [UQ__Player__000000000000056E] ON [Player] ([Nickname] ASC);
GO
CREATE UNIQUE INDEX [UQ__Phase__0000000000000094] ON [Phase] ([PhaseId] ASC);
GO
CREATE UNIQUE INDEX [UQ__Phase__0000000000000099] ON [Phase] ([Name] ASC);
GO
CREATE UNIQUE INDEX [UQ__Game__00000000000001AE] ON [Game] ([GameId] ASC);
GO
CREATE UNIQUE INDEX [UQ__Airbase__00000000000003F0] ON [Airbase] ([AirbaseId] ASC);
GO
CREATE UNIQUE INDEX [UQ__Action__00000000000001CB] ON [Action] ([ActionKey] ASC);
GO
ALTER TABLE [Ship] ADD CONSTRAINT [ShipSideSide] FOREIGN KEY ([SideId]) REFERENCES [Side]([SideId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGame] ADD CONSTRAINT [PhaseIdPhase] FOREIGN KEY ([PhaseId]) REFERENCES [Phase]([PhaseId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGame] ADD CONSTRAINT [PlayerGameGame] FOREIGN KEY ([GameId]) REFERENCES [Game]([GameId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGame] ADD CONSTRAINT [PlayerIdPlayer] FOREIGN KEY ([PlayerId]) REFERENCES [Player]([PlayerId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGame] ADD CONSTRAINT [SideIdSide] FOREIGN KEY ([SideId]) REFERENCES [Side]([SideId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGameShip] ADD CONSTRAINT [PlayerGameShipPlayerGame] FOREIGN KEY ([GameId], [PlayerId]) REFERENCES [PlayerGame]([GameId], [PlayerId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGameShip] ADD CONSTRAINT [PlayerGameShipShip] FOREIGN KEY ([ShipId]) REFERENCES [Ship]([ShipId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGameSearch] ADD CONSTRAINT [PlayerGameSearchPlayerGame] FOREIGN KEY ([GameId], [PlayerId]) REFERENCES [PlayerGame]([GameId], [PlayerId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGameSearchMarker] ADD CONSTRAINT [PlayerGameSearchMarkerPlayerGameSearch] FOREIGN KEY ([GameId], [PlayerId], [Turn], [SearchNumber]) REFERENCES [PlayerGameSearch]([GameId], [PlayerId], [Turn], [SearchNumber]) ON DELETE CASCADE ON UPDATE NO ACTION;
GO
ALTER TABLE [AirOpAircraft] ADD CONSTRAINT [AirOpAircraftAirOp] FOREIGN KEY ([AirOpId]) REFERENCES [AirOp]([AirOpId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [Airbase] ADD CONSTRAINT [AirbaseSide] FOREIGN KEY ([SideId]) REFERENCES [Side]([SideId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGameAirbase] ADD CONSTRAINT [PlayerGameAirbaseAirbase] FOREIGN KEY ([AirbaseId]) REFERENCES [Airbase]([AirbaseId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PlayerGameAirbase] ADD CONSTRAINT [PlayerGameAirbasePlayerGame] FOREIGN KEY ([GameId], [PlayerId]) REFERENCES [PlayerGame]([GameId], [PlayerId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PhaseAction] ADD CONSTRAINT [PhaseActionAction] FOREIGN KEY ([ActionKey]) REFERENCES [Action]([ActionKey]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO
ALTER TABLE [PhaseAction] ADD CONSTRAINT [PhaseActionPhase] FOREIGN KEY ([PhaseId]) REFERENCES [Phase]([PhaseId]) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

