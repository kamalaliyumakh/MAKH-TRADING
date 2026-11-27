using Microsoft.Extensions.Options;

namespace MAKH.Api.Identity;

public sealed class IdentityOptionsValidator(IConfiguration configuration) : IValidateOptions<IdentityOptions>
{
    public ValidateOptionsResult Validate(string? name, IdentityOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.IdleMinutes is < 5 or > 60)
        {
            return ValidateOptionsResult.Fail("Identity:IdleMinutes must be between 5 and 60.");
        }

        if (options.AbsoluteMinutes < options.IdleMinutes || options.AbsoluteMinutes > 720)
        {
            return ValidateOptionsResult.Fail("Identity:AbsoluteMinutes must be between IdleMinutes and 720.");
        }

        if (options.FreshMfaMinutes is < 1 or > 30)
        {
            return ValidateOptionsResult.Fail("Identity:FreshMfaMinutes must be between 1 and 30.");
        }

        if (!options.Enabled)
        {
            return ValidateOptionsResult.Success;
        }

        if (!Uri.TryCreate(options.Authority, UriKind.Absolute, out var authority)
            || authority.Scheme != Uri.UriSchemeHttps)
        {
            return ValidateOptionsResult.Fail("Enabled identity requires an HTTPS Identity:Authority.");
        }

        if (string.IsNullOrWhiteSpace(options.ClientId) || string.IsNullOrWhiteSpace(options.ClientSecret))
        {
            return ValidateOptionsResult.Fail("Enabled identity requires externally supplied client credentials.");
        }

        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Platform")))
        {
            return ValidateOptionsResult.Fail(
                "Enabled identity requires ConnectionStrings:Platform for persisted authorization.");
        }

        return ValidateOptionsResult.Success;
    }
}
