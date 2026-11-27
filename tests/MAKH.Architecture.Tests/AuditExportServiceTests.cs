using System.Security.Cryptography;
using System.Text;
using MAKH.Application.Exports;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class AuditExportServiceTests
{
    private static readonly Guid Account = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid Actor = Guid.Parse("20000000-0000-0000-0000-000000000002");
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 15, 0, 0, TimeSpan.Zero);

    [Fact] public void RejectsUnauthorizedActor() => Assert.Throws<UnauthorizedAccessException>(() => Generate(AuditExportFormat.Json, new Authorization(false)));
    [Fact] public void RejectsExpiredRequest() => Assert.Throws<InvalidOperationException>(() => AuditExportService.Generate(Guid.NewGuid(), Request(AuditExportFormat.Json), [], new Authorization(true), Now.AddDays(2)));
    [Fact] public void RejectsExpiryBeyondSevenDays() => Assert.Throws<ArgumentException>(() => new AuditExportRequest(Guid.NewGuid(), Account, Actor, "Auditor", AuditExportFormat.Json, Now, Now.AddDays(8)));
    [Fact] public void ScopesRowsToAccount() { var package = Generate(AuditExportFormat.Json, rows: [Row("mine", Account), Row("other", Guid.NewGuid())]); Assert.Equal(1, package.Manifest.RecordCount); Assert.DoesNotContain("other", Encoding.UTF8.GetString(package.Content), StringComparison.Ordinal); }
    [Fact] public void RejectsDuplicateEventIdentity() { var row = Row("same", Account); Assert.Throws<InvalidOperationException>(() => Generate(AuditExportFormat.Csv, rows: [row, row])); }
    [Fact] public void CsvHasHeaderAndEscapesFormulaInjection() { var package = Generate(AuditExportFormat.Csv, rows: [new("e1", Account, Now, "risk", "+SUM(1,1)", "position-1", "corr")]); var text = Encoding.UTF8.GetString(package.Content); Assert.StartsWith("eventId,occurredAt", text, StringComparison.Ordinal); Assert.Contains("\"'+SUM(1,1)\"", text, StringComparison.Ordinal); }
    [Fact] public void JsonUsesCamelCaseAndOmitsAccountIdentity() { var text = Encoding.UTF8.GetString(Generate(AuditExportFormat.Json).Content); Assert.Contains("\"eventId\"", text, StringComparison.Ordinal); Assert.DoesNotContain("accountId", text, StringComparison.Ordinal); }
    [Fact] public void PdfHasValidEnvelopeAndSafetyLabel() { var bytes = Generate(AuditExportFormat.Pdf).Content; var text = Encoding.ASCII.GetString(bytes); Assert.StartsWith("%PDF-1.4", text, StringComparison.Ordinal); Assert.EndsWith("%%EOF\n", text, StringComparison.Ordinal); Assert.Contains("not a broker statement", text, StringComparison.Ordinal); }
    [Theory]
    [InlineData(AuditExportFormat.Csv, "text/csv", ".csv")]
    [InlineData(AuditExportFormat.Json, "application/json", ".json")]
    [InlineData(AuditExportFormat.Pdf, "application/pdf", ".pdf")]
    public void ManifestMatchesFormat(AuditExportFormat format, string mediaType, string extension) { var manifest = Generate(format).Manifest; Assert.Equal(mediaType, manifest.MediaType); Assert.EndsWith(extension, manifest.FileName, StringComparison.Ordinal); }
    [Fact] public void ManifestChecksumMatchesContent() { var package = Generate(AuditExportFormat.Json); Assert.Equal(Convert.ToHexStringLower(SHA256.HashData(package.Content)), package.Manifest.ContentSha256); }
    [Fact] public void ManifestCarriesFalseAuthorityAndNoCredentials() { var manifest = Generate(AuditExportFormat.Json).Manifest; Assert.True(manifest.Authorized); Assert.False(manifest.ContainsCredentials); Assert.False(manifest.CreatesTradingAuthority); }
    [Fact] public void RejectsAddressAndCredentialMaterial() { Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now, "audit", "sent", "person@example.com", "corr")); Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now, "audit", "sent", "api-token", "corr")); }
    [Theory]
    [InlineData("person@example.com")]
    [InlineData("api-token-value")]
    [InlineData("client-secret-value")]
    public void RejectsSensitiveCorrelationIdentifiers(string correlationId) =>
        Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now, "audit", "sent", "position-1", correlationId));
    [Fact] public void RejectsExcessiveEventAndCorrelationIdentifiers() { Assert.Throws<ArgumentException>(() => new AuditEvidenceRow(new string('e', 201), Account, Now, "audit", "sent", "position-1", "corr")); Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now, "audit", "sent", "position-1", new string('c', 201))); }
    [Fact] public void RejectsControlCharactersAcrossExportedTextFields() { Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e\n2", Account, Now, "audit", "sent", "position-1", "corr")); Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now, "audit", "sent\r\nforged", "position-1", "corr")); Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now, "audit", "sent", "position-1", "corr\tforged")); }
    [Fact] public void RejectsUndefinedExportFormatAtRequestBoundary() => Assert.Throws<ArgumentOutOfRangeException>(() => Request((AuditExportFormat)99));
    [Fact] public void OrderingProducesStableChecksum() { var a = Row("a", Account, Now.AddMinutes(-1)); var b = Row("b", Account, Now); Assert.Equal(Generate(AuditExportFormat.Json, rows: [a, b]).Manifest.ContentSha256, Generate(AuditExportFormat.Json, rows: [b, a]).Manifest.ContentSha256); }
    [Fact] public void RejectsNonUtcTimes() { Assert.Throws<ArgumentException>(() => new AuditExportRequest(Guid.NewGuid(), Account, Actor, "Auditor", AuditExportFormat.Json, Now.ToOffset(TimeSpan.FromHours(1)), Now.AddDays(1).ToOffset(TimeSpan.FromHours(1)))); Assert.Throws<ArgumentException>(() => new AuditEvidenceRow("e", Account, Now.ToOffset(TimeSpan.FromHours(1)), "audit", "sent", "position-1", "corr")); }
    [Fact] public void RejectsFutureEvidence() => Assert.Throws<InvalidOperationException>(() => Generate(AuditExportFormat.Json, rows: [Row("future", Account, Now.AddMinutes(2))]));
    [Fact] public void ManifestBindsActorRole() => Assert.Equal("Auditor", Generate(AuditExportFormat.Json).Manifest.ActorRole);
    [Fact] public void RejectsPdfBeyondBoundedRecordLimit() => Assert.Throws<InvalidOperationException>(() => Generate(AuditExportFormat.Pdf, rows: Enumerable.Range(0, 501).Select(index => Row($"e-{index}", Account))));

    private static AuditExportPackage Generate(AuditExportFormat format, Authorization? authorization = null, IEnumerable<AuditEvidenceRow>? rows = null) => AuditExportService.Generate(Guid.Parse("30000000-0000-0000-0000-000000000003"), Request(format), rows ?? [Row("e1", Account)], authorization ?? new Authorization(true), Now.AddMinutes(1));
    private static AuditExportRequest Request(AuditExportFormat format) => new(Guid.NewGuid(), Account, Actor, "Auditor", format, Now, Now.AddDays(1));
    private static AuditEvidenceRow Row(string id, Guid account, DateTimeOffset? at = null) => new(id, account, at ?? Now, "risk", "evaluated", "position-1", "corr-1");
    private sealed record Authorization(bool Allowed) : IAuditExportAuthorization { public bool CanExport(Guid actorUserId, Guid accountId, string actorRole) => Allowed && actorUserId == Actor && accountId == Account && actorRole == "Auditor"; }
}
