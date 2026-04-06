using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.AgUI;
using Backend.Services;
using dotenv.net;
using Microsoft.Extensions.AI;
using OpenAI;

DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddSingleton<ToolRegistry>();

builder.Services.AddSingleton<IChatClient>(sp =>
{
    var apiKey = builder.Configuration["OPENAI_API_KEY"]
        ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY")
        ?? throw new InvalidOperationException("OPENAI_API_KEY is not configured.");

    var model = builder.Configuration["OPENAI_MODEL"] ?? "gpt-4o-mini";
    var client = new OpenAIClient(apiKey);
    return client.GetChatClient(model).AsIChatClient();
});

var app = builder.Build();
app.UseCors();

app.MapPost("/agui", async (HttpContext context, IChatClient chatClient, ToolRegistry toolRegistry) =>
{
    var request = await JsonSerializer.DeserializeAsync<AgUIRunRequest>(
        context.Request.Body,
        AgUIJsonOptions.Default);

    if (request is null)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("Invalid request body");
        return;
    }

    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.Connection = "keep-alive";

    var handler = new AgUIStreamHandler(chatClient, toolRegistry);
    await handler.HandleAsync(request, context.Response, context.RequestAborted);
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapGet("/tools", (ToolRegistry toolRegistry) =>
    Results.Json(new { tools = toolRegistry.GetCatalogForUi() }));

var port = builder.Configuration["PORT"] ?? "5041";
app.Run($"http://0.0.0.0:{port}");
