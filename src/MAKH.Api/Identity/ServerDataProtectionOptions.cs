namespace MAKH.Api.Identity;

public sealed class ServerDataProtectionOptions
{
    public const string SectionName = "DataProtection";

    public string KeyRingPath { get; init; } = string.Empty;

    public string CertificatePath { get; init; } = string.Empty;

    public string CertificatePassword { get; init; } = string.Empty;
}
