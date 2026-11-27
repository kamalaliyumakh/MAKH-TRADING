namespace MAKH.Application.Risk;

public sealed class RiskPolicyCatalog
{
    private readonly RiskPolicy[] policies;

    public RiskPolicyCatalog(IEnumerable<RiskPolicy> policies)
    {
        ArgumentNullException.ThrowIfNull(policies);
        this.policies = policies.OrderBy(policy => policy.EffectiveFrom).ToArray();
        if (this.policies.Length == 0) throw new ArgumentException("At least one risk policy is required.", nameof(policies));
        if (this.policies.Select(policy => policy.Version).Distinct(StringComparer.Ordinal).Count() != this.policies.Length)
            throw new ArgumentException("Risk policy versions must be unique.", nameof(policies));
        for (var index = 1; index < this.policies.Length; index++)
        {
            if (this.policies[index - 1].EffectiveTo is null || this.policies[index - 1].EffectiveTo > this.policies[index].EffectiveFrom)
                throw new ArgumentException("Risk policy effective ranges cannot overlap.", nameof(policies));
        }
    }

    public RiskPolicy Resolve(DateTimeOffset at)
    {
        var matches = policies.Where(policy => policy.IsEffectiveAt(at)).ToArray();
        return matches.Length == 1
            ? matches[0]
            : throw new InvalidOperationException("Exactly one effective risk policy is required; evaluation failed closed.");
    }
}
