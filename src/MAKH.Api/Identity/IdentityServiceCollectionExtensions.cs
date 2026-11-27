using System.Security.Cryptography.X509Certificates;
using MAKH.Application.Security;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.IdentityAccount;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace MAKH.Api.Identity;

public static class IdentityServiceCollectionExtensions
{
    public const string SessionCookieName = "__Host-makh-session";

    public static IServiceCollection AddMakhIdentity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<IdentityOptions>()
            .Bind(configuration.GetSection(IdentityOptions.SectionName))
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<IdentityOptions>, IdentityOptionsValidator>();
        services.AddOptions<ServerDataProtectionOptions>()
            .Bind(configuration.GetSection(ServerDataProtectionOptions.SectionName))
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<ServerDataProtectionOptions>, ServerDataProtectionOptionsValidator>();

        var protectionOptions = configuration.GetSection(ServerDataProtectionOptions.SectionName)
            .Get<ServerDataProtectionOptions>() ?? new ServerDataProtectionOptions();
        var protection = services.AddDataProtection().SetApplicationName("MAKH.Trading");
        if (!string.IsNullOrWhiteSpace(protectionOptions.KeyRingPath))
        {
            protection.PersistKeysToFileSystem(new DirectoryInfo(protectionOptions.KeyRingPath));
        }

        if (!string.IsNullOrWhiteSpace(protectionOptions.CertificatePath))
        {
            var certificate = X509CertificateLoader.LoadPkcs12FromFile(
                protectionOptions.CertificatePath,
                protectionOptions.CertificatePassword,
                X509KeyStorageFlags.EphemeralKeySet);
            protection.ProtectKeysWithCertificate(certificate);
        }
        services.AddSingleton<IServerSessionRegistry, PostgresServerSessionRegistry>();
        services.AddSingleton<DistributedCacheTicketStore>();
        services.AddSingleton<IAuthorizationHandler, FreshMfaHandler>();
        services.AddSingleton(TimeProvider.System);
        services.AddDbContextFactory<PlatformDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Platform")
            ?? "Host=localhost;Database=makh_identity_disabled;Username=makh_runtime"));
        services.AddScoped<IPersistedIdentityResolver, PostgresPersistedIdentityResolver>();
        services.AddScoped<OidcPersistedIdentityClaimsMapper>();

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignOutScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                options.Cookie.Name = SessionCookieName;
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.Path = "/";
                options.SlidingExpiration = true;
                var identity = configuration.GetSection(IdentityOptions.SectionName).Get<IdentityOptions>()
                    ?? new IdentityOptions();
                options.ExpireTimeSpan = TimeSpan.FromMinutes(identity.IdleMinutes);
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            })
            .AddOpenIdConnect(options =>
            {
                var identity = configuration.GetSection(IdentityOptions.SectionName).Get<IdentityOptions>()
                    ?? new IdentityOptions();
                options.Authority = identity.Enabled ? identity.Authority : "https://identity.invalid";
                options.ClientId = identity.Enabled ? identity.ClientId : "disabled";
                options.ClientSecret = identity.Enabled ? identity.ClientSecret : "disabled";
                options.RequireHttpsMetadata = true;
                options.ResponseType = OpenIdConnectResponseType.Code;
                options.UsePkce = true;
                options.SaveTokens = false;
                options.GetClaimsFromUserInfoEndpoint = true;
                options.MapInboundClaims = false;
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.Scope.Clear();
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("offline_access");
                options.TokenValidationParameters.NameClaimType = "name";
                options.TokenValidationParameters.RoleClaimType = PlatformClaims.Role;
                options.Events.OnTokenValidated = async context =>
                {
                    var mapper = context.HttpContext.RequestServices
                        .GetRequiredService<OidcPersistedIdentityClaimsMapper>();
                    var issuer = context.SecurityToken?.Issuer ?? string.Empty;
                    if (context.Principal is null
                        || !await mapper.MapAsync(
                            context.Principal,
                            issuer,
                            context.HttpContext.RequestAborted))
                    {
                        context.Fail("Authenticated identity has no unique active paper-account entitlement.");
                    }
                };
            });

        services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
            .PostConfigure<DistributedCacheTicketStore>((options, store) => options.SessionStore = store);

        var identityOptions = configuration.GetSection(IdentityOptions.SectionName).Get<IdentityOptions>()
            ?? new IdentityOptions();
        var freshMfa = new FreshMfaRequirement(TimeSpan.FromMinutes(identityOptions.FreshMfaMinutes));

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
            .AddPolicy(AuthorizationPolicies.PortalAccess, policy =>
                policy.RequireAuthenticatedUser()
                    .RequireClaim(PlatformClaims.Subject)
                    .RequireClaim(PlatformClaims.AccountId))
            .AddPolicy(AuthorizationPolicies.PaperTrading, policy =>
                policy.RequireAuthenticatedUser().RequireClaim(PlatformClaims.AccountMode, "paper"))
            .AddPolicy(AuthorizationPolicies.FreshMfa, policy =>
                policy.RequireAuthenticatedUser().AddRequirements(freshMfa))
            .AddPolicy(AuthorizationPolicies.RiskAdministration, policy =>
                policy.RequireAuthenticatedUser()
                    .RequireRole(PlatformRoles.RiskAdministrator)
                    .AddRequirements(freshMfa))
            .AddPolicy(AuthorizationPolicies.LiveTrading, policy =>
                policy.RequireAuthenticatedUser()
                    .RequireRole(PlatformRoles.Trader)
                    .RequireClaim(PlatformClaims.AccountMode, "live")
                    .AddRequirements(freshMfa));

        services.AddAntiforgery(options =>
        {
            options.Cookie.Name = "__Host-makh-csrf";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.HeaderName = "X-CSRF-TOKEN";
        });

        return services;
    }
}
