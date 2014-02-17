namespace MidwayApi.Models.Services
{
    /**
    *
    * Caesar encode / decode
    *
    **/
    public class Caesar
    {
        private const string KeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        public string Encode(string input, int offset = 0)
        {
            string output = "";

            if (offset == 0) offset = 3;

            for (var i = 0; i < input.Length; i++)
            {
                int charPos = KeyStr.IndexOf(input.Substring(i, 1), System.StringComparison.Ordinal);
                if (charPos > -1)
                {
                    charPos += offset;
                    if (charPos > KeyStr.Length)
                    {
                        charPos = charPos - KeyStr.Length;
                    }
                    output += KeyStr.Substring(charPos, 1);
                }
                else
                {
                    output += input.Substring(i, 1);
                }
            }
            return output;
        }


        public string Decode(string input, int offset = 0) {
            var output = "";

            if (offset == 0) offset = 3;

            for (var i = 0; i < input.Length; i++)
            {
                var charPos = KeyStr.IndexOf(input.Substring(i, 1), System.StringComparison.Ordinal);
                if (charPos > -1)
                {
                    charPos -= offset;
                    if (charPos < 0)
                    {
                        charPos = KeyStr.Length + charPos;
                    }
                    output += KeyStr.Substring(charPos, 1);
                }
                else
                {
                    output += input.Substring(i, 1);
                }
            }
            return output;        
        }
    

    }
}