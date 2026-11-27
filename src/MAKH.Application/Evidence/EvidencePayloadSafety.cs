using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace MAKH.Application.Evidence;

public enum EvidenceMalwareScanState
{
    Clean,
    ThreatDetected,
    Unavailable,
}

public sealed record EvidenceMalwareScanResult(EvidenceMalwareScanState State, string ScannerVersion);

public interface IEvidenceMalwareScanner
{
    Task<EvidenceMalwareScanResult> ScanAsync(
        ReadOnlyMemory<byte> payload,
        CancellationToken cancellationToken = default);
}

public sealed record ValidatedEvidencePayload(
    string MediaType,
    int ByteCount,
    string PayloadSha256,
    string Text,
    string ScannerVersion);

public static partial class EvidencePayloadSafety
{
    public const int MaximumPayloadBytes = 1_048_576;

    private static readonly UTF8Encoding StrictUtf8 = new(false, true);
    private static readonly HashSet<string> AllowedMediaTypes =
        new(StringComparer.OrdinalIgnoreCase) { "text/plain", "application/json" };
    private static readonly byte[][] ProhibitedBinarySignatures =
    [
        [0x4D, 0x5A],
        [0x7F, 0x45, 0x4C, 0x46],
        [0x50, 0x4B, 0x03, 0x04],
        [0x1F, 0x8B],
        [0xCA, 0xFE, 0xBA, 0xBE],
    ];

    [GeneratedRegex("<\\s*/?\\s*(script|iframe|object|embed|svg|math|style|link|meta)\\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, 50)]
    private static partial Regex ActiveMarkupPattern();

    public static async Task<ValidatedEvidencePayload> ValidateAsync(
        ReadOnlyMemory<byte> payload,
        string mediaType,
        IEvidenceMalwareScanner malwareScanner,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(malwareScanner);
        var normalizedMediaType = NormalizeMediaType(mediaType);
        if (payload.IsEmpty) throw new ArgumentException("Evidence payload is required.", nameof(payload));
        if (payload.Length > MaximumPayloadBytes)
            throw new ArgumentException("Evidence payload exceeds the one-megabyte ingestion limit.", nameof(payload));
        RejectBinarySignature(payload.Span);

        string text;
        try
        {
            text = StrictUtf8.GetString(payload.Span);
        }
        catch (DecoderFallbackException exception)
        {
            throw new ArgumentException("Evidence payload must be valid UTF-8 text.", nameof(payload), exception);
        }

        if (text.Any(IsUnsafeDirectionalControl))
            throw new ArgumentException("Evidence payload contains unsafe directional controls.", nameof(payload));
        if (ActiveMarkupPattern().IsMatch(text))
            throw new ArgumentException("Evidence payload contains active markup.", nameof(payload));

        var scan = await malwareScanner.ScanAsync(payload, cancellationToken);
        if (scan.State != EvidenceMalwareScanState.Clean)
            throw new InvalidOperationException("Evidence payload cannot be accepted without a clean malware scan.");
        if (string.IsNullOrWhiteSpace(scan.ScannerVersion) || scan.ScannerVersion.Trim().Length > 100)
            throw new InvalidOperationException("A bounded malware scanner version is required.");

        return new ValidatedEvidencePayload(
            normalizedMediaType,
            payload.Length,
            Convert.ToHexStringLower(SHA256.HashData(payload.Span)),
            text.Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n'),
            scan.ScannerVersion.Trim());
    }

    private static string NormalizeMediaType(string mediaType)
    {
        if (string.IsNullOrWhiteSpace(mediaType))
            throw new ArgumentException("Evidence media type is required.", nameof(mediaType));
        var normalized = mediaType.Split(';', 2)[0].Trim();
        return AllowedMediaTypes.Contains(normalized)
            ? normalized.ToLowerInvariant()
            : throw new ArgumentException("Evidence media type is not allowlisted.", nameof(mediaType));
    }

    private static void RejectBinarySignature(ReadOnlySpan<byte> payload)
    {
        foreach (var signature in ProhibitedBinarySignatures)
        {
            if (payload.StartsWith(signature))
                throw new ArgumentException("Evidence payload has a prohibited binary signature.", nameof(payload));
        }
    }

    private static bool IsUnsafeDirectionalControl(char character) => character is
        '\u202A' or '\u202B' or '\u202D' or '\u202E' or '\u2066' or '\u2067' or '\u2068' or '\u2069';
}
