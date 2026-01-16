# 🎯 Next Session: Deploy Flight Tracker (Experiment 6)

## Quick Start

The repo is ready to deploy. Everything is set up in:
`/Users/jameswhitford/CODE/ritza/ritza/code/flight-tracker-kernel/`

## What to Do

### 1. Test Locally First (5 minutes)

```bash
cd /Users/jameswhitford/CODE/ritza/ritza/code/flight-tracker-kernel
npm install

# Add your OpenAI key to .env
echo "KERNEL_API_KEY=sk_3eefd849-4a71-43c2-98a7-9ef77f3d9fb5.Qr0qINkERvCQBj77uEjFJ/t7W62RHFQWM914iuUmAgY" > .env
echo "OPENAI_API_KEY=your_key_here" >> .env

# Run test (uses local browser)
npm run check-flights
```

**Expected result:** README.md updates with price table, price-history.json created

### 2. Push to GitHub (2 minutes)

```bash
cd /Users/jameswhitford/CODE/ritza/ritza/code/flight-tracker-kernel

git init
git add .
git commit -m "Initial commit - automated flight tracker"

# Create repo (replace YOUR_USERNAME)
gh repo create flight-tracker-kernel --public --source=. --remote=origin --push
```

### 3. Add GitHub Secrets (1 minute)

```bash
# Add secrets via CLI
gh secret set KERNEL_API_KEY -b"sk_3eefd849-4a71-43c2-98a7-9ef77f3d9fb5.Qr0qINkERvCQBj77uEjFJ/t7W62RHFQWM914iuUmAgY"
gh secret set OPENAI_API_KEY -b"your_openai_key_here"
```

Or add via GitHub UI: Settings → Secrets → Actions → New secret

### 4. Trigger Workflow (5 minutes)

1. Go to **Actions** tab on GitHub
2. Click **"Check Flight Prices"**
3. Click **"Run workflow"**
4. Watch it run
5. Wait for commit with updated README

### 5. Document Results

Take screenshots of:
- ✅ Workflow running in GitHub Actions
- ✅ Updated README with price table
- ✅ price-history.json with data
- ✅ Kernel dashboard showing video replay (if available)

## What This Demonstrates

**Experiment 6: Production Deployment**

The evolution:
1. **Experiment 4:** Static extraction (one page)
2. **Experiment 5:** Autonomous navigation (local browser)
3. **Experiment 6:** Cloud automation (unattended, scheduled)

Key capabilities shown:
- ☁️ Kernel cloud browser (no laptop needed)
- 🤖 Stagehand agent running in CI/CD
- ⏰ GitHub Actions scheduling
- 📊 Persistent results (README updates)
- 📹 Video replays for debugging
- 🔄 Continuous monitoring (daily checks)

## Article Narrative

"Experiment 5 proved the agent works locally. Now we deploy it to run unattended in the cloud every day."

**The payoff:** From cool demo → actually useful automation

## Files Ready to Go

```
flight-tracker-kernel/
├── src/check-flights.ts          # Main script (Stagehand + Kernel)
├── .github/workflows/            # GitHub Actions workflow
│   └── check-flights.yml
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── .env.example                  # Env template
├── .gitignore                    # Git ignores
└── README.md                     # Will be auto-updated
```

## Troubleshooting

**If workflow fails:**
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. View Kernel video replay in dashboard

**If prices don't parse:**
- Agent result format might vary
- Check logs for agent's raw output
- Adjust regex in `parseAgentResult()` if needed

## Cost Estimate

Per run:
- Stagehand (gpt-4o): ~$0.50
- Kernel browser session: ~$0.10
- **Total: ~$0.60/day or $18/month**

For demo purposes, run manually a few times, don't leave scheduled.

## Documentation Checklist

For article:
- [ ] Screenshot: Workflow running
- [ ] Screenshot: Updated README with prices
- [ ] Screenshot: price-history.json
- [ ] Screenshot: Kernel video replay
- [ ] Update experiment-log.md with Experiment 6 results
- [ ] Write narrative: "From local to cloud"
- [ ] Highlight: This is the complete automation stack

## Quick Commands

```bash
# Setup repo
cd /Users/jameswhitford/CODE/ritza/ritza/code/flight-tracker-kernel

# Test local
npm run check-flights

# Create GitHub repo
gh repo create flight-tracker-kernel --public --source=. --remote=origin --push

# Add secrets
gh secret set KERNEL_API_KEY -b"sk_3eefd849-4a71-43c2-98a7-9ef77f3d9fb5.Qr0qINkERvCQBj77uEjFJ/t7W62RHFQWM914iuUmAgY"
gh secret set OPENAI_API_KEY -b"your_key_here"

# Trigger workflow
gh workflow run check-flights.yml

# View workflow status
gh run list
gh run view --log
```

## Success = ✅

You'll know it worked when:
1. Workflow completes without errors
2. New commit appears: "Update flight prices - [timestamp]"
3. README shows price table with 4 destinations
4. price-history.json contains price data
5. Kernel dashboard shows video replay

Then document the results in experiment-log.md!
