using System;
using System.Configuration;
using System.Collections.Generic;
using System.Web.Helpers;

namespace Midway.Models.Services
{
    public class Message
    {
        public IList<string> RecipientAddresses { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
    }

    public class Mailer
    {
        public void Send(Message message)
        {
            if (ConfigurationManager.AppSettings["actuallySendEmail"] != "true") return;

            string recipList = string.Empty;
            foreach (string recip in message.RecipientAddresses)
            {
                recipList += recip + ";";
            }
            recipList = recipList.Substring(0, recipList.Length - 2);

            WebMail.Send(recipList, message.Subject, message.Body);
        }

        public void SendNewPwdMessage(string addr, string nickname, string newPwd)
        {
            var recips = new List<string> { addr };
            var msg = new Message
                {
                    RecipientAddresses = recips,
                    Subject = "Midway Administrator's Message",
                    Body = nickname + ",<br /><br />Here's the nasty, computer-generated replacement password you requested for " +
                        "Midway:<br /><br />" + newPwd + "<br /><br />Use it once to log on and thoen you can change it on the " +
                        "Midway Home page's &ldquo;Your Registration&rdquo; tab.<br /><br />Midway Site Administrators"
                };
            Send(msg);
        }

	    public void SendNewRegMessage(string addr, string nickname, string pwd)
	    {
		    var recips = new List<string> { addr };
	        var msg = new Message
			    {
				    RecipientAddresses = recips,
				    Subject = "Midway Administrator's Message",
				    Body = "Hello and welcome, " + nickname + "!<br /><br />" +
				           "Here is your nasty, computer-generated password for the Midway game site. Use it " +
				           "the next time you log in:<br /><br />" + pwd + "<br /><br />You can change it on the Miday Home page " +
				           "&ldquo;Your Registration&rdquo; tab.<br /><br />Thanks, and we hope your enjoy the game.<br /><br />" +
                           "Midway Site Administrators"
			    };
		    Send(msg);
	    }
    }
}