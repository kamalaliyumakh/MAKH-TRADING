using Microsoft.Extensions.Options;

namespace MAKH.Api.Identity;

public sealed class ServerDataProtectionOptionsValidator(IConfiguration configuration)
    : IValidateOptions<ServerDataProtectionOptions>
{
    public ValidateOptionsResult Validate(string? name, ServerDataProtectionOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var identityEnabled = configuration.GetValue<bool>($"{IdentityOptions.SectionName}:Enabled");
        var production = string.Equals(
            configuration["Platform:Environment"], "production", StringComparison.OrdinalIgnoreCase);

        if (!identityEnabled || !production)
        {
            return ValidateOptionsResult.Success;
        }

        if (string.IsNullOrWhiteSpace(options.KeyRingPath) || !Path.IsPathFullyQualified(options.KeyRingPath))
        {
            return ValidateOptionsResult.Fail(
                "Production identity requires an absolute DataProtection:KeyRingPath on durable shared storage.");
        }

        if (string.IsNullOrWhiteSpace(options.CertificatePath)
            || !Path.IsPathFullyQualified(options.CertificatePath)
            || !File.Exists(options.CertificatePath))
        {
            return ValidateOptionsResult.Fail(
                "Production identity requires an existing absolute DataProtection:CertificatePath.");
        }

        if (string.IsNullOrWhiteSpace(options.CertificatePassword))
        {
            return ValidateOptionsResult.Fail(
                "Production identity requires externally supplied DataProtection:CertificatePassword.");
        }

        return ValidateOptionsResult.Success;
    }
}
