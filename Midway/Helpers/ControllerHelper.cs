﻿using System;
using System.Net;
using System.Net.Http;

namespace Midway.Helpers
{
	public static class ControllerHelper
	{
		public static HttpResponseMessage GenericErrorResponse(Exception ex, string apiMethod)
		{
			return new HttpResponseMessage(HttpStatusCode.InternalServerError)
			{
				Content = new StringContent(ex.Message),
				ReasonPhrase = "Server Error (" + apiMethod + ")"
			};
		}
	}
}