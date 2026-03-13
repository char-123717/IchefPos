Param(
    [string]$GitHubUser = "",
    [string]$RepoName = "ichef-pos"
)

if (-not $GitHubUser) {
    $GitHubUser = Read-Host "Enter your GitHub username (or organization)"
}

$remote = "https://github.com/$GitHubUser/$RepoName.git"
Write-Host "Adding remote: $remote"
Set-Location -LiteralPath 'D:\Project\ichef pos'
git remote add origin $remote
git branch -M main
git push -u origin main

Write-Host "If push fails, ensure you've created the repo on GitHub and authenticated (HTTPS credentials or PAT)."
