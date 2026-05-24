# How to push this to your GitHub repo

Your repo `Closira-assignment-product` is currently empty (just a README
heading). Here's the clean way to populate it with this codebase and end
up with a tidy commit history.

## Option A — fresh push with a clean history (recommended)

From the unzipped `closira/` folder:

```bash
cd closira

# Initialise git, point at your existing repo
git init
git branch -M main
git remote add origin https://github.com/<your-username>/Closira-assignment-product.git

# Stage in logical commits (clean history is a strong submission signal)
git add backend/
git commit -m "feat(backend): FastAPI service with async SOP-matching worker"

git add frontend/
git commit -m "feat(frontend): React Native dashboard with 5 screens and bottom-tab nav"

git add README.md
git commit -m "docs: combined top-level README"

# Force-push because the remote currently has the placeholder README
git push -u origin main --force
```

## Option B — keep the existing remote README, add on top

```bash
cd closira

git init
git branch -M main
git remote add origin https://github.com/<your-username>/Closira-assignment-product.git

git pull origin main --allow-unrelated-histories

git add .
git commit -m "feat: complete backend + frontend submission"
git push -u origin main
```

## Verifying the push

After pushing, check that:

1. `/backend` and `/frontend` are both visible at the repo root.
2. The top-level `README.md` renders (GitHub picks it up automatically).
3. The commit graph shows three (or more) meaningful messages, not a
   single "init" blob.

## Recording the walkthrough video

Use the script in the root README's "Walkthrough script" section. QuickTime
on macOS, OBS on Linux/Windows, or the screen-recorder on your phone are
all fine. Upload to Drive / YouTube unlisted / Loom and link from the
final submission email.

## Final submission checklist

- [ ] Repo is pushed and publicly accessible (or shared with the reviewer's
      GitHub handle)
- [ ] `README.md` at the root renders cleanly on GitHub
- [ ] `backend/README.md` and `frontend/README.md` render cleanly
- [ ] Commit history is tidy (logical commits, descriptive messages)
- [ ] Walkthrough video link added to your submission email
- [ ] Submitted before the 48-hour deadline
