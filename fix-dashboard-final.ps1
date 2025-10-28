# Fix Dashboard.jsx - Vietnamese encoding and functionality
$ErrorActionPreference = "Stop"
$filePath = "d:\llll\ky5\SWP\prj1\FPTU_FA25_SWP391_G4_Topic3_SkaEV\src\pages\admin\Dashboard.jsx"

Write-Host "Reading file with UTF-8 encoding..." -ForegroundColor Yellow
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

Write-Host "Original content length: $($content.Length) characters" -ForegroundColor Cyan

# Fix: Change FAB button from Notifications to Add icon and open addDialogOpen
Write-Host "Fixing FAB button behavior..." -ForegroundColor Yellow
$content = $content -replace '<Fab\s+color="primary"\s+sx=\{\{\s*position:\s*"fixed",\s*bottom:\s*24,\s*right:\s*24\s*\}\}\s+onClick=\{\(\)\s*=>\s*setOpenStationDialog\(true\)\}\s*>\s*<Notifications\s*/>\s*</Fab>', '<Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setAddDialogOpen(true)}
      >
        <Add />
      </Fab>'

# Add "Thêm trạm sạc" button to header (after Typography)
Write-Host "Adding station button to header..." -ForegroundColor Yellow
$headerPattern = '(<Typography variant="body1" color="text\.secondary">\s*Giám sát và quản lý mạng lưới sạc SkaEV\s*</Typography>\s*</Box>)'
$headerReplacement = '$1
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
          sx={{ height: "fit-content" }}
        >
          Thêm trạm sạc
        </Button>'

if ($content -match $headerPattern) {
    Write-Host "Found header section, adding button..." -ForegroundColor Green
    $content = $content -replace $headerPattern, $headerReplacement
} else {
    Write-Host "Header pattern not found, trying alternative..." -ForegroundColor Yellow
}

Write-Host "Writing file back with UTF-8 (no BOM)..." -ForegroundColor Yellow
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $content, $utf8NoBOM)

Write-Host "✓ File processing complete!" -ForegroundColor Green
Write-Host "Please check the file in VS Code and reload browser" -ForegroundColor Cyan
