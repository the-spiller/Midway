using System;
using System.Collections.Generic;

namespace ClassicMidway.Models.ViewModels
{
    public class VmAuth
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Nickname { get; set; }
        public string Admin { get; set; }
        public string ResendPwd { get; set; }

        public VmAuth()
        {
            Admin = "N";
            ResendPwd = "N";
        }
    }
}