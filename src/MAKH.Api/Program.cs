using MAKH.Api.Identity;
using MAKH.Api.Observability;
using MAKH.Api.Realtime;
using MAKH.Application.Common;
using MAKH.Application.Common.Ports;
using MAKH.Application.Journal;
using MAKH.Application.Market;
using MAKH.Application.Risk;
using MAKH.Application.Security;
using MAKH.Application.Trading;
using MAKH.Infrastructure.Market;
using MAKH.Infrastructure.Observability;
using MAKH.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IClock, MAKH.Infrastructure.Common.SystemClock>();
builder.Services.AddHealthChecks();
builder.Services.AddMakhIdentity(builder.Configuration);
builder.Services.AddMakhObservability(builder.Configuration, "MAKH.Api", instrumentAspNetCore: true);
builder.Services.AddSingleton<RiskControlPreviewService>();
builder.Services.AddSingleton<PaperTradingOverviewService>();
builder.Services.AddSingleton<SymbolWorkspaceReadService>();
builder.Services.AddSingleton<DashboardReadService>();
builder.Services.AddSingleton<JournalReadService>();
builder.Services.AddScoped<IScannerRunRepository, PostgresScannerRunRepository>();
builder.Services.AddScoped<IOutboxStore, PostgresOutboxStore>();
builder.Services.AddScoped<OutboxDispatcher>();
builder.Services.AddScoped<IOutboxDispatchRunner, OutboxDispatchRunner>();
builder.Services.AddOptions<OutboxDispatchOptions>()
    .Bind(builder.Configuration.GetSection(OutboxDispatchOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<IValidateOptions<OutboxDispatchOptions>, OutboxDispatchOptionsValidator>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<OutboxDispatchHostedService>();
builder.Services.AddScoped<ScannerRealtimeAccess>();
builder.Services.AddSingleton<ScannerConnectionRegistry>();
builder.Services.AddSingleton<IScannerHubDelivery, SignalRScannerHubDelivery>();
builder.Services.AddSingleton<IScannerRealtimeSender, SignalRScannerRealtimeSender>();
builder.Services.AddSingleton<IOutboxPublisher, SignalRScannerOutboxPublisher>();
builder.Services.AddSignalR(options => options.EnableDetailedErrors = false);

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new { service = "MAKH.Api", status = "ready" }))
    .AllowAnonymous();
app.MapHealthChecks("/health").AllowAnonymous();
app.MapHub<TradingHub>("/hubs/trading-v1");

app.MapGet("/api/v1/session", (HttpContext context) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        return Results.Ok(new
        {
            subject = context.User.FindFirst(PlatformClaims.Subject)?.Value,
            roles = context.User.FindAll(PlatformClaims.Role).Select(claim => claim.Value),
            accountMode = context.User.FindFirst(PlatformClaims.AccountMode)?.Value,
            accountId = context.User.FindFirst(PlatformClaims.AccountId)?.Value,
            sessionId = context.User.FindFirst(PlatformClaims.SessionId)?.Value,
        });
    })
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

app.MapGet("/api/v1/session/inventory", async (
        HttpContext context,
        IServerSessionRegistry registry,
        IClock clock) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        return !Guid.TryParse(context.User.FindFirst(PlatformClaims.Subject)?.Value, out var userId)
            ? Results.Forbid()
            : Results.Ok(await registry.ListAsync(userId, clock.UtcNow, context.RequestAborted));
    })
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

app.MapDelete("/api/v1/session/inventory/{sessionId:guid}", async (
        Guid sessionId,
        HttpContext context,
        IServerSessionRegistry registry,
        ScannerConnectionRegistry scannerConnections,
        IClock clock,
        IAntiforgery antiforgery) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        if (!Guid.TryParse(context.User.FindFirst(PlatformClaims.Subject)?.Value, out var userId))
            return Results.Forbid();
        if (!await antiforgery.IsRequestValidAsync(context))
            return Results.BadRequest(new { error = "invalid_antiforgery_token" });
        if (!await registry.RevokeAsync(sessionId, userId, clock.UtcNow, context.RequestAborted))
            return Results.NotFound();
        scannerConnections.DisconnectSession(sessionId);
        return Results.NoContent();
    })
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

