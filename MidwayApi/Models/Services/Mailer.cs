using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MidwayApi.Models
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
    }
}