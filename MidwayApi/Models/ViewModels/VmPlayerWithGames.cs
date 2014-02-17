using System;
using System.Linq;
using System.Collections.Generic;
using ClassicMidway.Models.DataServices;

namespace ClassicMidway.Models.ViewModels
{
    public class VmPlayerWithGames
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Nickname { get; set; }
        public int SelectedGameId { get; set; }
        public int SelectedOpponentId { get; set; }
        public string PostedBy { get; set; }
        public string Admin { get; set; }

        public IList<VmGame> GamesData { get; set; }
        public IList<KeyValuePair<int, string>> OpponentsData { get; set; }
        public IList<VmRecord> Record { get; set; }

        public VmPlayerWithGames() { }

        public VmPlayerWithGames(GameRepository repo, int playerId)
        {
            // Self-loading!

            this.SelectedGameId = 0;
            this.SelectedOpponentId = 0;
            this.PostedBy = "";
			this.GamesData = new List<VmGame>();
            this.OpponentsData = new List<KeyValuePair<int, string>>();
            this.Record = new List<VmRecord>();

            bool firstOne = true;
            IList<PlayerGame> playerGames = repo.GetPlayerGames(playerId);

            if (playerGames.Count == 0)
            {
                Player player = repo.GetPlayer(playerId);
                this.Email = player.Email;
                this.Password = player.Password;
                this.Nickname = player.Nickname;
                this.Admin = player.Admin;
            }
            foreach (PlayerGame pg in playerGames)
            {
                if (firstOne)
                {
                    this.Email = pg.Player.Email;
                    this.Password = pg.Player.Password;
                    this.Nickname = pg.Player.Nickname;
                    this.Admin = pg.Player.Admin;

                    firstOne = false;
                }

				VmGame gd = repo.LoadGameData(pg);
                this.GamesData.Add(gd);
            }

            //record
            var names = this.GamesData
                .Select(g => g.OpponentNickname)
                .Distinct()
                .ToList();

            foreach (var name in names)
            {
                if (name != "<no opponent yet>")
                {
                    var rec = new VmRecord();
                    rec.OpponentNickname = name;
                    rec.Won = this.GamesData
                        .Where(g => g.OpponentNickname == name
                            && g.Outcome == "Won").Count();
                    rec.Lost = this.GamesData
                        .Where(g => g.OpponentNickname == name
                            && g.Outcome == "Lost").Count();
                    rec.NoDecision = this.GamesData
                        .Where(g => g.OpponentNickname == name
                            && g.Outcome == "No decision").Count();

                    this.Record.Add(rec);
                }
            }

            // Now that we've got the record, remove completed games
            // Where's RemoveAll??
            this.GamesData = this.GamesData
                .Where(g => g.CompletedFlag == "N")
                .ToList();

            // Add new USN game selection if we didn't get one among the games.
            VmGame game = (from g in this.GamesData
                             where g.OpponentNickname == "<no opponent yet>"
                                && g.SideShortName == "USN"
                             select g).FirstOrDefault();
            if (game == null)
            {
                this.GamesData.Add(new VmGame()
                {
                    GameId = -1,
                    SideShortName = "USN",
                    FlagImgPath = "/Content/Images/usn.gif",
                    OpponentNickname = "<no opponent yet>"
                });
            }
            // Add new IJN game selection if we didn't get one among the games.
            game = (from g in this.GamesData
                    where g.OpponentNickname == "<no opponent yet>"
                       && g.SideShortName == "IJN"
                    select g).FirstOrDefault();
            if (game == null)
            {
                this.GamesData.Add(new VmGame()
                {
                    GameId = -2,
                    SideShortName = "IJN",
                    FlagImgPath = "/Content/Images/ijn.gif",
                    OpponentNickname = "<no opponent yet>"
                });
            }

            //potential opponents
            var first = new KeyValuePair<int, string>(0, "First available");
            this.OpponentsData = repo.GetPlayersList(first, playerId);         
        }
    }
}