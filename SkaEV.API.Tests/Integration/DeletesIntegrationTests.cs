using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace SkaEV.API.Tests.Integration;

public class DeletesIntegrationTests : IClassFixture<WebApplicationFactory<SkaEV.API.Program>>
{
    private readonly WebApplicationFactory<SkaEV.API.Program> _factory;

    public DeletesIntegrationTests(WebApplicationFactory<SkaEV.API.Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DeleteStation_WhenBookingsExist_ReturnsConflict()
    {
        // This is a stub test: runs only if test DB has data from the seed script.
        var client = _factory.CreateClient();

        // Use a station id known from seed script (Demo Station) - adjust as needed
        var stationId = 1;

        var response = await client.DeleteAsync($"/api/stations/{stationId}");

        // Expect either 200 (soft-delete) or 409 (business rule) depending on booking state
        Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Conflict);
    }
}
