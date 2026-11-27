namespace MAKH.Infrastructure.Persistence.Scanner;

public sealed class ScannerAccountStreamRecord
{
    private ScannerAccountStreamRecord() { }

    public Guid AccountId { get; private set; }

    public long LastSequence { get; private set; }
}
