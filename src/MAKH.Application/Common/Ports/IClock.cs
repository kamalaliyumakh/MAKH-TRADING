namespace MAKH.Application.Common.Ports;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
