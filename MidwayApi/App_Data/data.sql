-- Script Date: 2/27/2014 7:46 AM  - ErikEJ.SqlCeScripting version 3.5.2.37
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

SET IDENTITY_INSERT [Side] ON;
GO
INSERT INTO [Side] ([SideId],[ShortName],[LongName],[FlagUrl],[TinyFlagUrl]) VALUES (1,N'USN',N'United States Navy Pacific Fleet',N'/content/images/usn-bigger.png',N'/content/images/usn.gif');
GO
INSERT INTO [Side] ([SideId],[ShortName],[LongName],[FlagUrl],[TinyFlagUrl]) VALUES (2,N'IJN',N'Imperial Japanese Navy Combined Fleet',N'/content/images/ijn-bigger.png',N'/content/images/ijn.gif');
GO
SET IDENTITY_INSERT [Side] OFF;
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (1,N'Enterprise',N'CV',N'6',N'TF16',5,10,3,3,1,N'content/images/search/ships/enterprise.png',NULL,25,5,8,12,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (2,N'Hornet',N'CV',N'8',N'TF16',5,10,3,3,1,N'content/images/search/ships/hornet.png',NULL,26,5,9,12,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (3,N'Yorktown',N'CV',N'5',N'TF17',5,10,3,3,1,N'content/images/search/ships/yorktown.png',NULL,26,5,9,12,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (4,N'Minneapolis',N'CA',N'36',N'TF16',5,4,3,6,1,N'content/images/search/ships/minneapolis.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (5,N'New Orleans',N'CA',N'32',N'TF16',5,4,3,6,1,N'content/images/search/ships/neworleans.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (6,N'Vincennes',N'CA',N'44',N'TF16',5,4,3,6,1,N'content/images/search/ships/vincennes.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (7,N'Astoria',N'CA',N'34',N'TF17',4,3,3,6,1,N'content/images/search/ships/astoria.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (8,N'Northampton',N'CA',N'26',N'TF16',4,3,3,6,1,N'content/images/search/ships/northampton.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (9,N'Pensacola',N'CA',N'24',N'TF16',4,3,3,6,1,N'content/images/search/ships/pensacola.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (10,N'Portland',N'CA',N'33',N'TF17',4,3,3,6,1,N'content/images/search/ships/portland.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (11,N'Atlanta',N'CLAA',N'51',N'TF16',3,2,6,3,1,N'content/images/search/ships/atlanta.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (12,N'Akagi',N'CV',NULL,N'Kido Butai',5,10,3,5,2,N'content/images/search/ships/akagi.png',NULL,21,7,7,7,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (13,N'Kaga',N'CV',NULL,N'Kido Butai',5,10,3,5,2,N'content/images/search/ships/kaga.png',NULL,24,10,7,7,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (14,N'Hiryu',N'CV',NULL,N'Kido Butai',3,8,2,3,2,N'content/images/search/ships/hiryu.png',NULL,21,7,7,7,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (15,N'Soryu',N'CV',NULL,N'Kido Butai',3,8,2,3,2,N'content/images/search/ships/soryu.png',NULL,21,7,7,7,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (16,N'Tone',N'CA',N'17',N'Kido Butai',3,3,2,6,2,N'content/images/search/ships/tone.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (17,N'Chikuma',N'CA',N'18',N'Kido Butai',3,3,3,6,2,N'content/images/search/ships/chikuma.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (18,N'Haruna',N'BB',N'4',N'Kido Butai',6,6,5,10,2,N'content/images/search/ships/haruna.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (19,N'Kirishima',N'BB',N'3',N'Kido Butai',6,6,5,10,2,N'content/images/search/ships/kirishima.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (20,N'Nagara',N'CL',N'9',N'Kido Butai',2,2,1,3,2,N'content/images/search/ships/nagara.png',NULL,0,0,0,0,1);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (21,N'Mikuma',N'CA',N'14',N'2nd Fleet',3,3,2,6,2,N'content/images/search/ships/mikuma.png',NULL,0,0,0,0,6);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (22,N'Mogami',N'CA',N'13',N'2nd Fleet',3,3,2,6,2,N'content/images/search/ships/mogami.png',NULL,0,0,0,0,6);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (23,N'Kumano',N'CA',N'16',N'2nd Fleet',3,3,2,6,2,N'content/images/search/ships/kumano.png',NULL,0,0,0,0,6);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (24,N'Suzuya',N'CA',N'15',N'2nd Fleet',3,3,2,6,2,N'content/images/search/ships/suzuya.png',NULL,0,0,0,0,6);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (25,N'Kongo',N'BB',N'1',N'2nd Fleet',6,6,5,10,2,N'content/images/search/ships/kongo.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (26,N'Hiei',N'BB',N'2',N'2nd Fleet',6,6,5,10,2,N'content/images/search/ships/hiei.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (27,N'Atago',N'CA',N'9',N'2nd Fleet',4,4,3,6,2,N'content/images/search/ships/atago.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (28,N'Chokai',N'CA',N'11',N'2nd Fleet',3,3,3,6,2,N'content/images/search/ships/chokai.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (29,N'Myoko',N'CA',N'5',N'2nd Fleet',4,3,3,6,2,N'content/images/search/ships/myoko.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (30,N'Haguro',N'CA',N'7',N'2nd Fleet',4,3,4,6,2,N'content/images/search/ships/haguro.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (31,N'Zuiho',N'CVL',NULL,N'2nd Fleet',2,6,1,2,2,N'content/images/search/ships/zuiho.png',NULL,8,4,4,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (32,N'Yura',N'CL',N'11',N'2nd Fleet',2,2,1,3,2,N'content/images/search/ships/yura.png',NULL,0,0,0,0,10);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (33,N'Yamato',N'BB',N'11',N'Ist Fleet',10,10,10,18,2,N'content/images/search/ships/yamato.png',NULL,0,0,0,0,16);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (34,N'Nagato',N'BB',N'9',N'1st Fleet',8,8,8,13,2,N'content/images/search/ships/nagato.png',NULL,0,0,0,0,16);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (35,N'Mutsu',N'BB',N'10',N'1st Fleet',8,8,8,13,2,N'content/images/search/ships/mutsu.png',NULL,0,0,0,0,16);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (36,N'Hosho',N'CVL',NULL,N'1st Fleet',2,4,1,2,2,N'content/images/search/ships/hosho.png',NULL,3,3,0,0,16);
GO
INSERT INTO [Ship] ([ShipId],[Name],[ShipType],[HullNumber],[TaskForce],[HitsToSink],[PointsToSink],[ScreenStrength],[SurfaceStrength],[SideId],[SearchImgPath],[BattleImgPath],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[ArrivalTurn]) VALUES (37,N'Sendai',N'CL',N'15',N'1st Fleet',2,2,1,3,2,N'content/images/search/ships/sendai.png',NULL,0,0,0,0,16);
GO
SET IDENTITY_INSERT [Player] ON;
GO
INSERT INTO [Player] ([PlayerId],[Email],[Password],[Nickname],[Admin],[Lockout]) VALUES (1,N'jeffcahill@verizon.net',N'bullrun1',N'Verizon',N'N',0);
GO
INSERT INTO [Player] ([PlayerId],[Email],[Password],[Nickname],[Admin],[Lockout]) VALUES (4,N'jcahill@ecfmg.org',N'fivethree13',N'ECFMG',N'N',0);
GO
INSERT INTO [Player] ([PlayerId],[Email],[Password],[Nickname],[Admin],[Lockout]) VALUES (8,N'jcahill531@gmail.com',N'jcahill',N'GMail',N'N',0);
GO
INSERT INTO [Player] ([PlayerId],[Email],[Password],[Nickname],[Admin],[Lockout]) VALUES (9,N'jc@asdf.com',N'asdf',N'Hunkahunk O. Burninlove',N'Y',1390923975974);
GO
INSERT INTO [Player] ([PlayerId],[Email],[Password],[Nickname],[Admin],[Lockout]) VALUES (10,N'cahills8@verizon.net',N'barbie',N'Barbie',N'N',0);
GO
INSERT INTO [Player] ([PlayerId],[Email],[Password],[Nickname],[Admin],[Lockout]) VALUES (14,N'fmann@ecfmg.org',N'asdf',N'Vice Admiral Nagumo',N'N',0);
GO
SET IDENTITY_INSERT [Player] OFF;
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (1,N'Search Map Move',N'Place arriving ships on the search map, move any or all ships, and ready or de-ready aircraft.',N'N');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (2,N'Search',N'Players execute air and sea searches.',N'N');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (3,N'Air Operations',N'Players see where their opponent searched and plan air missions.',N'N');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (4,N'Air Defense Setup',N'If under air attack, players move ships in each attacked zone to the battle board and arrange them for defense.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (5,N'Air Attack Setup',N'Players place aircraft on the Battle Map for each zone they''re attacking, defining specific ship attacks.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (6,N'Allocate and Resolve',N'Attacked players strip off any extra fighters if they so desire, allocate defensive fire, and resolve air combats.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (7,N'Air Attack Recovery',N'Attackers view air combat results and recover their aircraft.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (8,N'Surface Combat Setup',N'Both players arrange on the Battle Map any of their ships that share a single zone on the search map; one ship per rectangle.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (15,N'Surface Combat Move',N'Both players move any or all of their ships on the Battle Map one rectangle.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (16,N'Surface Combat Fire Assignment',N'Players direct the fire of their ships at enemy ships in range (battleships: 4 rectangles; all others: 3).',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (17,N'Surface Combat Fire Resolution',N'Players resolve their surface combat shots. Ship hits are taken.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (18,N'Surface Combat Withdrawal',N'Either or both players may attempt to end surface combat by withdrawal.',N'Y');
GO
INSERT INTO [Phase] ([PhaseId],[Name],[Description],[MightSkip]) VALUES (100,N'Hold',N'Space for reworking numbers',N'N');
GO
SET IDENTITY_INSERT [Game] ON;
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (90,{ts '2013-12-03 11:34:24.160'},{ts '2014-02-05 17:03:37.180'},N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (98,{ts '2014-02-06 14:53:02.883'},{ts '2014-02-08 21:26:39.093'},N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (99,{ts '2014-02-06 15:22:08.590'},{ts '2014-02-07 07:05:57.120'},N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (100,{ts '2014-02-07 07:11:20.450'},{ts '2014-02-07 07:16:55.730'},N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (101,{ts '2014-02-07 07:32:47.093'},{ts '2014-02-07 07:33:02.903'},N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (102,{ts '2014-02-08 21:25:09.217'},NULL,N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (103,{ts '2014-02-08 22:09:27.947'},NULL,N'Y');
GO
INSERT INTO [Game] ([GameId],[CreateDTime],[CompletedDTime],[Draw]) VALUES (104,{ts '2014-02-08 22:44:08.453'},NULL,N'Y');
GO
SET IDENTITY_INSERT [Game] OFF;
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (90,8,1,1,{ts '2013-11-11 13:00:00.000'},0,NULL,0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (90,9,2,1,{ts '2013-05-05 17:30:00.000'},0,NULL,0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (98,9,2,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (98,14,1,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (99,14,1,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (100,9,1,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (101,14,2,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (102,9,2,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (102,10,1,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (103,1,2,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (103,9,1,1,NULL,0,N'',0,N'N',1,0,0);
GO
INSERT INTO [PlayerGame] ([GameId],[PlayerId],[SideId],[PhaseId],[LastPlayed],[Points],[SelectedLocation],[SurfaceCombatRound],[PhaseIndeterminate],[Turn],[MidwayInvadedTurn],[AircraftReadyState]) VALUES (104,14,1,1,NULL,0,N'',0,N'N',1,0,0);
GO
SET IDENTITY_INSERT [AirOp] OFF;
GO
INSERT INTO [Airbase] ([FortificationStrength],[Location],[SideId],[AircraftCapacity],[TSquadrons],[FSquadrons],[DSquadrons],[SearchImgPath],[BattleImgPath],[AirbaseId],[AirbaseName]) VALUES (20,N'H5G',1,30,2,6,6,N'content/images/search/ships/midway',NULL,1,N'Midway');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'AIRATTACK',N'Configure Air Attacks',N'BOTH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'AIRDEF',N'Configure Air Attack Defense',N'BOTH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'AIRRES',N'Resolve Fighter Combat & Air Attacks',N'BATTLE');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'ALLOCATE',N'Allocate Air Defense Fire',N'BATTLE');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'CAPASSIGN',N'Assign CAP  to Ship Defense',N'BATTLE');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'MIDWAYRED',N'Midway Reduction',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'OFF',N'Ships that are off-map',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'OPPSEARCH',N'Opponent''s searches',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'OPS',N'Plan air operations',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'READY',N'Aircraft readiness',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'RECOVER',N'Recover Aircraft',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'REINFORCE',N'Arriving ships',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'SEARCH',N'Search for enemy ships',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'SEE',N'Forces in selected zone',N'SEARCH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'SURFFIRE',N'Select Surface Targets',N'BATTLE');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'SURFMOVE',N'Move Surface Combat Ships',N'BATTLE');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'SURFRES',N'Resolve Surface Combat',N'BATTLE');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'SURFSETUP',N'Configure Surface Combat',N'BOTH');
GO
INSERT INTO [Action] ([ActionKey],[Description],[Map]) VALUES (N'WITHDRAW',N'Surface Combat Withdrawal',N'BATTLE');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (1,N'READY',3,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (1,N'REINFORCE',1,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (1,N'SEE',2,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (2,N'OFF',3,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (2,N'SEARCH',1,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (2,N'SEE',2,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (3,N'OFF',4,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (3,N'OPPSEARCH',1,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (3,N'OPS',2,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (3,N'SEE',3,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (4,N'AIRDEF',1,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (4,N'OFF',3,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (4,N'SEE',2,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (5,N'AIRATTACK',1,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (5,N'OFF',3,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (5,N'SEE',2,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (6,N'AIRRES',4,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (6,N'ALLOCATE',3,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (6,N'CAPASSIGN',2,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (6,N'MIDWAYRED',1,N'N');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (6,N'OFF',6,N'Y');
GO
INSERT INTO [PhaseAction] ([PhaseId],[ActionKey],[Order],[AvailWhenWaiting]) VALUES (6,N'SEE',5,N'Y');
GO
DBCC CHECKIDENT ('Side', RESEED, 3);
GO
DBCC CHECKIDENT ('Player', RESEED, 15);
GO
DBCC CHECKIDENT ('Game', RESEED, 105);
GO
DBCC CHECKIDENT ('AirOp', RESEED, 1);
GO

