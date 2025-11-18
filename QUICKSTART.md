# Quick Start Guide

Get Signal Recorder v2 up and running in 10 minutes.

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Supabase account](https://supabase.com) (free tier works)
- [OpenAI API key](https://platform.openai.com/)
- Chrome browser

## Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Get your credentials:

**Supabase:**
1. Create new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy URL and keys

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Create API key

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-your_openai_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Initialize Database

Open Supabase Dashboard → SQL Editor, run:

```sql
-- Copy and paste content from:
-- supabase/migrations/001_init_schema.sql
-- then
-- supabase/migrations/002_rpc_functions.sql
```

Or using CLI:
```bash
npx supabase db push
```

### 4. Build & Run

```bash
# Build extension
npm run build:extension

# Start web app
npm run dev
```

Visit `http://localhost:3000`

### 5. Load Extension

1. Open Chrome → `chrome://extensions`
2. Toggle "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/dist/` folder

## First Workflow (3 minutes)

### Option A: Record a Workflow

1. **Open Extension**: Click extension icon in Chrome toolbar
2. **Configure**:
   - Supabase URL: `https://your-project.supabase.co`
   - Access Token: Your anon key
   - Click "Save Configuration"
3. **Record**:
   - Click "Start Recording"
   - Navigate to any website (e.g., `google.com`)
   - Perform a search
   - Click a result
   - Click "Stop Recording"
4. **View**: Events saved to Supabase!

### Option B: Create Manually

1. **Sign Up**: Go to `http://localhost:3000/auth/login`
2. **Dashboard**: Click "New Workflow"
3. **Add Steps**:
   - Name: "Google Search Test"
   - Add Step → Type: "goto" → URL: `https://google.com`
   - Add Step → Type: "type" → Selector: `input[name="q"]` → Text: "test"
   - Add Step → Type: "click" → Selector: `button[type="submit"]`
4. **Save**: Click "Save"

### Option C: AI Generation

1. **Dashboard**: Click "Generate with AI"
2. **Describe Goal**:
```
Search Google for "browser automation", 
click the first result, 
and scrape the page title
```
3. **Generate**: Click "Generate Workflow"
4. **Review & Save**: Review steps → Click "Save Workflow"

## First Execution (2 minutes)

### Run a Workflow

1. **Dashboard**: Click play icon next to workflow
2. **Start**: Click "Start Execution"
3. **Extension**: Open extension popup
4. **Load**: Enter workflow ID (or select from list if implemented)
5. **Execute**: Steps run automatically!

### Supervised Mode

1. **Enable**: Workflow Settings → "Supervised Mode" ✓
2. **Run**: Start execution
3. **Approve**: Click "Approve Next Step" for each step
4. **Monitor**: Watch logs in real-time

## Common Tasks

### Export Events to Workflow

After recording events:

```sql
-- In Supabase SQL Editor
SELECT create_workflow_from_events(
  'your-session-id-here',
  'My Recorded Workflow',
  'Description here'
);
```

### Test Selectors

Open browser console on any page:

```javascript
// Test if selector finds element
document.querySelector('button.submit');

// Count matches
document.querySelectorAll('.result-item').length;

// Test with fallback
document.querySelector('button[type="submit"]') || 
document.querySelector('.submit-button');
```

### View Realtime Logs

While workflow runs:

```javascript
// In browser console on workflow run page
// Logs update automatically via Supabase Realtime
```

## Troubleshooting

### "Cannot connect to Supabase"
- ✓ Check `.env.local` has correct values
- ✓ Verify Supabase project is active
- ✓ Check browser console for errors

### "Extension not loading"
- ✓ Run `npm run build:extension`
- ✓ Reload extension in `chrome://extensions`
- ✓ Check for errors in extension console

### "Selector not found"
- ✓ Inspect element in DevTools
- ✓ Copy accurate selector
- ✓ Add wait step before action
- ✓ Use multiple fallback selectors

### "AI generation failed"
- ✓ Verify OpenAI API key
- ✓ Check API quota/credits
- ✓ Try simpler goal first
- ✓ Check logs in terminal

## Next Steps

### Learn More
- [Full Documentation](README.md)
- [Example Workflows](EXAMPLES.md)
- [Architecture](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)

### Explore Features
- Create complex workflows with loops and conditionals
- Use AI to generate workflows from natural language
- Set up scheduled workflow execution
- Integrate with external APIs
- Build custom agent tools

### Customize
- Add custom step types
- Create workflow templates
- Build platform-specific selectors
- Extend AI agent capabilities

### Deploy
- Deploy web app to Vercel
- Publish extension to Chrome Web Store
- Set up production database
- Configure monitoring

## Example Workflows to Try

### 1. Simple Search
```
1. Go to google.com
2. Type "hello world" in search
3. Click search button
4. Wait 2 seconds
```

### 2. Form Filling
```
1. Go to form URL
2. Type name in input[name="name"]
3. Type email in input[name="email"]
4. Click submit button
```

### 3. Data Scraping
```
1. Go to product page
2. Scrape .product-title
3. Scrape .product-price
4. Store in variables
```

### 4. Conditional Logic
```
1. Go to page
2. Check if element exists
3. If yes: click it
4. If no: try alternative
```

## Tips

### Development
- Use Chrome DevTools to inspect elements
- Test selectors before adding to workflow
- Enable screenshots for debugging
- Use supervised mode when testing

### Production
- Add error handling steps
- Use fallback selectors
- Set appropriate timeouts
- Monitor execution logs
- Enable rate limiting

### AI Generation
- Be specific in goal descriptions
- Provide context and requirements
- Review generated workflows carefully
- Customize and optimize results

## Resources

- **Discord**: [Join community](https://discord.gg/your-link) (if applicable)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Docs**: [Full documentation](README.md)
- **Examples**: [Workflow examples](EXAMPLES.md)

## Support

Need help?
1. Check [Troubleshooting](#troubleshooting)
2. Search [existing issues](https://github.com/your-repo/issues)
3. Ask in [Discord/Forum]
4. Create new issue with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/logs

---

**Ready to automate?** Start with a simple workflow and expand from there!

Happy automating! 🚀

