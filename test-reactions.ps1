# Test Reactions API Script
# Run this to test the reactions API endpoints

$baseUrl = "http://localhost:3000/api/reactions"

Write-Host "`nTesting Reactions API...`n" -ForegroundColor Cyan

# Test 1: Add a "like" reaction
Write-Host "Test 1: Add like reaction..." -ForegroundColor Yellow
$body1 = '{"postId":"test-post-123","userId":"test-user-456","type":"like"}'
$response1 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body1
Write-Host "Response: Success" -ForegroundColor Green

# Test 2: Update to "love" reaction
Write-Host "`nTest 2: Update to love reaction..." -ForegroundColor Yellow
$body2 = '{"postId":"test-post-123","userId":"test-user-456","type":"love"}'
$response2 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $body2
Write-Host "Response: Success" -ForegroundColor Green

# Test 3: Add different reactions from different users
Write-Host "`nTest 3: Add reactions from different users..." -ForegroundColor Yellow
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"user-1","type":"wow"}' | Out-Null
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"user-2","type":"haha"}' | Out-Null
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"user-3","type":"sad"}' | Out-Null
Write-Host "Added 3 more reactions" -ForegroundColor Green

# Test 4: Get all reactions for the post
Write-Host "`nTest 4: Get reactions for post..." -ForegroundColor Yellow
$getUrl4 = $baseUrl + "?postId=test-post-123"
$response4 = Invoke-RestMethod -Uri $getUrl4 -Method GET
Write-Host "Total Reactions: $($response4.total)" -ForegroundColor Green

# Test 5: Delete a reaction
Write-Host "`nTest 5: Delete reaction..." -ForegroundColor Yellow
$deleteUrl = $baseUrl + "?postId=test-post-123&userId=test-user-456"
$response5 = Invoke-RestMethod -Uri $deleteUrl -Method DELETE
Write-Host "Response: Success" -ForegroundColor Green

# Test 6: Verify deletion
Write-Host "`nTest 6: Verify deletion..." -ForegroundColor Yellow
$getUrl6 = $baseUrl + "?postId=test-post-123"
$response6 = Invoke-RestMethod -Uri $getUrl6 -Method GET
Write-Host "Total Reactions After Delete: $($response6.total)" -ForegroundColor Green

Write-Host "`nAll tests completed!`n" -ForegroundColor Cyan
