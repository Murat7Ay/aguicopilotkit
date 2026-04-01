using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.AgUI;

public static class AgUIJsonOptions
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };
}

public record AgUIRunRequest
{
    public string? ThreadId { get; init; }
    public string? RunId { get; init; }
    public List<AgUIMessage>? Messages { get; init; }
    public List<AgUITool>? Tools { get; init; }
    public JsonElement? State { get; init; }
    public List<AgUIContext>? Context { get; init; }
    public JsonElement? ForwardedProps { get; init; }
}

public record AgUIMessage
{
    public string? Id { get; init; }
    public string Role { get; init; } = "user";
    public string? Content { get; init; }
    public string? Name { get; init; }
    public List<AgUIToolCall>? ToolCalls { get; init; }
    public string? ToolCallId { get; init; }
}

public record AgUIToolCall
{
    public string? Id { get; init; }
    public string? Type { get; init; }
    public AgUIFunctionCall? Function { get; init; }
}

public record AgUIFunctionCall
{
    public string? Name { get; init; }
    public string? Arguments { get; init; }
}

public record AgUITool
{
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public JsonElement? Parameters { get; init; }
}

public record AgUIContext
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? Value { get; init; }
}

// AG-UI Events
public static class EventType
{
    public const string RunStarted = "RUN_STARTED";
    public const string RunFinished = "RUN_FINISHED";
    public const string RunError = "RUN_ERROR";
    public const string TextMessageStart = "TEXT_MESSAGE_START";
    public const string TextMessageContent = "TEXT_MESSAGE_CONTENT";
    public const string TextMessageEnd = "TEXT_MESSAGE_END";
    public const string ToolCallStart = "TOOL_CALL_START";
    public const string ToolCallArgs = "TOOL_CALL_ARGS";
    public const string ToolCallEnd = "TOOL_CALL_END";
    public const string ToolCallResult = "TOOL_CALL_RESULT";
    public const string StateSnapshot = "STATE_SNAPSHOT";
    public const string StateDelta = "STATE_DELTA";
    public const string MessagesSnapshot = "MESSAGES_SNAPSHOT";
    public const string Custom = "CUSTOM";
}

public record AgUIEvent
{
    public string Type { get; init; } = "";
    public string? ThreadId { get; init; }
    public string? RunId { get; init; }
    public string? MessageId { get; init; }
    public string? Role { get; init; }
    public string? Delta { get; init; }
    public string? Message { get; init; }
    public string? ToolCallId { get; init; }
    public string? ToolCallName { get; init; }
    public string? ParentMessageId { get; init; }
    public string? Content { get; init; }
    public JsonElement? State { get; init; }
    public List<AgUIMessage>? Messages { get; init; }
}
