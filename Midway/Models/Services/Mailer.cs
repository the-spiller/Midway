using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Midway.Models.Services
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
            // TODO: once we've got a site and SMTP server,
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

	    public void SendNewRegMessage(string addr, string pwd)
	    {
		    var recips = new List<string>();
		    recips.Add(addr);

		    var msg = new Message
			    {
				    FromAddress = "admin@midwaygame.net",
				    RecipientAddresses = recips,
				    Subject = "Midway Administrators Message",
				    Body = "Hello!\r\n\r\n" +
				           "Welcome! Here is your first-time password for the Midway game site. Use it " +
				           "the next time you log in:\r\n\t" + pwd +
				           "\r\n\r\nYou can change it on the home page \"Your Registration\" tab. " +
						   "Thanks, and we hope you enjoy our game.\r\nMIDWAY Site Admins"
			    };
		    Send(msg);
	    }
    }
}