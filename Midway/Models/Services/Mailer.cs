using System.Configuration;
using System.Collections.Generic;
using System.Text;
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
        private const string BRBR = "<br /><br />";
        private const string SIG = "<span style=\"font-style: italic;\">Midway Site Administrators</span>";

        public void Send(Message message)
        {
            if (ConfigurationManager.AppSettings["actuallySendEmail"] != "true") return;

            var recipList = string.Empty;
            foreach (string recip in message.RecipientAddresses)
            {
                recipList += recip + ";";
            }
            recipList = recipList.Substring(0, recipList.Length - 1);

            WebMail.Send(recipList, message.Subject, message.Body);
        }

        public void SendNewPwdMessage(string addr, string nickname, string newPwd)
        {
            var recips = new List<string> { addr };

            var msgBody = new StringBuilder(string.Format("{0},{1}", nickname, BRBR));
            msgBody.Append("Here&rsquo;s the nasty, computer-generated replacement password you requested for the ");
            msgBody.AppendFormat("<a href=\"http://midwaydev.jeffcahill.net\">Midway game site</a>:{0}", BRBR);
            msgBody.AppendFormat("<span style=\"font-weight: bold;\">{0}</span>{1}", newPwd, BRBR);
            msgBody.Append("Use it to log on, and then you can change it on the Midway Home page ");
            msgBody.AppendFormat("&ldquo;Your Registration&rdquo; tab.{0}", BRBR);
            msgBody.Append(SIG);

            var msg = new Message
                {
                    RecipientAddresses = recips,
                    Subject = "Midway Administrator's Message",
                    Body = msgBody.ToString()
                };
            Send(msg);
        }

	    public void SendNewRegMessage(string addr, string nickname, string pwd)
	    {
		    var recips = new List<string> { addr };

            var msgBody = new StringBuilder("<span style=\"font-weight: bold;\">");
	        msgBody.AppendFormat("Hello and welcome, {0}!</span>{1}", nickname, BRBR);
	        msgBody.Append("Here is your nasty, computer-generated password for the ");
	        msgBody.AppendFormat("<a href=\"http:\\midwaydev.jeffcahill.net\">Midway game site</a>. Use it to log on:{0}", BRBR);
	        msgBody.AppendFormat("<span style=\"font-weight: bold;\">{0}</span>{1}", pwd, BRBR);
	        msgBody.AppendFormat("You can change it on the Miday Home page &ldquo;Your Registration&rdquo; tab.{0}", BRBR);
	        msgBody.AppendFormat("Thanks, and we hope you enjoy the game.{0}", BRBR);
	        msgBody.Append(SIG);

	        var msg = new Message
			    {
				    RecipientAddresses = recips,
				    Subject = "Midway Administrator's Message",
				    Body = msgBody.ToString()
			    };
		    Send(msg);
	    }
    }
}