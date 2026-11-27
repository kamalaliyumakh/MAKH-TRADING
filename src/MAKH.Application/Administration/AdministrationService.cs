using System.Security.Cryptography;
using System.Text;
using MAKH.Application.Security;

namespace MAKH.Application.Administration;

public sealed class AdministrationService(IAdministrationStore store)
{
    public AdministrativeResult Execute(AdministrativeContext context, AdministrativeCommand command, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(command);
        if (!context.FreshMfa || now < context.ElevatedAt || now >= context.ElevationExpiresAt)
            throw new UnauthorizedAccessException("Fresh, active administrative elevation is required.");
        if (!Allowed(context.Role, command.Resource, command.Action))
            throw new UnauthorizedAccessException("Administrative role is not permitted for this resource and action.");
        if (command.Resource == AdministrativeResource.Provider && command.ProposedSummary.Contains("credential", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Provider administration stores references, never credentials.", nameof(command));

        return store.Execute(state =>
        {
            if (state.Commands.TryGetValue(command.CommandId, out var prior))
            {
                if (prior.Command != command || prior.ActorUserId != context.ActorUserId)
                    throw new InvalidOperationException("Administrative command ID was reused for a different intent.");
                return prior.Result;
            }
            var key = (command.Resource, command.ResourceId);
            var current = state.Resources.GetValueOrDefault(key);
            var currentVersion = current.Version ?? "none";
            if (!StringComparer.Ordinal.Equals(currentVersion, command.ExpectedVersion))
                throw new InvalidOperationException("Administrative resource version conflict.");
            var before = Hash(command.Resource, command.ResourceId, currentVersion, current.Summary ?? string.Empty);
            var after = Hash(command.Resource, command.ResourceId, command.ProposedVersion, command.ProposedSummary);
            var result = new AdministrativeResult(command.CommandId, command.Resource, command.Action, command.ResourceId,
                before, after, context.ActorUserId, now, context.Reason, context.CorrelationId, state.Audit.Count + 1);
            state.Resources[key] = (command.ProposedVersion, command.ProposedSummary);
            state.Commands.Add(command.CommandId, (command, context.ActorUserId, result));
            state.Audit.Add(result);
            return result;
        });
    }

    public IReadOnlyList<AdministrativeResult> Audit() => store.Execute(state => state.Audit.ToArray());

    private static bool Allowed(string role, AdministrativeResource resource, AdministrativeAction action)
    {
        if (role == PlatformRoles.Auditor) return action == AdministrativeAction.View || action == AdministrativeAction.RunDiagnostic;
        if (role == PlatformRoles.RiskAdministrator) return resource == AdministrativeResource.RiskPolicy && action is AdministrativeAction.CreateDraft or AdministrativeAction.Publish;
        if (role != "OperationsAdministrator") return false;
        return resource switch
        {
            AdministrativeResource.Provider or AdministrativeResource.MarketCalendar => action is AdministrativeAction.CreateDraft or AdministrativeAction.Publish or AdministrativeAction.Disable,
            AdministrativeResource.Diagnostics => action == AdministrativeAction.RunDiagnostic,
            AdministrativeResource.UserAccess => action is AdministrativeAction.CreateDraft or AdministrativeAction.Disable,
            _ => false,
        };
    }

    private static string Hash(AdministrativeResource resource, string id, string version, string summary) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes($"{resource}|{id}|{version}|{summary}")));
}
