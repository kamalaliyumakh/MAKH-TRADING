using MAKH.Application.Common.Ports;
using MAKH.Application.Evidence;
using MAKH.Infrastructure.Common;
using MAKH.Infrastructure.Evidence;
using MAKH.Infrastructure.Observability;
using MAKH.Infrastructure.Persistence;
using MAKH.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddMakhObservability(builder.Configuration, "MAKH.Worker");
builder.Services.AddHostedService<Worker>();
builder.Services.AddOptions<EvidenceDispatchOptions>()
    .Bind(builder.Configuration.GetSection(EvidenceDispatchOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<IValidateOptions<EvidenceDispatchOptions>, EvidenceDispatchOptionsValidator>();
builder.Services.AddDbContext<PlatformDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Platform");
    if (!string.IsNullOrWhiteSpace(connectionString)) options.UseNpgsql(connectionString);
});
builder.Services.AddScoped<IEvidenceOutboxStore, PostgresEvidenceOutboxStore>();
builder.Services.AddScoped<EvidenceOutboxDispatcher>();
builder.Services.AddScoped<IEvidenceDispatchRunner, EvidenceDispatchRunner>();
builder.Services.AddHttpClient<IEvidenceOutboxPublisher, HttpEvidenceOutboxPublisher>((provider, client) =>
{
    var options = provider.GetRequiredService<IOptions<EvidenceDispatchOptions>>().Value;
    client.Timeout = TimeSpan.FromSeconds(options.RequestTimeoutSeconds);
});
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<EvidenceDispatchHostedService>();
builder.Services.AddOptions<SocialRetentionCleanupOptions>()
    .Bind(builder.Configuration.GetSection(SocialRetentionCleanupOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<IValidateOptions<SocialRetentionCleanupOptions>, SocialRetentionCleanupOptionsValidator>();
builder.Services.AddScoped<ISocialAttentionStore, PostgresSocialAttentionStore>();
builder.Services.AddScoped<ISocialRetentionCleanupRunner, SocialRetentionCleanupRunner>();
builder.Services.AddHostedService<SocialRetentionCleanupHostedService>();

await builder.Build().RunAsync();
