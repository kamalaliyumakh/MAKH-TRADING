using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MAKH.Application.Exports;

public static class AuditExportService
{
    private const int MaximumInputRows = 100_000;
    private const int MaximumStructuredExportRows = 50_000;
    private const int MaximumPdfRows = 500;
    private const int MaximumContentBytes = 25 * 1024 * 1024;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true };
    private static readonly string[] PdfHeader = ["MAKH Audit Evidence", "Synthetic export - not a broker statement"];

    public static AuditExportPackage Generate(Guid exportId, AuditExportRequest request,
        IEnumerable<AuditEvidenceRow> rows, IAuditExportAuthorization authorization, DateTimeOffset generatedAt)
    {
        if (exportId == Guid.Empty) throw new ArgumentException("Export ID is required.", nameof(exportId));
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(rows);
        ArgumentNullException.ThrowIfNull(authorization);
        if (generatedAt == default || generatedAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Export generation time must be a non-default UTC value.", nameof(generatedAt));
        if (generatedAt < request.RequestedAt || generatedAt >= request.ExpiresAt)
            throw new InvalidOperationException("Export generation is outside the authorized validity window.");
        if (!authorization.CanExport(request.ActorUserId, request.AccountId, request.ActorRole))
            throw new UnauthorizedAccessException("Actor is not authorized to export this account.");

        var boundedRows = rows.Take(MaximumInputRows + 1).ToArray();
        if (boundedRows.Length > MaximumInputRows)
            throw new ArgumentException($"Export input exceeds the {MaximumInputRows:N0}-row limit.", nameof(rows));
        var scoped = boundedRows.Where(row => row.AccountId == request.AccountId)
            .OrderBy(row => row.OccurredAt).ThenBy(row => row.EventId, StringComparer.Ordinal).ToArray();
        if (scoped.GroupBy(row => row.EventId, StringComparer.Ordinal).Any(group => group.Count() > 1))
            throw new InvalidOperationException("Evidence event identities must be unique within an export.");
        if (scoped.Any(row => row.OccurredAt > generatedAt))
            throw new InvalidOperationException("Export evidence cannot postdate generation time.");
        var maximumRows = request.Format == AuditExportFormat.Pdf ? MaximumPdfRows : MaximumStructuredExportRows;
        if (scoped.Length > maximumRows)
            throw new InvalidOperationException($"{request.Format} export exceeds the {maximumRows:N0}-record format limit.");

        var content = request.Format switch
        {
            AuditExportFormat.Csv => Csv(scoped),
            AuditExportFormat.Json => Json(scoped),
            AuditExportFormat.Pdf => Pdf(scoped),
            _ => throw new ArgumentOutOfRangeException(nameof(request)),
        };
        if (content.Length > MaximumContentBytes)
            throw new InvalidOperationException("Export content exceeds the 25 MiB in-memory safety limit.");
        var (extension, mediaType) = request.Format switch
        {
            AuditExportFormat.Csv => ("csv", "text/csv"),
            AuditExportFormat.Json => ("json", "application/json"),
            AuditExportFormat.Pdf => ("pdf", "application/pdf"),
            _ => throw new ArgumentOutOfRangeException(nameof(request)),
        };
        var manifest = new AuditExportManifest(exportId, request.RequestId, request.AccountId, request.ActorUserId, request.ActorRole,
            request.Format, generatedAt, request.ExpiresAt, scoped.Length,
            Convert.ToHexStringLower(SHA256.HashData(content)), mediaType, $"audit-{exportId:N}.{extension}",
            Authorized: true, ContainsCredentials: false, CreatesTradingAuthority: false);
        return new(manifest, content);
    }

    private static byte[] Csv(IEnumerable<AuditEvidenceRow> rows)
    {
        var text = new StringBuilder("eventId,occurredAt,category,action,subjectReference,correlationId\r\n");
        foreach (var row in rows) text.Append(CsvCell(row.EventId)).Append(',').Append(row.OccurredAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture)).Append(',')
            .Append(CsvCell(row.Category)).Append(',').Append(CsvCell(row.Action)).Append(',').Append(CsvCell(row.SubjectReference)).Append(',').Append(CsvCell(row.CorrelationId)).Append("\r\n");
        return Encoding.UTF8.GetBytes(text.ToString());
    }

    private static string CsvCell(string value)
    {
        var safe = value.Length > 0 && "=+-@".Contains(value[0], StringComparison.Ordinal) ? $"'{value}" : value;
        return $"\"{safe.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
    }

    private static byte[] Json(IEnumerable<AuditEvidenceRow> rows) => Encoding.UTF8.GetBytes(JsonSerializer.Serialize(rows.Select(row => new
    {
        row.EventId,
        occurredAt = row.OccurredAt.ToUniversalTime(),
        row.Category,
        row.Action,
        row.SubjectReference,
        row.CorrelationId,
    }), JsonOptions));

    private static byte[] Pdf(IEnumerable<AuditEvidenceRow> rows)
    {
        var lines = PdfHeader.Concat(rows.Select(row =>
            $"{row.OccurredAt.ToUniversalTime():O} {row.Category} {row.Action} {row.SubjectReference}"));
        var body = string.Join("\\n", lines.Select(EscapePdf));
        var stream = $"BT /F1 9 Tf 40 760 Td 12 TL ({body}) Tj ET";
        var objects = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
            $"<< /Length {Encoding.ASCII.GetByteCount(stream)} >>\nstream\n{stream}\nendstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        };
        var pdf = new StringBuilder("%PDF-1.4\n");
        var offsets = new List<int> { 0 };
        for (var i = 0; i < objects.Length; i++) { offsets.Add(Encoding.ASCII.GetByteCount(pdf.ToString())); pdf.Append(i + 1).Append(" 0 obj\n").Append(objects[i]).Append("\nendobj\n"); }
        var xref = Encoding.ASCII.GetByteCount(pdf.ToString());
        pdf.Append("xref\n0 6\n0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1)) pdf.Append(offset.ToString("D10", CultureInfo.InvariantCulture)).Append(" 00000 n \n");
        pdf.Append("trailer << /Size 6 /Root 1 0 R >>\nstartxref\n").Append(xref).Append("\n%%EOF\n");
        return Encoding.ASCII.GetBytes(pdf.ToString());
    }

    private static string EscapePdf(string value) => value.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("(", "\\(", StringComparison.Ordinal).Replace(")", "\\)", StringComparison.Ordinal).Replace("\r", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal);
}
