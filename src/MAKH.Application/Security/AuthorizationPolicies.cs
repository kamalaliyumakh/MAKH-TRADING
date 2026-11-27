namespace MAKH.Application.Security;

public static class AuthorizationPolicies
{
    public const string PortalAccess = "PortalAccess";
    public const string PaperTrading = "PaperTrading";
    public const string FreshMfa = "FreshMfa";
    public const string RiskAdministration = "RiskAdministration";
    public const string LiveTrading = "LiveTrading";
}
