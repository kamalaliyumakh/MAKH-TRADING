using MAKH.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MAKH.Api.Realtime;

[Authorize(Policy = AuthorizationPolicies.PortalAccess)]
public sealed class TradingHub(ScannerRealtimeAccess access, ScannerConnectionRegistry connections) : Hub
{
    public async Task SubscribeScannerUpdates()
    {
        var identity = Context.User is null
            ? null
            : await access.AuthorizeAsync(Context.User, Context.ConnectionAborted);
        if (identity is null)
        {
            Context.Abort();
            throw new HubException("Scanner subscription is not authorized.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            ScannerRealtimeGroups.ForAccount(identity.AccountId),
            Context.ConnectionAborted);
        connections.Register(new(
            Context.ConnectionId,
            identity.UserId,
            identity.AccountId,
            identity.SessionId,
            Context.Abort));
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        connections.Unregister(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}
