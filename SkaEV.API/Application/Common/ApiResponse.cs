namespace SkaEV.API.Application.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T Data { get; set; }
    public List<string> Errors { get; set; }

    public ApiResponse()
    {
        Success = true;
        Errors = new List<string>();
    }

    public ApiResponse(T data, string? message = null)
    {
        Success = true;
        Message = message;
        Data = data;
        Errors = new List<string>();
    }

    public ApiResponse(string? message)
    {
        Success = false;
        Message = message;
        Errors = new List<string>();
    }
    
    public static ApiResponse<T> Ok(T data, string? message = null) => new ApiResponse<T>(data, message);
    public static ApiResponse<T> Fail(string? message, List<string>? errors = null) 
    {
        var response = new ApiResponse<T>(message);
        if (errors != null) response.Errors = errors;
        return response;
    }
}
