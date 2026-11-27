using System.Net.Mail;

namespace MAKH.Infrastructure.Evidence;

public sealed record SecFairAccessPolicy
{
    private static readonly TimeSpan MaximumRetryDelay = TimeSpan.FromMinutes(5);

    public SecFairAccessPolicy(
        string productName,
        string contactEmail,
        int requestsPerSecond = 8,
        int maximumConcurrency = 2)
    {
        ProductName = Required(productName, nameof(productName), 80);
        ContactEmail = ValidEmail(contactEmail);
        if (requestsPerSecond is < 1 or > 10)
            throw new ArgumentOutOfRangeException(nameof(requestsPerSecond), "SEC request rate must be between 1 and 10 requests per second.");
        if (maximumConcurrency is < 1 or > 2)
            throw new ArgumentOutOfRangeException(nameof(maximumConcurrency), "SEC concurrency must be one or two requests.");
        RequestsPerSecond = requestsPerSecond;
        MaximumConcurrency = maximumConcurrency;
    }

    public string ProductName { get; }
    public string ContactEmail { get; }
    public int RequestsPerSecond { get; }
    public int MaximumConcurrency { get; }
    public string UserAgent => $"{ProductName} {ContactEmail}";
    public TimeSpan MinimumRequestInterval => TimeSpan.FromSeconds(1d / RequestsPerSecond);

    public static void EnsureAllowedEndpoint(Uri endpoint)
    {
        ArgumentNullException.ThrowIfNull(endpoint);
        var host = endpoint.IdnHost;
        if (!endpoint.IsAbsoluteUri || endpoint.Scheme != Uri.UriSchemeHttps ||
            !(host.Equals("sec.gov", StringComparison.OrdinalIgnoreCase) ||
              host.EndsWith(".sec.gov", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("SEC retrieval is restricted to HTTPS sec.gov endpoints.");
    }

    public static TimeSpan GetRetryDelay(int attempt, TimeSpan? serverRetryAfter = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(attempt);
        var exponent = Math.Min(attempt, 8);
        var calculated = TimeSpan.FromSeconds(Math.Pow(2, exponent));
        var requested = serverRetryAfter is { } retryAfter && retryAfter > calculated
            ? retryAfter
            : calculated;
        return requested > MaximumRetryDelay ? MaximumRetryDelay : requested;
    }

    private static string Required(string value, string parameterName, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException("Value is required.", parameterName);
        var result = value.Trim();
        if (result.Length > maximumLength || result.Any(char.IsControl))
            throw new ArgumentException("Value contains unsupported characters or exceeds its limit.", parameterName);
        return result;
    }

    private static string ValidEmail(string value)
    {
        var email = Required(value, nameof(value), 254);
        try
        {
            var parsed = new MailAddress(email);
            if (!string.Equals(parsed.Address, email, StringComparison.OrdinalIgnoreCase))
                throw new FormatException();
        }
        catch (FormatException)
        {
            throw new ArgumentException("A valid contact email is required.", nameof(value));
        }
        return email;
    }
}
