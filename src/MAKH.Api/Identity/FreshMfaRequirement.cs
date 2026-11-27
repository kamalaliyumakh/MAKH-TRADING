using Microsoft.AspNetCore.Authorization;

namespace MAKH.Api.Identity;

public sealed record FreshMfaRequirement(TimeSpan MaximumAge) : IAuthorizationRequirement;
