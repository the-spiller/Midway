using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Caching;
using System.Web;

namespace Midway.Model.Services
{
    public class MsgCache
    {
        private const string KEY_PREFIX = "msgs_";
        private readonly ObjectCache _cache = MemoryCache.Default;

        public IList<MsgCacheEntry> GetPlayerMessages(string nickname)
        {
            return (List<MsgCacheEntry>)_cache.Get(KEY_PREFIX + nickname);
        }

        public void AddMessage(string recipient, string sender, string body)
        {
            var key = KEY_PREFIX + recipient;
            var cacheMsg = new MsgCacheEntry
            {
                Sender = sender,
                Body = body
            };
            var msgs = GetPlayerMessages(key) ?? new List<MsgCacheEntry>();
            msgs.Add(cacheMsg);
            _cache.Add(key, msgs, DateTime.Now.AddHours(2));
        }

        public void ClearMessages(string nickname)
        {
            _cache.Remove(KEY_PREFIX + nickname);
        }
    }
}