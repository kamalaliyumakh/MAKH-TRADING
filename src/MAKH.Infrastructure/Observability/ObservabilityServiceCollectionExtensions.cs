using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace MAKH.Infrastructure.Observability;

public static class ObservabilityServiceCollectionExtensions
{
    public static IServiceCollection AddMakhObservability(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName,
        bool instrumentAspNetCore = false)
    {
        var environment = configuration["Platform:Environment"] ?? "local";
        var telemetry = services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(serviceName)
                .AddAttributes(new Dictionary<string, object>
                {
                    ["deployment.environment.name"] = environment,
                    ["makh.account.mode"] = configuration["Platform:AccountMode"] ?? "synthetic",
                }))
            .WithMetrics(metrics =>
            {
                metrics.AddRuntimeInstrumentation().AddHttpClientInstrumentation();
                if (instrumentAspNetCore) metrics.AddAspNetCoreInstrumentation();
            })
            .WithTracing(tracing =>
            {
                tracing.AddHttpClientInstrumentation();
                if (instrumentAspNetCore) tracing.AddAspNetCoreInstrumentation();
            });

        var endpoint = configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
        if (Uri.TryCreate(endpoint, UriKind.Absolute, out var uri))
        {
            telemetry.UseOtlpExporter(OtlpExportProtocol.HttpProtobuf, uri);
        }

        return services;
    }
}
