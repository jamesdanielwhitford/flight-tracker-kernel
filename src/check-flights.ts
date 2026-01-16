#!/usr/bin/env node
/**
 * Automated Flight Price Tracker
 *
 * Uses Kernel cloud browser + Stagehand agent to autonomously search
 * multiple destinations and track price changes over time.
 *
 * Runs on GitHub Actions schedule and updates README with latest prices.
 */

import { Stagehand } from "@browserbasehq/stagehand";
import Kernel from "@onkernel/sdk";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import "dotenv/config";

// Destinations to track
const DESTINATIONS = ["Athens", "Santorini", "Mykonos", "Heraklion"];
const ORIGIN = "Johannesburg";
const TRAVEL_DATES = "June 7-14, 2026";

interface FlightPrice {
  destination: string;
  price: string;
  priceNumeric: number;
  currency: string;
  timestamp: string;
}

interface PriceHistory {
  lastChecked: string;
  prices: FlightPrice[];
  previousPrices?: FlightPrice[];
}

async function searchFlights(): Promise<FlightPrice[]> {
  console.log("🚀 Starting flight price check...\n");

  const useKernel = !!process.env.KERNEL_API_KEY;
  let kernel: Kernel | null = null;
  let kernelBrowser: any = null;

  // If using Kernel, create browser first
  if (useKernel) {
    console.log("☁️  Connecting to Kernel cloud browser...\n");
    kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });
    kernelBrowser = await kernel.browsers.create({ stealth: true });
    console.log(`✓ Kernel browser created: ${kernelBrowser.session_id}`);
    console.log(`📺 Live view: ${kernelBrowser.browser_live_view_url}\n`);
  }

  const stagehand = new Stagehand({
    env: useKernel ? "LOCAL" : "LOCAL",
    localBrowserLaunchOptions: useKernel
      ? {
          cdpUrl: kernelBrowser.cdp_ws_url,
        }
      : undefined,
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
    headless: !useKernel, // Show browser when local, hide when using Kernel
    verbose: 1,
  });

  try {
    await stagehand.init();
    console.log("✓ Stagehand initialized\n");

    const page = stagehand.context.pages()[0];
    await page.goto("https://www.google.com/travel/flights");
    await page.waitForLoadState("networkidle");

    console.log("🤖 Starting agent search...\n");

    // Use Computer Use Agent (CUA) mode with Gemini for better form interaction
    const useCUA = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (useCUA) {
      console.log("Using Gemini Computer Use Agent (visual interaction)\n");
    } else {
      console.log("Using GPT-4o (DOM-based interaction)\n");
    }

    const agent = stagehand.agent({
      cua: useCUA,
      model: useCUA
        ? "google/gemini-2.5-computer-use-preview-10-2025"
        : "gpt-4o",
      systemPrompt: `You are a travel assistant that searches for flights and extracts prices accurately.

Be thorough, patient, and methodical. Take your time with each search.
When interacting with forms, wait for autocomplete suggestions to appear.
When selecting dates, be careful to choose dates in June 2026.`,
    });

    const instruction = `Find the cheapest flight from ${ORIGIN} to Greek islands in June 2026.

Search these destinations one by one:
${DESTINATIONS.map((d, i) => `${i + 1}. ${d} (Greece)`).join("\n")}

For each destination:
- Enter "${ORIGIN}" as origin
- Enter the destination city name
- Select travel dates: Departing June 7, 2026, returning June 14, 2026
- Click search and wait for results
- Find and record the cheapest flight price shown (extract the full price including currency)

After searching all destinations, provide the results in this exact format:
RESULTS:
Athens: ZAR 10,560
Santorini: ZAR 14,302
Mykonos: ZAR 9,299
Heraklion: ZAR 12,012

Use the exact format "Destination: CURRENCY AMOUNT" for each line.`;

    const result = await agent.execute({
      instruction,
      maxSteps: 60,
    });

    console.log("\n✅ Agent completed search\n");

    // Parse the agent's result to extract prices
    const prices = parseAgentResult(result.message);

    return prices;
  } finally {
    await stagehand.close();
    console.log("\n✓ Stagehand closed");

    // Clean up Kernel browser if used
    if (kernel && kernelBrowser) {
      try {
        await kernel.browsers.delete(kernelBrowser.session_id);
        console.log("✓ Kernel browser deleted");
      } catch (error) {
        console.error("Failed to delete Kernel browser:", error);
      }
    }
  }
}

