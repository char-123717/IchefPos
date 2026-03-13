# ichef-pos

This repository contains the iChef POS project (backend, frontend, mobile).

How to push to GitHub

1. Create a new repository named `ichef-pos` on GitHub (public).
2. On this machine, run the script `create_remote_and_push.ps1` in the project root and follow prompts, or run these commands replacing `<USERNAME>`:

```powershell
Set-Location -LiteralPath 'D:\Project\ichef pos'
git remote add origin https://github.com/<USERNAME>/ichef-pos.git
git branch -M main
git push -u origin main
```

If you prefer using the GitHub website: create the repo, then copy the remote URL and run the commands above.

Notes
- This repo was initialized locally and initial commit created.
- If `git commit` required a name/email they were set locally to a placeholder. You may update them with `git config user.name "Your Name"` and `git config user.email "you@example.com"`.
