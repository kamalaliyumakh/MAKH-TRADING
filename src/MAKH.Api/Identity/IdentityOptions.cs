namespace MAKH.Api.Identity;

public sealed class IdentityOptions
{
    public const string SectionName = "Identity";

    public bool Enabled { get; init; }

    public string Authority { get; init; } = string.Empty;

    public string ClientId { get; init; } = string.Empty;

    public string ClientSecret { get; init; } = string.Empty;

    public int IdleMinutes { get; init; } = 20;

    public int AbsoluteMinutes { get; init; } = 480;

    public int FreshMfaMinutes { get; init; } = 15;
}
