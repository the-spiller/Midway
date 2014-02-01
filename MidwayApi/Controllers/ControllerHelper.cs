using System;
using System.Net;
using System.Net.Http;

namespace MidwayApi.Controllers
{
	public static class ControllerHelper
	{
		public static HttpResponseMessage GenericErrorResponse(Exception ex)
		{
			return new HttpResponseMessage(HttpStatusCode.InternalServerError)
			{
				Content = new StringContent(ex.Message),
				ReasonPhrase = "Server Error"
			};
		}
	}
}