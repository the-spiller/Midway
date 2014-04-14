using System.Web.Http;
using System.Web.Mvc;
using Midway.App_Start;
using Midway.Models.Services;
using System.Web.Helpers;

namespace Midway
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            //AreaRegistration.RegisterAllAreas();
            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            GlobalConfiguration.Configuration.MessageHandlers.Add(new AuthHandler());

            //WebMail settings
            WebMail.SmtpServer = "smtpout.secureserver.net";
            WebMail.SmtpPort = 25;
            WebMail.EnableSsl = false;
            WebMail.UserName = "midway_admin@jeffcahill.net";
            WebMail.From = WebMail.UserName;
            WebMail.Password = "bullrun1";
        }
    }
}