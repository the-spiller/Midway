using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;
using Midway.Model.Services;

namespace Midway.Controllers
{
    public class MessageController : ApiController
    {
        private readonly MsgCache _msgCache = new MsgCache();

        // GET api/message/id
        public HttpResponseMessage GetMessages(string id)
        {
            var msgs = _msgCache.GetPlayerMessages(id);

            if (msgs == null)
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }

            var resp = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonConvert.SerializeObject(msgs))
                };
            _msgCache.ClearMessages(id);
            return resp;
        }

        // POST api/message (INSERT)
        public HttpResponseMessage PostMessage(string recipient, string sender, string body)
        {
            _msgCache.AddMessage(recipient, sender, body);
            return new HttpResponseMessage(HttpStatusCode.NoContent);
        }
    }
}