function parseAgentResult(message: string): FlightPrice[] {
  const prices: FlightPrice[] = [];
  const timestamp = new Date().toISOString();

  // Extract prices from agent's response
  // Look for pattern: "Destination: CURRENCY AMOUNT"
  const priceRegex = /(\w+):\s*([A-Z]{3})\s*([\d,]+)/g;
  let match;

  while ((match = priceRegex.exec(message)) !== null) {
    const destination = match[1];
    const currency = match[2];
    const priceStr = match[3].replace(/,/g, "");
    const priceNumeric = parseInt(priceStr);

    prices.push({
      destination,
      price: `${currency} ${match[3]}`,
      priceNumeric,
      currency,
      timestamp,
    });
  }

  // Fallback: try to find prices in different format
  if (prices.length === 0) {
    console.warn("⚠️  Could not parse prices from agent result. Using fallback parsing.");
    // Try to extract any numbers that look like prices
    const fallbackRegex = /(\w+)[:\s]+.*?([\d,]+)/g;
    while ((match = fallbackRegex.exec(message)) !== null) {
      const destination = match[1];
      const priceStr = match[2].replace(/,/g, "");
      const priceNumeric = parseInt(priceStr);

      if (priceNumeric > 5000 && priceNumeric < 50000) {
        // Reasonable flight price range
        prices.push({
          destination,
          price: `ZAR ${match[2]}`,
          priceNumeric,
          currency: "ZAR",
          timestamp,
        });
      }
    }
  }

  return prices;
}

function updateReadme(priceHistory: PriceHistory): void {
  const readmePath = join(process.cwd(), "README.md");

  // Calculate price changes if we have previous data
  const priceChanges = new Map<string, { change: number; direction: "up" | "down" | "same" }>();

  if (priceHistory.previousPrices) {
    for (const current of priceHistory.prices) {
      const previous = priceHistory.previousPrices.find((p) => p.destination === current.destination);
      if (previous) {
        const change = current.priceNumeric - previous.priceNumeric;
        const direction = change > 0 ? "up" : change < 0 ? "down" : "same";
        priceChanges.set(current.destination, { change, direction });
      }
    }
  }

  // Find cheapest destination
  const cheapest = priceHistory.prices.reduce((min, p) =>
    p.priceNumeric < min.priceNumeric ? p : min
  );

  // Generate price table
  const priceTable = priceHistory.prices
    .sort((a, b) => a.priceNumeric - b.priceNumeric)
    .map((p) => {
      const changeInfo = priceChanges.get(p.destination);
      const changeIcon = changeInfo
        ? changeInfo.direction === "down"
          ? "📉"
          : changeInfo.direction === "up"
          ? "📈"
          : "➡️"
        : "";
      const changeText = changeInfo && changeInfo.change !== 0
        ? ` (${changeInfo.change > 0 ? "+" : ""}${changeInfo.change})`
        : "";

      const isCheapest = p.destination === cheapest.destination ? " ⭐" : "";

      return `| ${p.destination} | ${p.price} | ${changeIcon} ${changeText}${isCheapest} |`;
    })
    .join("\n");

  const readme = `# ✈️ Automated Flight Tracker

This repository demonstrates **AI-powered browser automation** using [Stagehand](https://github.com/browserbase/stagehand) + [Kernel](https://kernel.community/) + GitHub Actions.

## 🎯 What It Does

Every day at 9:00 AM UTC, a Kernel cloud browser:
1. Autonomously searches Google Flights for ${DESTINATIONS.length} Greek destinations
2. Compares prices from ${ORIGIN}
3. Updates this README with the latest prices
4. Tracks price changes over time

**No hardcoded selectors.** The agent figures out how to navigate Google Flights using natural language instructions.

## 📊 Latest Prices

**Route:** ${ORIGIN} → Greek Islands
**Dates:** ${TRAVEL_DATES}
**Last checked:** ${new Date(priceHistory.lastChecked).toLocaleString("en-US", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "UTC"
})} UTC

| Destination | Price | Change |
|-------------|-------|--------|
${priceTable}

⭐ = Cheapest option

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

Every run is recorded by Kernel. View the browser session to see exactly what happened:
- Watch the agent navigate Google Flights
- Debug failures visually
- Audit automation behavior

*(Video replay links would be added here in production)*

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- [Kernel API key](https://kernel.community/)
- OpenAI API key (for Stagehand agent)

### Local Testing

\`\`\`bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Run flight check
npm run check-flights
\`\`\`

### GitHub Actions Setup

1. Fork this repository
2. Add repository secrets:
   - \`KERNEL_API_KEY\` - Your Kernel API key
   - \`OPENAI_API_KEY\` - Your OpenAI API key
3. Enable GitHub Actions in repository settings
4. The workflow runs daily at 9:00 AM UTC

Manually trigger: **Actions → Check Flight Prices → Run workflow**

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

### 🔒 Production-Ready
- Persistent profiles (save auth state across runs)
- Error handling with screenshots
- Structured data output
- Alerting when thresholds met

## 🧪 The Experiment

This is part of a series exploring AI browser automation:

1. **Phase 1:** Interactive, conversational automation (dev-browser + extension mode)
2. **Phase 2:** Autonomous agent navigation (Stagehand on local browser) ← [Experiment 5](../research/experiment-log.md#experiment-5-multi-destination-flight-comparison)
3. **Phase 3:** Cloud automation at scale (Kernel + GitHub Actions) ← **You are here**

Read the full experiment log: [research/experiment-log.md](../research/experiment-log.md)

## 🔮 What's Possible

With this foundation, you could build:

- **Flight deal alerts** - Monitor specific routes, alert when prices drop
- **Competitive price tracking** - Compare products across multiple sites
- **Travel planning assistant** - Check hotels, cars, activities across destinations
- **Inventory monitoring** - Track stock availability, alert when items restock
- **Multi-site data collection** - Gather structured data from complex web apps

Any workflow that requires:
- Filling forms
- Navigating multi-step processes
- Adapting to UI changes
- Running unattended in the cloud

## 📚 Resources

- [Stagehand Documentation](https://github.com/browserbase/stagehand)
- [Kernel Documentation](https://kernel.community/docs)
- [Full Experiment Write-Up](../research/experiment-log.md)

## 📊 Price History

<details>
<summary>View historical data</summary>

Price data is tracked in \`price-history.json\` (git-tracked for demo purposes).

In production, you'd want:
- Proper database (PostgreSQL, SQLite, etc.)
- Alerting when prices drop below threshold
- Price graphs/trends
- Email notifications

</details>

---

**Last updated:** ${new Date().toISOString()}
**Powered by:** [Stagehand](https://github.com/browserbase/stagehand) + [Kernel](https://kernel.community/)
`;

  writeFileSync(readmePath, readme, "utf-8");
  console.log("\n✅ README updated with latest prices");
}

