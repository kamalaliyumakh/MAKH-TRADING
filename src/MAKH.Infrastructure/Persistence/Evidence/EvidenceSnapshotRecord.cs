using System.Text.Json;
using MAKH.Application.Evidence;

namespace MAKH.Infrastructure.Persistence.Evidence;

public sealed class EvidenceSnapshotRecord
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private EvidenceSnapshotRecord() { }

    public EvidenceSnapshotRecord(EvidenceSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        if (snapshot.Items.Count > 10_000)
            throw new ArgumentOutOfRangeException(nameof(snapshot), "Evidence snapshots are limited to 10000 items.");
        Id = Guid.NewGuid();
        AsOf = snapshot.AsOf;
        SchemaVersion = snapshot.SchemaVersion;
        ManifestSha256 = snapshot.ManifestSha256;
        ItemCount = snapshot.Items.Count;
        ItemsJson = JsonSerializer.Serialize(snapshot.Items, SerializerOptions);
    }

    public Guid Id { get; private set; }
    public DateTimeOffset AsOf { get; private set; }
    public string SchemaVersion { get; private set; } = string.Empty;
    public string ManifestSha256 { get; private set; } = string.Empty;
    public int ItemCount { get; private set; }
    public string ItemsJson { get; private set; } = string.Empty;

    public EvidenceSnapshot ToModel()
    {
        var items = JsonSerializer.Deserialize<EvidenceSnapshotItem[]>(ItemsJson, SerializerOptions)
            ?? throw new InvalidOperationException("Persisted evidence snapshot items are invalid.");
        if (items.Length != ItemCount)
            throw new InvalidOperationException("Persisted evidence snapshot item count does not match its manifest.");
        return new(AsOf, SchemaVersion, ManifestSha256, items);
    }
}
