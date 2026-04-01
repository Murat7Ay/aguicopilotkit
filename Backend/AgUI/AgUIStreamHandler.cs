using System.Text.Json;
using Backend.Services;
using Microsoft.Extensions.AI;

namespace Backend.AgUI;

public class AgUIStreamHandler(IChatClient chatClient, ToolRegistry toolRegistry)
{
    public async Task HandleAsync(AgUIRunRequest request, HttpResponse response, CancellationToken ct)
    {
        var threadId = request.ThreadId ?? Guid.NewGuid().ToString();
        var runId = request.RunId ?? Guid.NewGuid().ToString();

        await WriteEventAsync(response, new AgUIEvent
        {
            Type = EventType.RunStarted,
            ThreadId = threadId,
            RunId = runId
        }, ct);

        try
        {
            var messages = BuildChatMessages(request);
            var options = BuildChatOptions(request);
            var frontendToolNames = (request.Tools ?? []).Select(t => t.Name).ToHashSet();

            var messageId = Guid.NewGuid().ToString();
            await WriteEventAsync(response, new AgUIEvent
            {
                Type = EventType.TextMessageStart,
                MessageId = messageId,
                Role = "assistant"
            }, ct);

            await StreamWithToolLoopAsync(response, messages, options, frontendToolNames, messageId, ct);

            await WriteEventAsync(response, new AgUIEvent
            {
                Type = EventType.TextMessageEnd,
                MessageId = messageId
            }, ct);
        }
        catch (Exception ex)
        {
            await WriteEventAsync(response, new AgUIEvent
            {
                Type = EventType.RunError,
                Message = ex.Message
            }, ct);
        }

        await WriteEventAsync(response, new AgUIEvent
        {
            Type = EventType.RunFinished,
            ThreadId = threadId,
            RunId = runId
        }, ct);
    }

    private async Task StreamWithToolLoopAsync(
        HttpResponse response,
        List<ChatMessage> messages,
        ChatOptions options,
        HashSet<string> frontendToolNames,
        string messageId,
        CancellationToken ct,
        int maxIterations = 5)
    {
        for (var iteration = 0; iteration < maxIterations; iteration++)
        {
            var pendingToolCalls = new List<PendingToolCall>();

            await foreach (var update in chatClient.GetStreamingResponseAsync(messages, options, ct))
            {
                foreach (var content in update.Contents)
                {
                    switch (content)
                    {
                        case TextContent textContent when !string.IsNullOrEmpty(textContent.Text):
                            await WriteEventAsync(response, new AgUIEvent
                            {
                                Type = EventType.TextMessageContent,
                                MessageId = messageId,
                                Delta = textContent.Text
                            }, ct);
                            break;

                        case FunctionCallContent functionCall:
                            var toolCallId = functionCall.CallId ?? Guid.NewGuid().ToString();

                            await WriteEventAsync(response, new AgUIEvent
                            {
                                Type = EventType.ToolCallStart,
                                ToolCallId = toolCallId,
                                ToolCallName = functionCall.Name,
                                ParentMessageId = messageId
                            }, ct);

                            var argsJson = functionCall.Arguments is not null
                                ? JsonSerializer.Serialize(functionCall.Arguments, AgUIJsonOptions.Default)
                                : "{}";

                            await WriteEventAsync(response, new AgUIEvent
                            {
                                Type = EventType.ToolCallArgs,
                                ToolCallId = toolCallId,
                                Delta = argsJson
                            }, ct);

                            await WriteEventAsync(response, new AgUIEvent
                            {
                                Type = EventType.ToolCallEnd,
                                ToolCallId = toolCallId
                            }, ct);

                            pendingToolCalls.Add(new PendingToolCall(
                                toolCallId, functionCall.Name, functionCall.Arguments));
                            break;
                    }
                }
            }

            if (pendingToolCalls.Count == 0)
                break;

            var assistantContents = new List<AIContent>();
            foreach (var tc in pendingToolCalls)
            {
                var argsCopy = tc.Arguments is not null
                    ? new Dictionary<string, object?>(tc.Arguments)
                    : null;
                assistantContents.Add(new FunctionCallContent(tc.Id, tc.Name, argsCopy));
            }
            messages.Add(new ChatMessage(ChatRole.Assistant, assistantContents));

            var hasBackendToolResults = false;
            foreach (var tc in pendingToolCalls)
            {
                if (frontendToolNames.Contains(tc.Name))
                    continue;

                var result = await toolRegistry.ExecuteAsync(tc.Name, tc.Arguments);

                await WriteEventAsync(response, new AgUIEvent
                {
                    Type = EventType.ToolCallResult,
                    ToolCallId = tc.Id,
                    ToolCallName = tc.Name,
                    Content = result
                }, ct);

                messages.Add(new ChatMessage(ChatRole.Tool, [
                    new FunctionResultContent(tc.Id, result)
                ]));
                hasBackendToolResults = true;
            }

            if (!hasBackendToolResults)
                break;
        }
    }