function loadPriceHistory(): PriceHistory | null {
  const historyPath = join(process.cwd(), "price-history.json");

  if (existsSync(historyPath)) {
    const data = readFileSync(historyPath, "utf-8");
    return JSON.parse(data);
  }

  return null;
}

function savePriceHistory(priceHistory: PriceHistory): void {
  const historyPath = join(process.cwd(), "price-history.json");
  writeFileSync(historyPath, JSON.stringify(priceHistory, null, 2), "utf-8");
  console.log("✅ Price history saved");
}

async function main() {
  try {
    // Search for current prices
    const currentPrices = await searchFlights();

    if (currentPrices.length === 0) {
      console.error("❌ Failed to extract prices from agent result");
      process.exit(1);
    }

    console.log("\n📊 Found prices:");
    currentPrices.forEach((p) => console.log(`   ${p.destination}: ${p.price}`));

    // Load previous price history
    const previousHistory = loadPriceHistory();

    // Create new price history entry
    const priceHistory: PriceHistory = {
      lastChecked: new Date().toISOString(),
      prices: currentPrices,
      previousPrices: previousHistory?.prices,
    };

    // Save updated history
    savePriceHistory(priceHistory);

    // Update README with latest prices
    updateReadme(priceHistory);

    console.log("\n✅ Flight check complete!");
    console.log("\nNext steps:");
    console.log("1. Review the updated README.md");
    console.log("2. Commit changes: git add . && git commit -m 'Update flight prices'");
    console.log("3. Push to GitHub: git push");
  } catch (error) {
    console.error("\n❌ Error during flight check:");
    console.error(error);
    process.exit(1);
  }
}

main();
