using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Security.Claims;
using System.Text.Encodings.Web;
using MAKH.Api.Identity;
using MAKH.Api.Observability;
using MAKH.Application.Common.Ports;
using MAKH.Application.Market;
using MAKH.Application.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Xunit;

namespace MAKH.Api.SecurityTests;

public sealed class IdentitySecurityTests
{
    private static readonly Guid TestAccountId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid TestUserId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    [Fact]
    public async Task ReadinessEndpointsRemainAnonymous()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/", UriKind.Relative))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(new Uri("/health", UriKind.Relative))).StatusCode);
    }

    [Fact]
    public async Task SessionEndpointRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri("/api/v1/session", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task ScannerSnapshotRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri($"/api/v1/scanner/runs/{Guid.NewGuid()}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task LatestScannerRecoveryRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri("/api/v1/scanner/snapshot", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task SymbolWorkspaceRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri("/api/v1/symbols/SYNB/workspace", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task AuthenticatedSymbolWorkspaceIsNoStoreAndHasNoAuthority()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync(new Uri("/api/v1/symbols/SYNB/workspace", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("\"dataMode\":\"Synthetic\"", body, StringComparison.Ordinal);
        Assert.Contains("\"createsTradingAuthority\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"canSubmitOrder\":false", body, StringComparison.Ordinal);
        Assert.DoesNotContain("credential", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SymbolWorkspaceRejectsUnsafeAndUnknownSymbols()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        Assert.Equal(HttpStatusCode.BadRequest,
            (await client.GetAsync(new Uri("/api/v1/symbols/BAD_SYMBOL/workspace", UriKind.Relative))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await client.GetAsync(new Uri("/api/v1/symbols/NOPE/workspace", UriKind.Relative))).StatusCode);
    }

    [Fact]
    public async Task DashboardRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri("/api/v1/dashboard", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task AuthenticatedDashboardIsNoStoreAccountScopedAndNonAuthoritative()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync(new Uri("/api/v1/dashboard", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains(TestAccountId.ToString(), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("\"dataMode\":\"Synthetic\"", body, StringComparison.Ordinal);
        Assert.Contains("\"reconciledBrokerTruth\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"createsTradingAuthority\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"canSubmitOrder\":false", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task JournalRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri("/api/v1/journal", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task AuthenticatedJournalIsNoStoreUserScopedReadOnlyAndNonAuthoritative()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        var response = await client.GetAsync(new Uri("/api/v1/journal", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains(TestAccountId.ToString("D"), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(TestUserId.ToString("D"), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("\"dataMode\":\"Synthetic\"", body, StringComparison.Ordinal);
        Assert.Contains("\"containsPersonalNotes\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"isReadOnly\":true", body, StringComparison.Ordinal);
        Assert.Contains("\"createsTradingAuthority\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"canChangeRisk\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"canSubmitOrder\":false", body, StringComparison.Ordinal);
        Assert.DoesNotContain("credential", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TradingHubNegotiationRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
        });

        var response = await client.PostAsync(
            new Uri("/hubs/trading-v1/negotiate?negotiateVersion=1", UriKind.Relative),
            content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task AuthenticatedOwnerCanNegotiateCommandFreeTradingHub()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
        });

        var response = await client.PostAsync(
            new Uri("/hubs/trading-v1/negotiate?negotiateVersion=1", UriKind.Relative),
            content: null);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("connectionToken", body, StringComparison.Ordinal);
        Assert.DoesNotContain("order", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("broker", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AuthenticatedOwnerCanReadPersistedScannerEvidence()
    {
        var run = ScannerRun() with { AccountId = TestAccountId, StreamSequence = 12 };
        await using var factory = CreateAuthenticatedFactory(run);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/scanner/runs/{run.Id}", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains(run.InputSnapshotHash, body, StringComparison.Ordinal);
        Assert.Contains("\"streamSequence\":12", body, StringComparison.Ordinal);
        Assert.Contains("TRKA", body, StringComparison.Ordinal);
        Assert.DoesNotContain("order", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("broker", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AuthenticatedOwnerCanRecoverLatestSequencedScannerSnapshot()
    {
        var run = ScannerRun() with { AccountId = TestAccountId, StreamSequence = 12 };
        await using var factory = CreateAuthenticatedFactory(run);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri("/api/v1/scanner/snapshot", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("\"streamSequence\":12", body, StringComparison.Ordinal);
        Assert.Contains(run.InputSnapshotHash, body, StringComparison.Ordinal);
        Assert.DoesNotContain("order", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task LegacyUnsequencedRunIsNotARecoverySnapshot()
    {
        var run = ScannerRun() with { AccountId = TestAccountId };
        await using var factory = CreateAuthenticatedFactory(run);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri("/api/v1/scanner/snapshot", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task OtherAccountSequencedRunIsNotARecoverySnapshot()
    {
        var run = ScannerRun() with { AccountId = Guid.NewGuid(), StreamSequence = 12 };
        await using var factory = CreateAuthenticatedFactory(run);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri("/api/v1/scanner/snapshot", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.DoesNotContain(run.InputSnapshotHash, body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task OtherAccountCannotReadScannerRun()
    {
        var run = ScannerRun() with { AccountId = Guid.NewGuid() };
        await using var factory = CreateAuthenticatedFactory(run);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/scanner/runs/{run.Id}", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.DoesNotContain(run.InputSnapshotHash, body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task LegacyUnscopedScannerRunCannotBeRead()
    {
        var run = ScannerRun();
        await using var factory = CreateAuthenticatedFactory(run);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/scanner/runs/{run.Id}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task MissingScannerSnapshotRemainsNotFoundWithOwnerScope()
    {
        await using var factory = CreateAuthenticatedFactory(scannerRun: null);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/scanner/runs/{Guid.NewGuid()}", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task AuthenticatedSessionReturnsOnlyNormalizedPlatformClaims()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri("/api/v1/session", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains(TestUserId.ToString("D"), body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("paper", body, StringComparison.Ordinal);
        Assert.Contains(TestAccountId.ToString("D"), body, StringComparison.Ordinal);
        Assert.DoesNotContain("access_token", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task LoginFailsClosedWhenProviderIsDisabled()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/auth/login", UriKind.Relative));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task ResponsesCarryGeneratedCorrelationIdentifier()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(new Uri("/health", UriKind.Relative));

        Assert.True(response.Headers.TryGetValues(CorrelationIdMiddleware.HeaderName, out var values));
        Assert.False(string.IsNullOrWhiteSpace(Assert.Single(values)));
    }

    [Fact]
    public async Task BoundedCallerCorrelationIdentifierIsPreserved()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri("/health", UriKind.Relative));
        request.Headers.Add(CorrelationIdMiddleware.HeaderName, "synthetic-test-correlation");

        var response = await client.SendAsync(request);

        Assert.Equal("synthetic-test-correlation", response.Headers.GetValues(CorrelationIdMiddleware.HeaderName).Single());
    }

    [Fact]
    public async Task LogoutRejectsMissingAntiforgeryToken()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.PostAsync(new Uri("/auth/logout", UriKind.Relative), content: null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RiskStateRejectsAnonymousRequests()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync(new Uri($"/api/v1/risk/accounts/{Guid.NewGuid()}/state", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task OwnerCannotAccessRiskAdministratorContainmentPreview()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
        using var content = JsonContent.Create(new
        {
            commandId = Guid.NewGuid(),
            accountId = Guid.NewGuid(),
            action = "BlockEntries",
            expectedPolicyVersion = "policy-v1",
            reason = "synthetic containment review",
            correlationId = "corr-1",
        });

        var response = await client.PostAsync(new Uri("/api/v1/risk/containment/preview", UriKind.Relative), content);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedOwnerCanReadOnlyFailClosedRiskOverview()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/risk/accounts/{TestAccountId}/overview", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("\"entryLocked\":true", body, StringComparison.Ordinal);
        Assert.Contains("\"reconciliationHealthy\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"canMutateRisk\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"createsTradingAuthority\":false", body, StringComparison.Ordinal);
        Assert.DoesNotContain("token", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AuthenticatedOwnerCannotReadAnotherAccountsRiskOverview()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/risk/accounts/{Guid.NewGuid()}/overview", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task AuthenticatedPaperOwnerCanReadOnlyAccountBoundTradingOverview()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/trading/accounts/{TestAccountId}/overview", UriKind.Relative));
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("\"entryLocked\":true", body, StringComparison.Ordinal);
        Assert.Contains("\"isAuthoritative\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"canSubmit\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"createsTradingAuthority\":false", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task TradingOverviewDeniesAnotherAccount()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });

        var response = await client.GetAsync(new Uri($"/api/v1/trading/accounts/{Guid.NewGuid()}/overview", UriKind.Relative));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task PaperOrderReviewIsAntiforgeryProtectedAndNonExecutable()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var csrf = await client.GetFromJsonAsync<CsrfResponse>(new Uri("/auth/csrf", UriKind.Relative));
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri("/api/v1/trading/orders/review", UriKind.Relative))
        {
            Content = JsonContent.Create(new
            {
                requestId = Guid.NewGuid(),
                accountId = TestAccountId,
                symbol = "SYNB",
                side = "Buy",
                quantity = 100,
                limitPrice = 5.25m,
                stopPrice = 4.75m
            }),
        };
        request.Headers.Add("X-CSRF-TOKEN", csrf!.Token);

        var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("\"estimatedNotional\":525", body, StringComparison.Ordinal);
        Assert.Contains("\"expiresAt\":", body, StringComparison.Ordinal);
        Assert.Contains("\"canSubmit\":false", body, StringComparison.Ordinal);
        Assert.Contains("\"mutatesTradingState\":false", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PaperOrderReviewDeniesCrossAccountBeforeCsrf()
    {
        await using var factory = CreateAuthenticatedFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        using var content = JsonContent.Create(new
        {
            requestId = Guid.NewGuid(),
            accountId = Guid.NewGuid(),
            symbol = "SYNB",
            side = "Buy",
            quantity = 100,
            limitPrice = 5.25m,
            stopPrice = 4.75m
        });

        var response = await client.PostAsync(new Uri("/api/v1/trading/orders/review", UriKind.Relative), content);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task ContainmentPreviewRejectsStalePolicyBeforeExecution()
    {
        await using var factory = CreateRiskAdministratorFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
        var csrf = await client.GetFromJsonAsync<CsrfResponse>(new Uri("/auth/csrf", UriKind.Relative));
        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri("/api/v1/risk/containment/preview", UriKind.Relative))
        {
            Content = JsonContent.Create(new
            {
                commandId = Guid.NewGuid(),
                accountId = TestAccountId,
                action = 0,
                expectedPolicyVersion = "stale-policy",
                reason = "Synthetic stale policy verification",
                correlationId = "stale-policy-test",
            }),
        };
        request.Headers.Add("X-CSRF-TOKEN", csrf!.Token);

        var response = await client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains("stale_policy_version", body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task CookieSessionIsHostScopedSecureHttpOnlyAndServerSide()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var options = factory.Services
            .GetRequiredService<IOptionsMonitor<CookieAuthenticationOptions>>()
            .Get(CookieAuthenticationDefaults.AuthenticationScheme);

        Assert.Equal(MAKH.Api.Identity.IdentityServiceCollectionExtensions.SessionCookieName, options.Cookie.Name);
        Assert.True(options.Cookie.HttpOnly);
        Assert.Equal(CookieSecurePolicy.Always, options.Cookie.SecurePolicy);
        Assert.Equal(SameSiteMode.Lax, options.Cookie.SameSite);
        Assert.Equal(TimeSpan.FromMinutes(20), options.ExpireTimeSpan);
        Assert.NotNull(options.SessionStore);
    }

    [Fact]
    public async Task OidcUsesCodePkceAndDoesNotSaveProviderTokensInCookie()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var options = factory.Services
            .GetRequiredService<IOptionsMonitor<OpenIdConnectOptions>>()
            .Get(OpenIdConnectDefaults.AuthenticationScheme);

        Assert.Equal(OpenIdConnectResponseType.Code, options.ResponseType);
        Assert.True(options.UsePkce);
        Assert.False(options.SaveTokens);
        Assert.False(options.MapInboundClaims);
        Assert.True(options.RequireHttpsMetadata);
        Assert.NotNull(options.Events.OnTokenValidated);
    }

    [Fact]
    public void EnabledIdentityRequiresPersistedAuthorizationConnection()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var validator = new IdentityOptionsValidator(configuration);

        var result = validator.Validate(null, new IdentityOptions
        {
            Enabled = true,
            Authority = "https://identity.example.com",
            ClientId = "synthetic-client",
            ClientSecret = "fixture",
        });

        Assert.True(result.Failed);
        Assert.Contains("ConnectionStrings:Platform", Assert.Single(result.Failures));
    }

    [Fact]
    public void ProductionIdentityRequiresDurableProtectedKeyRingConfiguration()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Platform:Environment"] = "production",
            ["Identity:Enabled"] = "true",
        }).Build();

        var result = new ServerDataProtectionOptionsValidator(configuration)
            .Validate(null, new ServerDataProtectionOptions());

        Assert.True(result.Failed);
        Assert.Contains("KeyRingPath", Assert.Single(result.Failures));
    }

    [Fact]
    public void DisabledLocalIdentityDoesNotRequireProductionKeyMaterial()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Platform:Environment"] = "local",
            ["Identity:Enabled"] = "false",
        }).Build();

        var result = new ServerDataProtectionOptionsValidator(configuration)
            .Validate(null, new ServerDataProtectionOptions());

        Assert.True(result.Succeeded);
    }

    [Fact]
    public async Task PersistedIdentityMappingReplacesProviderAuthorizationClaims()
    {
        var userId = Guid.Parse("00000000-0000-0000-0000-000000000020");
        var accountId = Guid.Parse("00000000-0000-0000-0000-000000000021");
        var now = new DateTimeOffset(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);
        var resolver = new StubIdentityResolver(new PersistedIdentityResolution(
            userId,
            accountId,
            "paper",
            [PlatformRoles.Trader, PlatformRoles.RiskAdministrator]));
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(PlatformClaims.Subject, "provider-subject"),
                new Claim(PlatformClaims.Role, PlatformRoles.Owner),
                new Claim(PlatformClaims.AccountId, Guid.NewGuid().ToString("D")),
                new Claim(PlatformClaims.AccountMode, "live"),
                new Claim(PlatformClaims.AuthenticationMethod, "mfa"),
            ],
            "oidc",
            "name",
            PlatformClaims.Role));

        var mapped = await new OidcPersistedIdentityClaimsMapper(resolver, new FixedTimeProvider(now))
            .MapAsync(principal, "https://identity.example.com/tenant");

        Assert.True(mapped);
        Assert.Equal(userId.ToString("D"), principal.FindFirstValue(PlatformClaims.Subject));
        Assert.Equal(accountId.ToString("D"), principal.FindFirstValue(PlatformClaims.AccountId));
        Assert.Equal("paper", principal.FindFirstValue(PlatformClaims.AccountMode));
        Assert.True(Guid.TryParse(principal.FindFirstValue(PlatformClaims.SessionId), out _));
        Assert.Equal(
            [PlatformRoles.Trader, PlatformRoles.RiskAdministrator],
            principal.FindAll(PlatformClaims.Role).Select(claim => claim.Value));
        Assert.DoesNotContain(principal.Claims, claim => claim.Value == PlatformRoles.Owner || claim.Value == "live");
        Assert.Equal("mfa", principal.FindFirstValue(PlatformClaims.AuthenticationMethod));
        Assert.Equal("provider-subject", resolver.Subject);
        Assert.Equal("https://identity.example.com/tenant", resolver.Issuer);
        Assert.Equal(now, resolver.AuthenticatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task PersistedIdentityMappingFailsClosedWithoutProviderSubject(string? subject)
    {
        var claims = subject is null
            ? Array.Empty<Claim>()
            : [new Claim(PlatformClaims.Subject, subject)];
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "oidc"));
        var resolver = new StubIdentityResolver(null);

        var mapped = await new OidcPersistedIdentityClaimsMapper(resolver, TimeProvider.System)
            .MapAsync(principal, "https://identity.example.com");

        Assert.False(mapped);
        Assert.Equal(0, resolver.Calls);
    }

    [Fact]
    public async Task PersistedIdentityMappingFailsClosedWhenDatabaseResolutionRejectsAccess()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(PlatformClaims.Subject, "provider-subject")],
            "oidc"));
        var resolver = new StubIdentityResolver(null);

        var mapped = await new OidcPersistedIdentityClaimsMapper(resolver, TimeProvider.System)
            .MapAsync(principal, "https://identity.example.com");

        Assert.False(mapped);
        Assert.Equal(1, resolver.Calls);
    }

    [Fact]
    public async Task TicketStoreRejectsARevokedServerSessionAndRemovesItsTicket()
    {
        var now = new DateTimeOffset(2026, 8, 27, 10, 0, 0, TimeSpan.Zero);
        var clock = new FixedClock(now);
        var registry = new TestServerSessionRegistry();
        var store = new DistributedCacheTicketStore(
            Options.Create(new IdentityOptions()),
            clock,
            registry,
            new EphemeralDataProtectionProvider());
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(PlatformClaims.Subject, userId.ToString("D")),
                new Claim(PlatformClaims.SessionId, sessionId.ToString("D")),
            ],
            "oidc"));
        var ticket = new AuthenticationTicket(
            principal,
            new AuthenticationProperties { IssuedUtc = now },
            CookieAuthenticationDefaults.AuthenticationScheme);

        var key = await store.StoreAsync(ticket);
        Assert.NotNull(await store.RetrieveAsync(key));

        Assert.True(await registry.RevokeAsync(sessionId, userId, now.AddMinutes(1)));
        Assert.Null(await store.RetrieveAsync(key));
        Assert.Null(await registry.RetrieveTicketAsync(TestServerSessionRegistry.Hash(key), now.AddMinutes(2)));
    }

    [Fact]
    public async Task SessionRegistryScopesInventoryAndRevocationToTheOwningUser()
    {
        var now = new DateTimeOffset(2026, 8, 27, 10, 0, 0, TimeSpan.Zero);
        var registry = new TestServerSessionRegistry();
        var owner = Guid.NewGuid();
        var otherUser = Guid.NewGuid();
        var ownerSession = Guid.NewGuid();
        var otherSession = Guid.NewGuid();
        await registry.RegisterAsync(ownerSession, owner, now, now.AddHours(8), new byte[32], [1]);
        await registry.RegisterAsync(otherSession, otherUser, now, now.AddHours(8), Enumerable.Repeat((byte)1, 32).ToArray(), [2]);

        Assert.Equal(ownerSession, Assert.Single(await registry.ListAsync(owner, now)).SessionId);
        Assert.False(await registry.RevokeAsync(ownerSession, otherUser, now.AddMinutes(1)));
        Assert.True(await registry.IsActiveAsync(ownerSession, owner, now.AddMinutes(2)));
        Assert.True(await registry.RevokeAsync(ownerSession, owner, now.AddMinutes(3)));
        Assert.True(Assert.Single(await registry.ListAsync(owner, now.AddMinutes(4))).Revoked);
    }

    [Fact]
    public async Task TicketStoreFailsClosedWithoutNormalizedSessionIdentity()
    {
        var now = new DateTimeOffset(2026, 8, 27, 10, 0, 0, TimeSpan.Zero);
        var store = new DistributedCacheTicketStore(
            Options.Create(new IdentityOptions()),
            new FixedClock(now),
            new TestServerSessionRegistry(),
            new EphemeralDataProtectionProvider());
        var ticket = new AuthenticationTicket(
            new ClaimsPrincipal(new ClaimsIdentity([new Claim(PlatformClaims.Subject, Guid.NewGuid().ToString("D"))], "oidc")),
            new AuthenticationProperties { IssuedUtc = now },
            CookieAuthenticationDefaults.AuthenticationScheme);

        await Assert.ThrowsAsync<InvalidOperationException>(() => store.StoreAsync(ticket));
    }

    [Theory]
    [InlineData(5, true)]
    [InlineData(16, false)]
    public async Task FreshMfaRequirementEnforcesAuthenticationAge(int ageMinutes, bool expectedSuccess)
    {
        var now = new DateTimeOffset(2026, 8, 12, 12, 0, 0, TimeSpan.Zero);
        var requirement = new FreshMfaRequirement(TimeSpan.FromMinutes(15));
        var principal = CreatePrincipal(now.AddMinutes(-ageMinutes));
        var context = new AuthorizationHandlerContext([requirement], principal, resource: null);
        var handler = new FreshMfaHandler(new FixedClock(now));

        await handler.HandleAsync(context);

        Assert.Equal(expectedSuccess, context.HasSucceeded);
    }

    [Fact]
    public async Task FreshMfaRequirementRejectsPasswordOnlyAuthentication()
    {
        var now = new DateTimeOffset(2026, 8, 12, 12, 0, 0, TimeSpan.Zero);
        var identity = new ClaimsIdentity(
            [
                new Claim(PlatformClaims.AuthenticationMethod, "pwd"),
                new Claim(PlatformClaims.AuthenticationTime, now.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture)),
            ],
            "test");
        var requirement = new FreshMfaRequirement(TimeSpan.FromMinutes(15));
        var context = new AuthorizationHandlerContext(
            [requirement],
            new ClaimsPrincipal(identity),
            resource: null);

        await new FreshMfaHandler(new FixedClock(now)).HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    private static WebApplicationFactory<Program> CreateAuthenticatedFactory(ScannerRun? scannerRun = null) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication(options =>
                    {
                        options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                        options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
                    })
                    .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                        TestAuthenticationHandler.SchemeName,
                        _ => { });
                services.RemoveAll<IScannerRunRepository>();
                services.AddSingleton<IScannerRunRepository>(new StubScannerRunRepository(scannerRun));
            }));

    private static ScannerRun ScannerRun() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "dddddddddddddddddddddddddddddddd:1",
        new DateTimeOffset(2026, 9, 11, 14, 30, 0, TimeSpan.Zero),
        new string('a', 64),
        ScannerDataQuality.Complete,
        [new(Guid.Parse("22222222-2222-2222-2222-222222222222"), "TRKA", 1, true, true,
            4.72m, 98.21m, 8.4m, 420_000, 1.2m, 1_982_400m, string.Empty)]);

    private sealed class StubScannerRunRepository(ScannerRun? run) : IScannerRunRepository
    {
        public ScannerRun? Find(Guid runId, Guid accountId) =>
            run?.Id == runId && run.AccountId == accountId ? run : null;

        public ScannerRun? FindLatest(Guid accountId) =>
            run?.AccountId == accountId && run.StreamSequence is not null ? run : null;

        public void Add(ScannerRun scannerRun) => throw new NotSupportedException();
    }

    private static WebApplicationFactory<Program> CreateRiskAdministratorFactory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication(options =>
                    {
                        options.DefaultAuthenticateScheme = RiskAdministratorAuthenticationHandler.SchemeName;
                        options.DefaultChallengeScheme = RiskAdministratorAuthenticationHandler.SchemeName;
                    })
                    .AddScheme<AuthenticationSchemeOptions, RiskAdministratorAuthenticationHandler>(
                        RiskAdministratorAuthenticationHandler.SchemeName,
                        _ => { });
            }));

    private static ClaimsPrincipal CreatePrincipal(DateTimeOffset authenticatedAt)
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(PlatformClaims.Subject, TestUserId.ToString("D")),
                new Claim(PlatformClaims.Role, PlatformRoles.Owner),
                new Claim(PlatformClaims.AccountMode, "paper"),
                new Claim(PlatformClaims.AccountId, TestAccountId.ToString("D")),
                new Claim(PlatformClaims.AuthenticationMethod, "mfa"),
                new Claim(PlatformClaims.AuthenticationTime, authenticatedAt.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture)),
            ],
            "test",
            nameType: "name",
            roleType: PlatformClaims.Role);
        return new ClaimsPrincipal(identity);
    }

    private sealed class FixedClock(DateTimeOffset utcNow) : IClock
    {
        public DateTimeOffset UtcNow { get; } = utcNow;
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class StubIdentityResolver(PersistedIdentityResolution? resolution)
        : IPersistedIdentityResolver
    {
        public int Calls { get; private set; }
        public string? Issuer { get; private set; }
        public string? Subject { get; private set; }
        public DateTimeOffset? AuthenticatedAt { get; private set; }

        public Task<PersistedIdentityResolution?> ResolveAsync(
            string issuer,
            string subject,
            DateTimeOffset authenticatedAt,
            CancellationToken cancellationToken = default)
        {
            Calls++;
            Issuer = issuer;
            Subject = subject;
            AuthenticatedAt = authenticatedAt;
            return Task.FromResult(resolution);
        }
    }

    private sealed class TestServerSessionRegistry : IServerSessionRegistry
    {
        private readonly ConcurrentDictionary<Guid, ServerSessionView> sessions = new();
        private readonly ConcurrentDictionary<string, ProtectedServerTicket> tickets = new();

        public static byte[] Hash(string key) => System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(key));

        public Task RegisterAsync(Guid sessionId, Guid userId, DateTimeOffset issuedAt,
            DateTimeOffset expiresAt, byte[] ticketKeyHash, byte[] protectedTicket,
            CancellationToken cancellationToken = default)
        {
            if (!sessions.TryAdd(sessionId,
                    new ServerSessionView(sessionId, userId, issuedAt, issuedAt, expiresAt, false)))
                throw new InvalidOperationException("Duplicate session.");
            tickets[Convert.ToHexString(ticketKeyHash)] = new ProtectedServerTicket(sessionId, userId, [.. protectedTicket]);
            return Task.CompletedTask;
        }

        public Task<ProtectedServerTicket?> RetrieveTicketAsync(byte[] ticketKeyHash, DateTimeOffset checkedAt,
            CancellationToken cancellationToken = default)
        {
            tickets.TryGetValue(Convert.ToHexString(ticketKeyHash), out var ticket);
            if (ticket is null || !sessions.TryGetValue(ticket.SessionId, out var session) || session.Revoked || checkedAt >= session.ExpiresAt)
                return Task.FromResult<ProtectedServerTicket?>(null);
            return Task.FromResult<ProtectedServerTicket?>(ticket);
        }

        public Task<bool> RenewTicketAsync(byte[] ticketKeyHash, byte[] protectedTicket, DateTimeOffset seenAt,
            CancellationToken cancellationToken = default)
        {
            var key = Convert.ToHexString(ticketKeyHash);
            if (!tickets.TryGetValue(key, out var ticket) || !sessions.TryGetValue(ticket.SessionId, out var session)
                || session.Revoked || seenAt >= session.ExpiresAt) return Task.FromResult(false);
            tickets[key] = ticket with { Payload = [.. protectedTicket] };
            return Task.FromResult(true);
        }

        public Task RevokeByTicketKeyAsync(byte[] ticketKeyHash, DateTimeOffset revokedAt,
            CancellationToken cancellationToken = default)
        {
            var key = Convert.ToHexString(ticketKeyHash);
            if (tickets.TryGetValue(key, out var ticket) && sessions.TryGetValue(ticket.SessionId, out var session))
                sessions[ticket.SessionId] = session with { Revoked = true };
            return Task.CompletedTask;
        }

        public Task<bool> IsActiveAsync(Guid sessionId, Guid userId, DateTimeOffset checkedAt,
            CancellationToken cancellationToken = default) => Task.FromResult(
            sessions.TryGetValue(sessionId, out var session) && session.UserId == userId
            && !session.Revoked && checkedAt < session.ExpiresAt);

        public Task TouchAsync(Guid sessionId, Guid userId, DateTimeOffset seenAt,
            CancellationToken cancellationToken = default)
        {
            sessions.AddOrUpdate(sessionId,
                _ => throw new InvalidOperationException("Unknown session."),
                (_, session) => session.UserId != userId ? session : session with { LastSeenAt = seenAt });
            return Task.CompletedTask;
        }

        public Task<bool> RevokeAsync(Guid sessionId, Guid userId, DateTimeOffset revokedAt,
            CancellationToken cancellationToken = default)
        {
            if (!sessions.TryGetValue(sessionId, out var session) || session.UserId != userId || session.Revoked)
                return Task.FromResult(false);
            sessions[sessionId] = session with { Revoked = true };
            return Task.FromResult(true);
        }

        public Task<IReadOnlyCollection<ServerSessionView>> ListAsync(Guid userId,
            DateTimeOffset checkedAt, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyCollection<ServerSessionView>>(
            sessions.Values.Where(session => session.UserId == userId)
                .Select(session => session with { Revoked = session.Revoked || checkedAt >= session.ExpiresAt })
                .ToArray());
    }

    private sealed record CsrfResponse(string Token);

    private sealed class TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string SchemeName = "Test";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var principal = CreatePrincipal(DateTimeOffset.UtcNow);
            var ticket = new AuthenticationTicket(principal, SchemeName);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }

    private sealed class RiskAdministratorAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string SchemeName = "RiskAdministratorTest";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var identity = new ClaimsIdentity(
            [
                new Claim(PlatformClaims.Subject, "risk-administrator-subject"),
                new Claim(PlatformClaims.Role, PlatformRoles.RiskAdministrator),
                new Claim(PlatformClaims.AccountMode, "paper"),
                new Claim(PlatformClaims.AccountId, TestAccountId.ToString("D")),
                new Claim(PlatformClaims.AuthenticationMethod, "mfa"),
                new Claim(PlatformClaims.AuthenticationTime, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture)),
            ],
            SchemeName,
            nameType: "name",
            roleType: PlatformClaims.Role);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
        }
    }
}