    private List<ChatMessage> BuildChatMessages(AgUIRunRequest request)
    {
        var messages = new List<ChatMessage>();

        var systemPrompt = """
            You are a helpful AI assistant. You can use tools when needed.
            When the user asks you to perform actions, use the available tools.
            Always be helpful and provide clear responses.
            """;

        if (request.Context is { Count: > 0 })
        {
            systemPrompt += "\n\nAdditional context:\n";
            foreach (var ctx in request.Context)
                systemPrompt += $"- {ctx.Name}: {ctx.Value}\n";
        }

        messages.Add(new ChatMessage(ChatRole.System, systemPrompt));

        foreach (var msg in request.Messages ?? [])
        {
            var role = msg.Role.ToLowerInvariant() switch
            {
                "user" => ChatRole.User,
                "assistant" => ChatRole.Assistant,
                "system" => ChatRole.System,
                "tool" => ChatRole.Tool,
                _ => ChatRole.User
            };

            if (role == ChatRole.Tool && msg.ToolCallId is not null)
            {
                messages.Add(new ChatMessage(ChatRole.Tool, [
                    new FunctionResultContent(msg.ToolCallId, msg.Content ?? "")
                ]));
            }
            else if (role == ChatRole.Assistant && msg.ToolCalls is { Count: > 0 })
            {
                var contents = new List<AIContent>();
                if (!string.IsNullOrEmpty(msg.Content))
                    contents.Add(new TextContent(msg.Content));

                foreach (var tc in msg.ToolCalls)
                {
                    IDictionary<string, object?>? args = null;
                    if (tc.Function?.Arguments is not null)
                    {
                        args = JsonSerializer.Deserialize<Dictionary<string, object?>>(
                            tc.Function.Arguments, AgUIJsonOptions.Default);
                    }
                    contents.Add(new FunctionCallContent(tc.Id ?? "", tc.Function?.Name ?? "", args));
                }

                messages.Add(new ChatMessage(ChatRole.Assistant, contents));
            }
            else
            {
                messages.Add(new ChatMessage(role, msg.Content ?? ""));
            }
        }

        return messages;
    }

    private ChatOptions BuildChatOptions(AgUIRunRequest request)
    {
        var tools = new List<AITool>();

        foreach (var tool in request.Tools ?? [])
        {
            tools.Add(AIFunctionFactory.Create(
                (string input) => $"Frontend tool '{tool.Name}' called",
                tool.Name,
                tool.Description ?? ""));
        }

        foreach (var tool in toolRegistry.GetAllTools())
            tools.Add(tool);

        return new ChatOptions { Tools = tools };
    }

    private static async Task WriteEventAsync(HttpResponse response, AgUIEvent evt, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(evt, AgUIJsonOptions.Default);
        await response.WriteAsync($"data: {json}\n\n", ct);
        await response.Body.FlushAsync(ct);
    }

    private record PendingToolCall(string Id, string Name, IDictionary<string, object?>? Arguments);
}
