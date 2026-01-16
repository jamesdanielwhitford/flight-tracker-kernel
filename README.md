# ✈️ Automated Flight Tracker

This repository demonstrates **AI-powered browser automation** using [Stagehand](https://github.com/browserbase/stagehand) + [Kernel](https://kernel.community/) + GitHub Actions.

## 🎯 What It Does

Every day at 9:00 AM UTC, a Kernel cloud browser:
1. Autonomously searches Google Flights for 4 Greek destinations
2. Compares prices from Johannesburg
3. Updates this README with the latest prices
4. Tracks price changes over time

**No hardcoded selectors.** The agent figures out how to navigate Google Flights using natural language instructions.

## 📊 Latest Prices

*Prices will appear here after first run*

**Route:** Johannesburg → Greek Islands
**Dates:** June 7-14, 2026
**Last checked:** Never

## 🚀 How It Works

### Tech Stack

- **[Stagehand](https://github.com/browserbase/stagehand)** - AI browser automation framework
- **[Kernel](https://kernel.community/)** - Cloud browser infrastructure with video replays
- **GitHub Actions** - Scheduled automation (cron)

### The Agent

The autonomous agent receives this instruction:

> "Find the cheapest flight from Johannesburg to Greek islands in June 2026. Search Athens, Santorini, Mykonos, and Heraklion. For each: fill the search form, select dates, extract the cheapest price. Compare all results."

No step-by-step navigation. No CSS selectors. Just a goal.

The agent:
- ✅ Handles autocomplete dropdowns
- ✅ Navigates date picker UI
- ✅ Waits for results to load
- ✅ Extracts prices reliably
- ✅ Self-heals when UI changes

## 📹 Video Replays

Every run is recorded by Kernel. View the browser session to see exactly what happened.

## 🛠️ Setup

See [SETUP.md](../SETUP.md) for detailed instructions.

## 📝 What This Demonstrates

This experiment showcases capabilities **impossible with traditional scraping**:

### 🎭 Autonomous Navigation
No hardcoded selectors. The agent adapts when Google Flights UI changes.

### 🧠 Complex Form Interaction
Handles autocomplete, date pickers, dynamic loading - UI elements that break traditional scrapers.

### 🔄 Multi-Step Reasoning
Agent doesn't just "click buttons" - it plans: "search these 4 destinations, compare, recommend cheapest."

### ☁️ Cloud Automation
Runs on Kernel cloud browsers - no laptop needed. Scheduled with GitHub Actions.

### 📹 Observability
Video replays show exactly what the agent did. Debug visually, not by reading logs.

---

**Powered by:** [Stagehand](https://github.com/browserbase/stagehand) + [Kernel](https://kernel.community/)
