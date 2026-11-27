using System.Reflection;
using Xunit;
using ApiAssembly = MAKH.Api.AssemblyMarker;
using ApplicationAssembly = MAKH.Application.AssemblyMarker;
using DomainAssembly = MAKH.Domain.AssemblyMarker;
using InfrastructureAssembly = MAKH.Infrastructure.AssemblyMarker;
using MigrationsAssembly = MAKH.Migrations.AssemblyMarker;
using WorkerAssembly = MAKH.Worker.AssemblyMarker;

namespace MAKH.Architecture.Tests;

public sealed class LayerDependencyTests
{
    [Fact]
    public void DomainHasNoDependenciesOnOtherMakhLayers() =>
        AssertReferencesOnly(typeof(DomainAssembly).Assembly);

    [Fact]
    public void ApplicationDependsOnlyOnDomain() =>
        AssertReferencesOnly(typeof(ApplicationAssembly).Assembly, "MAKH.Domain");

    [Fact]
    public void InfrastructureDependsOnlyOnApplicationAndDomain() =>
        AssertReferencesOnly(
            typeof(InfrastructureAssembly).Assembly,
            "MAKH.Application",
            "MAKH.Domain");

    [Fact]
    public void MigrationsDependOnlyOnInfrastructure() =>
        AssertReferencesOnly(typeof(MigrationsAssembly).Assembly, "MAKH.Infrastructure");

    [Fact]
    public void ApiDependsOnApplicationAndInfrastructureWithoutDirectDomainReference() =>
        AssertReferencesOnly(
            typeof(ApiAssembly).Assembly,
            "MAKH.Application",
            "MAKH.Infrastructure");

    [Fact]
    public void WorkerDependsOnApplicationAndInfrastructureWithoutDirectDomainReference() =>
        AssertReferencesOnly(
            typeof(WorkerAssembly).Assembly,
            "MAKH.Application",
            "MAKH.Infrastructure");

    private static void AssertReferencesOnly(Assembly assembly, params string[] allowed)
    {
        var actual = assembly
            .GetReferencedAssemblies()
            .Select(reference => reference.Name)
            .Where(name => name is not null && name.StartsWith("MAKH.", StringComparison.Ordinal))
            .Cast<string>()
            .Order(StringComparer.Ordinal)
            .ToArray();

        var forbidden = actual.Except(allowed, StringComparer.Ordinal).ToArray();

        Assert.Empty(forbidden);
    }
}
