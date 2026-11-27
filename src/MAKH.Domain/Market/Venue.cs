namespace MAKH.Domain.Market;

public sealed record Venue
{
    public Venue(string mic, string name, string timeZoneId, bool isApprovedForMvp)
    {
        Mic = RequireCode(mic, 4, nameof(mic));
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Venue name is required.", nameof(name)) : name.Trim();
        TimeZoneId = string.IsNullOrWhiteSpace(timeZoneId) ? throw new ArgumentException("Venue timezone is required.", nameof(timeZoneId)) : timeZoneId.Trim();
        IsApprovedForMvp = isApprovedForMvp;
    }

    public string Mic { get; }
    public string Name { get; }
    public string TimeZoneId { get; }
    public bool IsApprovedForMvp { get; }

    private static string RequireCode(string value, int length, string parameter)
    {
        var normalized = value?.Trim().ToUpperInvariant();
        if (normalized is null || normalized.Length != length || !normalized.All(char.IsAsciiLetterOrDigit))
            throw new ArgumentException($"{parameter} must be a {length}-character alphanumeric code.", parameter);
        return normalized;
    }
}
