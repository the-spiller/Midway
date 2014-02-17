using System;
using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmGame
    {
        public int GameId { get; set; }
        public string SideShortName { get; set; }
        public string FlagImgPath { get; set; }
        public string OpponentNickname { get; set; }
        public string LastPlayed { get; set; }
        public string CompletedFlag { get; set; }
        public string Outcome { get; set; }
    }
}