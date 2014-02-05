using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MidwayApi.Models.Services
{
    public class Message
    {
        public string FromAddress { get; set; }
        public IList<string> RecipientAddresses { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
    }

    public class Mailer
    {
        public void Send(Message message)
        {
            // TODO: once we've got a site and email address,
            // we'll actually send out email.
        }

        public void SendNewPwdMessage(string addr, string newPwd)
        {
            var recips = new List<string>();
            recips.Add(addr);

            var msg = new Message
                {
                    FromAddress = "admin@midwaygame.net",
                    RecipientAddresses = recips,
                    Subject = "Midway Administrators Message",
                    Body = "Here's the replacement password you requested for Midway:<br /><br />" +
                           newPwd + "<br /><br />Use it once to log on and then you can change it at Midway Home " +
                           " on the Your Registration tab."
                };
            Send(msg);
        }
    }
}