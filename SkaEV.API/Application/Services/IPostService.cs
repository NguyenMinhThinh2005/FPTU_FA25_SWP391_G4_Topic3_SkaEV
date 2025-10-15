using SkaEV.API.Application.DTOs.Posts;

namespace SkaEV.API.Application.Services;

public interface IPostService
{
    Task<IEnumerable<PostDto>> GetStationPostsAsync(int stationId);
    Task<IEnumerable<PostDto>> GetAvailablePostsAsync(int stationId);
    Task<PostDto?> GetPostByIdAsync(int postId);
    Task<PostDto> CreatePostAsync(CreatePostDto createDto);
    Task<PostDto> UpdatePostAsync(int postId, UpdatePostDto updateDto);
    Task DeletePostAsync(int postId);
    Task<PostDto> UpdatePostStatusAsync(int postId, string status);
    Task<PostAvailabilitySummaryDto> GetAvailabilitySummaryAsync(int stationId);
}
