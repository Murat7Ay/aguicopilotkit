using System.ComponentModel;
using System.Text.Json;
using Microsoft.Extensions.AI;

namespace Backend.Services;

public class ToolRegistry
{
    private readonly Dictionary<string, AITool> _tools = new();
    private readonly Dictionary<string, Func<IDictionary<string, object?>?, Task<string>>> _executors = new();

    public ToolRegistry()
    {
        RegisterBuiltInTools();
    }

    public void RegisterBuiltInTools()
    {
        Register(
            AIFunctionFactory.Create(GetCurrentWeather, "get_weather", "Get the current weather for a given city"),
            async args =>
            {
                var city = GetArg(args, "city") ?? "unknown";
                return await GetCurrentWeather(city);
            });

        Register(
            AIFunctionFactory.Create(SearchWeb, "search_web", "Search the web for information on a topic"),
            async args =>
            {
                var query = GetArg(args, "query") ?? "";
                return await SearchWeb(query);
            });

        Register(
            AIFunctionFactory.Create(GetCurrentTime, "get_current_time", "Get the current date and time"),
            async _ => await GetCurrentTime());

        Register(
            AIFunctionFactory.Create(Calculate, "calculate", "Perform a mathematical calculation"),
            async args =>
            {
                var expression = GetArg(args, "expression") ?? "";
                return await Calculate(expression);
            });

        Register(
            AIFunctionFactory.Create(TranslateText, "translate_text", "Translate text to another language"),
            async args =>
            {
                var text = GetArg(args, "text") ?? "";
                var targetLanguage = GetArg(args, "targetLanguage") ?? "en";
                return await TranslateText(text, targetLanguage);
            });
    }

    public void Register(AITool tool, Func<IDictionary<string, object?>?, Task<string>> executor)
    {
        var name = tool switch
        {
            AIFunction f => f.Name,
            _ => tool.GetType().Name
        };
        _tools[name] = tool;
        _executors[name] = executor;
    }

    public IEnumerable<AITool> GetAllTools() => _tools.Values;

    private static string? GetArg(IDictionary<string, object?>? args, string key)
    {
        if (args is null) return null;
        return args.TryGetValue(key, out var value) ? value?.ToString() : null;
    }

    public async Task<string> ExecuteAsync(string name, IDictionary<string, object?>? arguments)
    {
        if (_executors.TryGetValue(name, out var executor))
            return await executor(arguments);

        return $"Tool '{name}' not found";
    }

    [Description("Get the current weather for a given city")]
    private static Task<string> GetCurrentWeather(
        [Description("The city name")] string city)
    {
        var weathers = new[] { "Sunny", "Cloudy", "Rainy", "Snowy", "Windy", "Partly Cloudy" };
        var random = new Random();
        var temp = random.Next(-5, 35);
        var weather = weathers[random.Next(weathers.Length)];
        var humidity = random.Next(20, 95);

        return Task.FromResult(JsonSerializer.Serialize(new
        {
            city,
            temperature = $"{temp}°C",
            condition = weather,
            humidity = $"{humidity}%",
            wind = $"{random.Next(0, 50)} km/h"
        }));
    }

    [Description("Search the web for information on a topic")]
    private static Task<string> SearchWeb(
        [Description("The search query")] string query)
    {
        var results = new[]
        {
            new { title = $"Top results for: {query}", url = "https://example.com/1", snippet = $"Comprehensive information about {query}..." },
            new { title = $"{query} - Wikipedia", url = "https://en.wikipedia.org/wiki/Example", snippet = $"A detailed overview of {query} covering history, usage, and more." },
            new { title = $"Latest news on {query}", url = "https://news.example.com", snippet = $"Breaking news and updates related to {query}." }
        };

        return Task.FromResult(JsonSerializer.Serialize(new { query, results, totalResults = 3 }));
    }

    [Description("Get the current date and time")]
    private static Task<string> GetCurrentTime()
    {
        return Task.FromResult(JsonSerializer.Serialize(new
        {
            utc = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
            local = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            timezone = TimeZoneInfo.Local.DisplayName
        }));
    }

    [Description("Perform a mathematical calculation")]
    private static Task<string> Calculate(
        [Description("The mathematical expression to evaluate")] string expression)
    {
        try
        {
            var result = new System.Data.DataTable().Compute(expression, null);
            return Task.FromResult(JsonSerializer.Serialize(new { expression, result = result?.ToString() }));
        }
        catch (Exception ex)
        {
            return Task.FromResult(JsonSerializer.Serialize(new { expression, error = ex.Message }));
        }
    }

    [Description("Translate text to another language")]
    private static Task<string> TranslateText(
        [Description("The text to translate")] string text,
        [Description("The target language code (e.g., 'tr', 'en', 'de', 'fr')")] string targetLanguage)
    {
        return Task.FromResult(JsonSerializer.Serialize(new
        {
            original = text,
            targetLanguage,
            translated = $"[Translated to {targetLanguage}]: {text}",
            note = "This is a simulated translation. In production, connect to a real translation API."
        }));
    }
}
