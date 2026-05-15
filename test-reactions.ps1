# Test Reactions API Script
# Run this to test the reactions API endpoints

$baseUrl = "http://localhost:3000/api/reactions"

Write-Host "`n🧪 Testing Reactions API...`n" -ForegroundColor Cyan

# Test 1: Add a "like" reaction
Write-Host "📝 Test 1: Add 'like' reaction..." -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"test-user-456","type":"like"}'
Write-Host "Response: $($response1 | ConvertTo-Json -Depth 5)" -ForegroundColor Green

# Test 2: Update to "love" reaction
Write-Host "`n❤️ Test 2: Update to 'love' reaction..." -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"test-user-456","type":"love"}'
Write-Host "Response: $($response2 | ConvertTo-Json -Depth 5)" -ForegroundColor Green

# Test 3: Add different reactions from different users
Write-Host "`n👥 Test 3: Add reactions from different users..." -ForegroundColor Yellow
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"user-1","type":"wow"}' | Out-Null
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"user-2","type":"haha"}' | Out-Null
Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body '{"postId":"test-post-123","userId":"user-3","type":"sad"}' | Out-Null
Write-Host "✅ Added 3 more reactions" -ForegroundColor Green

# Test 4: Get all reactions for the post
Write-Host "`n📊 Test 4: Get reactions for post..." -ForegroundColor Yellow
$response4 = Invoke-RestMethod -Uri "$baseUrl?postId=test-post-123" -Method GET
Write-Host "Total Reactions: $($response4.total)" -ForegroundColor Green
Write-Host "Reaction Counts: $($response4.counts | ConvertTo-Json)" -ForegroundColor Green

# Test 5: Delete a reaction
Write-Host "`n🗑️  Test 5: Delete reaction..." -ForegroundColor Yellow
$response5 = Invoke-RestMethod -Uri "$baseUrl?postId=test-post-123&userId=test-user-456" -Method DELETE
Write-Host "Response: $($response5 | ConvertTo-Json)" -ForegroundColor Green

# Test 6: Verify deletion
Write-Host "`n✅ Test 6: Verify deletion..." -ForegroundColor Yellow
$response6 = Invoke-RestMethod -Uri "$baseUrl?postId=test-post-123" -Method GET
Write-Host "Total Reactions After Delete: $($response6.total)" -ForegroundColor Green

Write-Host "`n🎉 All tests completed!`n" -ForegroundColor Cyan
