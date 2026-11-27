using System.Text;
using MAKH.Application.Evidence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidencePayloadSafetyTests
{
    [Fact]
    public async Task ValidTextIsNormalizedHashedAndScanAttributed()
    {
        var payload = Encoding.UTF8.GetBytes("Issuer update\r\nSecond line");

        var result = await EvidencePayloadSafety.ValidateAsync(
            payload, "text/plain; charset=utf-8", new Scanner(EvidenceMalwareScanState.Clean));

        Assert.Equal("text/plain", result.MediaType);
        Assert.Equal(payload.Length, result.ByteCount);
        Assert.Equal(64, result.PayloadSha256.Length);
        Assert.Equal("Issuer update\nSecond line", result.Text);
        Assert.Equal("synthetic-scanner/1", result.ScannerVersion);
    }

    [Theory]
    [InlineData("text/html")]
    [InlineData("application/pdf")]
    [InlineData("application/octet-stream")]
    public async Task NonAllowlistedMediaTypesFailClosed(string mediaType) =>
        await Assert.ThrowsAsync<ArgumentException>(() => EvidencePayloadSafety.ValidateAsync(
            "text"u8.ToArray(), mediaType, new Scanner(EvidenceMalwareScanState.Clean)));

    [Fact]
    public async Task InvalidUtf8AndBinarySignaturesFailBeforeScanning()
    {
        var scanner = new Scanner(EvidenceMalwareScanState.Clean);

        await Assert.ThrowsAsync<ArgumentException>(() => EvidencePayloadSafety.ValidateAsync(
            new byte[] { 0xC3, 0x28 }, "text/plain", scanner));
        await Assert.ThrowsAsync<ArgumentException>(() => EvidencePayloadSafety.ValidateAsync(
            new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x00 }, "text/plain", scanner));
        Assert.Equal(0, scanner.CallCount);
    }

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("safe\u202Etxt")]
    public async Task ActiveMarkupAndDirectionalControlsFailClosed(string text) =>
        await Assert.ThrowsAsync<ArgumentException>(() => EvidencePayloadSafety.ValidateAsync(
            Encoding.UTF8.GetBytes(text), "text/plain", new Scanner(EvidenceMalwareScanState.Clean)));

    [Theory]
    [InlineData(EvidenceMalwareScanState.ThreatDetected)]
    [InlineData(EvidenceMalwareScanState.Unavailable)]
    public async Task PayloadRequiresCleanMalwareScan(EvidenceMalwareScanState state) =>
        await Assert.ThrowsAsync<InvalidOperationException>(() => EvidencePayloadSafety.ValidateAsync(
            "safe"u8.ToArray(), "text/plain", new Scanner(state)));

    [Fact]
    public async Task PayloadSizeIsBoundedBeforeScanning()
    {
        var scanner = new Scanner(EvidenceMalwareScanState.Clean);

        await Assert.ThrowsAsync<ArgumentException>(() => EvidencePayloadSafety.ValidateAsync(
            new byte[EvidencePayloadSafety.MaximumPayloadBytes + 1], "text/plain", scanner));
        Assert.Equal(0, scanner.CallCount);
    }

    private sealed class Scanner(EvidenceMalwareScanState state) : IEvidenceMalwareScanner
    {
        public int CallCount { get; private set; }

        public Task<EvidenceMalwareScanResult> ScanAsync(
            ReadOnlyMemory<byte> payload,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new EvidenceMalwareScanResult(state, "synthetic-scanner/1"));
        }
    }
}
