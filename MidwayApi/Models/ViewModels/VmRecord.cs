using System;
using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmRecord
    {
        public string OpponentNickname { get; set; }
        public int Won { get; set; }
        public int Lost { get; set; }
        public int NoDecision { get; set; }
    }
}