app.MapGet("/auth/csrf", (HttpContext context, IAntiforgery antiforgery) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        var tokens = antiforgery.GetAndStoreTokens(context);
        return Results.Ok(new { token = tokens.RequestToken });
    })
    .RequireAuthorization();

app.MapGet("/auth/login", (
        IOptions<IdentityOptions> identity,
        string? returnUrl) =>
    {
        if (!identity.Value.Enabled)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Identity provider is not configured");
        }

        var safeReturnUrl = !string.IsNullOrWhiteSpace(returnUrl)
            && Uri.TryCreate(returnUrl, UriKind.Relative, out _)
            && returnUrl.StartsWith('/')
            && !returnUrl.StartsWith("//", StringComparison.Ordinal)
                ? returnUrl
                : "/";
        return Results.Challenge(
            new AuthenticationProperties { RedirectUri = safeReturnUrl },
            [OpenIdConnectDefaults.AuthenticationScheme]);
    })
    .AllowAnonymous();

var scanner = app.MapGroup("/api/v1/scanner")
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

scanner.MapGet("/snapshot", (HttpContext context, IScannerRunRepository runs) =>
{
    context.Response.Headers.CacheControl = "no-store";
    if (!Guid.TryParse(context.User.FindFirst(PlatformClaims.AccountId)?.Value, out var accountId)
        || accountId == Guid.Empty)
        return Results.Forbid();

    var snapshot = runs.FindLatest(accountId);
    return snapshot is null ? Results.NotFound() : Results.Ok(snapshot);
});

scanner.MapGet("/runs/{runId:guid}", (Guid runId, HttpContext context, IScannerRunRepository runs) =>
{
    context.Response.Headers.CacheControl = "no-store";
    if (!Guid.TryParse(context.User.FindFirst(PlatformClaims.AccountId)?.Value, out var accountId)
        || accountId == Guid.Empty)
        return Results.Forbid();

    // Account-scoped evidence lookup only. This does not create trading authority
    // or authorize a SignalR stream without an account-scoped sequence.
    var run = runs.Find(runId, accountId);
    return run is null ? Results.NotFound() : Results.Ok(run);
});

var symbols = app.MapGroup("/api/v1/symbols")
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

symbols.MapGet("/{symbol}/workspace", (string symbol, HttpContext context, IClock clock,
    SymbolWorkspaceReadService service) =>
{
    context.Response.Headers.CacheControl = "no-store";
    try
    {
        var workspace = service.Find(symbol, clock.UtcNow);
        return workspace is null ? Results.NotFound() : Results.Ok(workspace);
    }
    catch (ArgumentException)
    {
        return Results.BadRequest(new { error = "invalid_symbol" });
    }
});

app.MapGet("/api/v1/dashboard", (HttpContext context, IClock clock,
        DashboardReadService service) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        return !Guid.TryParse(context.User.FindFirst(PlatformClaims.AccountId)?.Value, out var accountId)
               || accountId == Guid.Empty
            ? Results.Forbid()
            : Results.Ok(service.Snapshot(accountId, clock.UtcNow));
    })
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

app.MapGet("/api/v1/journal", (HttpContext context, IClock clock,
        JournalReadService service) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        return !Guid.TryParse(context.User.FindFirst(PlatformClaims.AccountId)?.Value, out var accountId)
               || accountId == Guid.Empty
               || !Guid.TryParse(context.User.FindFirst(PlatformClaims.Subject)?.Value, out var userId)
               || userId == Guid.Empty
            ? Results.Forbid()
            : Results.Ok(service.Snapshot(accountId, userId, clock.UtcNow));
    })
    .RequireAuthorization(AuthorizationPolicies.PortalAccess);

