using System;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Helpers;
using System.Configuration;
using Midway.App_Start;
using Midway.Model.Services;

namespace Midway
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            RouteTable.Routes.MapHubs();
            //AreaRegistration.RegisterAllAreas();

            WebApiConfig.Register(GlobalConfiguration.Configuration);
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            GlobalConfiguration.Configuration.MessageHandlers.Add(new AuthHandler());

            //WebMail settings
            WebMail.SmtpServer = ConfigurationManager.AppSettings["SmtpServer"];
            WebMail.SmtpPort = Convert.ToInt32(ConfigurationManager.AppSettings["SmtpPort"]);
            WebMail.EnableSsl = false;
            WebMail.UserName = ConfigurationManager.AppSettings["MailSender"];
            WebMail.From = WebMail.UserName;
            WebMail.Password = "bullrun1";
        }
    }
}