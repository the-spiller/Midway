using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using Midway.Helpers;

namespace Midway.Controllers
{
    public class AuthHandler : DelegatingHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CookieHeaderValue cookie = request.Headers.GetCookies(AuthHelper.CookieName).FirstOrDefault();
            if (cookie != null)
            {
                string [ ] vals = cookie[AuthHelper.CookieName].Value.Split(':');
                
                var role = AuthHelper.GetPlayerRole(vals[0], vals[1]);

                if (!string.IsNullOrEmpty(role))
                {
                    var identity = new GenericIdentity(vals[0], "Token");
                    var principal = new GenericPrincipal(identity, new [] { role });
                    Thread.CurrentPrincipal = principal;
                    if (HttpContext.Current != null)
                    {
                        HttpContext.Current.User = principal;
                    }
                }
            } // else redirect to logon page

            return base.SendAsync(request, cancellationToken);
        }
    }
}