using Microsoft.AspNet.SignalR;

namespace Midway.Hubs
{
    public class ChatHub : Hub
    {
        public void Broadcast(string sender, string message)
        {
            Clients.All.addMessageToChat(sender, message);
        }
    }
}