using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Principal;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Runtime.Caching;

namespace Midway.Model.Services
{
    public class AuthHandler : DelegatingHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var entry = new AuthCacheEntry();
            CookieHeaderValue cookie = request.Headers.GetCookies(entry.CookieName).FirstOrDefault();
            if (cookie != null)
            {
                string cookieVal = cookie[entry.CookieName].Value;

                string [ ] vals = cookieVal.Split(':'); // PlayerId, then token issued at login
                ObjectCache cache = MemoryCache.Default;
                var extEntry = (AuthCacheEntry)cache.Get(vals[1]);

                if (extEntry != null)
                {
                    // re-up the cache entry
                    var dateTime = DateTime.Now.AddHours(extEntry.ExpirationHours);
                    cache.Set(vals[1], extEntry, new DateTimeOffset(dateTime));

                    // set identity
                    var identity = new GenericIdentity(vals[0], "Token");
                    var principal = new GenericPrincipal(identity, new [ ] { extEntry.Role });
                    Thread.CurrentPrincipal = principal;
                    if (HttpContext.Current != null)
                    {
                        HttpContext.Current.User = principal;
                    }
                }
            }

            return base.SendAsync(request, cancellationToken);
        }
    }
}