app.MapPost("/auth/logout", async (
        HttpContext context,
        IAntiforgery antiforgery,
        ScannerConnectionRegistry scannerConnections) =>
    {
        if (!await antiforgery.IsRequestValidAsync(context))
        {
            return Results.BadRequest(new { error = "invalid_antiforgery_token" });
        }

        var sessionId = Guid.TryParse(
            context.User.FindFirst(PlatformClaims.SessionId)?.Value, out var parsedSessionId)
                ? parsedSessionId
                : Guid.Empty;
        await context.SignOutAsync();
        scannerConnections.DisconnectSession(sessionId);
        return Results.NoContent();
    })
    .RequireAuthorization();

var risk = app.MapGroup("/api/v1/risk").RequireAuthorization(AuthorizationPolicies.PortalAccess);

var trading = app.MapGroup("/api/v1/trading")
    .RequireAuthorization(AuthorizationPolicies.PortalAccess, AuthorizationPolicies.PaperTrading);

trading.MapGet("/accounts/{accountId:guid}/overview", (
    Guid accountId, HttpContext context, IClock clock, PaperTradingOverviewService service) =>
{
    context.Response.Headers.CacheControl = "no-store";
    return !IsAuthorizedAccount(context, accountId)
        ? Results.Forbid()
        : Results.Ok(service.Overview(accountId, clock.UtcNow));
});

trading.MapPost("/orders/review", async (PaperOrderReviewRequest request, HttpContext context,
    IAntiforgery antiforgery, IClock clock, PaperTradingOverviewService service) =>
{
    context.Response.Headers.CacheControl = "no-store";
    if (!IsAuthorizedAccount(context, request.AccountId)) return Results.Forbid();
    if (!await antiforgery.IsRequestValidAsync(context))
        return Results.BadRequest(new { error = "invalid_antiforgery_token" });
    return Results.Ok(service.Review(request, clock.UtcNow));
});

risk.MapGet("/accounts/{accountId:guid}/state", (Guid accountId, HttpContext context, IClock clock, RiskControlPreviewService service) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        if (!IsAuthorizedAccount(context, accountId)) return Results.Forbid();
        var snapshot = service.Snapshot(accountId, "synthetic-policy-v1", clock.UtcNow);
        return Results.Ok(snapshot);
    });

risk.MapGet("/accounts/{accountId:guid}/overview", (Guid accountId, HttpContext context, IClock clock, RiskControlPreviewService service) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        return !IsAuthorizedAccount(context, accountId)
            ? Results.Forbid()
            : Results.Ok(service.Overview(accountId, clock.UtcNow));
    });

risk.MapPost("/containment/preview", async (
        ContainmentPreviewRequest request,
        HttpContext context,
        IAntiforgery antiforgery,
        IClock clock,
        RiskControlPreviewService service) =>
    {
        context.Response.Headers.CacheControl = "no-store";
        if (!IsAuthorizedAccount(context, request.AccountId)) return Results.Forbid();
        if (!await antiforgery.IsRequestValidAsync(context))
            return Results.BadRequest(new { error = "invalid_antiforgery_token" });
        if (!string.Equals(request.ExpectedPolicyVersion, RiskControlPreviewService.CurrentPolicyVersion, StringComparison.Ordinal))
            return Results.Conflict(new { error = "stale_policy_version" });
        return Results.Ok(service.Preview(request, clock.UtcNow));
    })
    .RequireAuthorization(AuthorizationPolicies.RiskAdministration);

static bool IsAuthorizedAccount(HttpContext context, Guid requestedAccountId) =>
    Guid.TryParse(context.User.FindFirst(PlatformClaims.AccountId)?.Value, out var authorizedAccountId)
    && authorizedAccountId == requestedAccountId;

app.Run();

public partial class Program;
