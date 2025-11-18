# Workflow Examples

## Example 1: LinkedIn Candidate Sourcing

### Goal
"Find candidates for Senior Software Engineer position on LinkedIn, evaluate if they match our requirements, send personalized messages to qualified candidates, and track them in our ATS."

### Generated Workflow

```json
{
  "name": "LinkedIn Senior Engineer Sourcing",
  "description": "Automated candidate sourcing and outreach on LinkedIn",
  "steps": [
    {
      "type": "goto",
      "url": "https://www.linkedin.com/search/results/people/",
      "description": "Navigate to LinkedIn people search"
    },
    {
      "type": "type",
      "selector": { "type": "css", "value": "input[aria-label='Search']" },
      "text": "Senior Software Engineer Python AWS",
      "description": "Enter search query"
    },
    {
      "type": "click",
      "selector": { "type": "css", "value": "button[type='submit']" },
      "description": "Submit search"
    },
    {
      "type": "wait",
      "waitType": "selector",
      "value": { "type": "css", "value": ".search-results-container" },
      "description": "Wait for results to load"
    },
    {
      "type": "loop",
      "selector": { "type": "css", "value": ".reusable-search__result-container" },
      "steps": ["scrape_profile", "evaluate", "conditional_message"]
    },
    {
      "id": "scrape_profile",
      "type": "scrape",
      "selector": { "type": "css", "value": ".entity-result__title-text" },
      "storeAs": "candidateName",
      "description": "Extract candidate name"
    },
    {
      "id": "evaluate",
      "type": "llm_reason",
      "prompt": "Evaluate if this candidate is a good fit based on their profile",
      "storeAs": "evaluation",
      "description": "AI evaluation of candidate fit"
    },
    {
      "id": "conditional_message",
      "type": "conditional",
      "condition": {
        "type": "variable_equals",
        "value": { "evaluation.recommendation": "strong_yes" }
      },
      "thenSteps": ["send_message_step"],
      "description": "Send message if strong fit"
    },
    {
      "id": "send_message_step",
      "type": "agent_action",
      "action": "send_message",
      "toolName": "send_message",
      "parameters": {
        "platform": "linkedin",
        "template": "Hi {name}, I came across your profile..."
      }
    }
  ]
}
```

## Example 2: Product Price Monitoring

### Goal
"Monitor competitor prices on Amazon for specific products, compare with our prices, and notify when we need to adjust pricing."

### Workflow

```json
{
  "name": "Amazon Price Monitor",
  "description": "Track competitor pricing and alert on changes",
  "steps": [
    {
      "type": "goto",
      "url": "https://www.amazon.com/s?k=wireless+headphones",
      "description": "Search for products"
    },
    {
      "type": "scrape",
      "selector": { "type": "css", "value": ".s-result-item" },
      "multiple": true,
      "storeAs": "products",
      "description": "Scrape all product listings"
    },
    {
      "type": "loop",
      "selector": { "type": "css", "value": ".s-result-item" },
      "steps": ["extract_details", "compare_price"]
    },
    {
      "id": "extract_details",
      "type": "extract",
      "schema": {
        "title": "string",
        "price": "number",
        "rating": "number",
        "reviews": "number",
        "url": "string"
      },
      "storeAs": "productDetails"
    },
    {
      "id": "compare_price",
      "type": "llm_reason",
      "prompt": "Compare this price with our database and determine if action is needed",
      "context": { "ourPrice": 79.99 },
      "storeAs": "priceAnalysis"
    }
  ]
}
```

## Example 3: Form Automation

### Goal
"Fill out job applications on multiple job boards with my information."

### Workflow

```json
{
  "name": "Job Application Automation",
  "description": "Auto-fill job applications with personal info",
  "steps": [
    {
      "type": "goto",
      "url": "https://jobs.example.com/apply",
      "description": "Navigate to application page"
    },
    {
      "type": "type",
      "selector": { "type": "css", "value": "input[name='firstName']" },
      "text": "{{firstName}}",
      "description": "Enter first name"
    },
    {
      "type": "type",
      "selector": { "type": "css", "value": "input[name='lastName']" },
      "text": "{{lastName}}",
      "description": "Enter last name"
    },
    {
      "type": "type",
      "selector": { "type": "css", "value": "input[name='email']" },
      "text": "{{email}}",
      "description": "Enter email"
    },
    {
      "type": "type",
      "selector": { "type": "css", "value": "input[name='phone']" },
      "text": "{{phone}}",
      "description": "Enter phone"
    },
    {
      "type": "click",
      "selector": { "type": "css", "value": "label:contains('Upload Resume')" },
      "description": "Click upload button"
    },
    {
      "type": "wait",
      "waitType": "time",
      "value": 2000,
      "description": "Wait for file picker"
    },
    {
      "type": "click",
      "selector": { "type": "css", "value": "button[type='submit']" },
      "description": "Submit application"
    }
  ]
}
```

## Example 4: Meeting Transcript Processing

### Goal
"After each interview on Zoom, download the transcript, summarize key points, evaluate the candidate, and update our ATS."

### Workflow

```json
{
  "name": "Interview Transcript Processor",
  "description": "Automated interview transcript analysis and ATS update",
  "steps": [
    {
      "type": "agent_action",
      "toolName": "ingest_transcript",
      "parameters": {
        "meetingId": "{{meetingId}}",
        "platform": "zoom"
      },
      "description": "Fetch transcript from Zoom"
    },
    {
      "type": "agent_action",
      "toolName": "summarize",
      "parameters": {
        "content": "{{transcript}}",
        "focusAreas": [
          "Technical skills",
          "Communication",
          "Cultural fit",
          "Red flags"
        ]
      },
      "description": "Summarize transcript"
    },
    {
      "type": "llm_reason",
      "prompt": "Based on this interview transcript and summary, provide a detailed candidate evaluation",
      "context": {
        "transcript": "{{transcript}}",
        "summary": "{{summary}}",
        "jobRequirements": "{{jobRequirements}}"
      },
      "storeAs": "evaluation"
    },
    {
      "type": "agent_action",
      "toolName": "update_ats",
      "parameters": {
        "candidateName": "{{candidateName}}",
        "data": {
          "interviewSummary": "{{summary}}",
          "evaluation": "{{evaluation}}",
          "nextSteps": "{{nextSteps}}"
        },
        "stage": "interviewed"
      },
      "description": "Update ATS with interview results"
    }
  ]
}
```

## Example 5: Data Migration

### Goal
"Export data from old CRM, transform it, and import into new CRM."

### Workflow

```json
{
  "name": "CRM Data Migration",
  "description": "Automated data export, transform, and import",
  "steps": [
    {
      "type": "goto",
      "url": "https://oldcrm.example.com/export",
      "description": "Navigate to export page"
    },
    {
      "type": "click",
      "selector": { "type": "css", "value": "button#export-all" },
      "description": "Click export button"
    },
    {
      "type": "wait",
      "waitType": "time",
      "value": 5000,
      "description": "Wait for download"
    },
    {
      "type": "llm_reason",
      "prompt": "Transform this data from old CRM format to new CRM format",
      "context": { "data": "{{exportedData}}" },
      "storeAs": "transformedData"
    },
    {
      "type": "goto",
      "url": "https://newcrm.example.com/import",
      "description": "Navigate to import page"
    },
    {
      "type": "click",
      "selector": { "type": "css", "value": "button#import-data" },
      "description": "Click import button"
    }
  ]
}
```

## Example 6: Multi-Platform Candidate Search

### Goal
"Search for candidates on LinkedIn, Indeed, and GitHub, consolidate results, and rank by fit."

### Workflow

```json
{
  "name": "Multi-Platform Candidate Search",
  "description": "Comprehensive candidate search across platforms",
  "steps": [
    {
      "type": "agent_action",
      "toolName": "search_candidates",
      "parameters": {
        "platform": "linkedin",
        "query": "Senior React Developer",
        "filters": { "location": "Remote", "experience": "5+" }
      },
      "description": "Search LinkedIn"
    },
    {
      "type": "agent_action",
      "toolName": "search_candidates",
      "parameters": {
        "platform": "indeed",
        "query": "Senior React Developer",
        "filters": { "location": "Remote" }
      },
      "description": "Search Indeed"
    },
    {
      "type": "goto",
      "url": "https://github.com/search?q=react+developer",
      "description": "Search GitHub"
    },
    {
      "type": "scrape",
      "selector": { "type": "css", "value": ".user-list-item" },
      "multiple": true,
      "storeAs": "githubProfiles"
    },
    {
      "type": "llm_reason",
      "prompt": "Consolidate and rank all candidates by fit for Senior React Developer role",
      "context": {
        "linkedinCandidates": "{{linkedinCandidates}}",
        "indeedCandidates": "{{indeedCandidates}}",
        "githubProfiles": "{{githubProfiles}}",
        "requirements": "{{jobRequirements}}"
      },
      "storeAs": "rankedCandidates"
    }
  ]
}
```

## Running These Examples

### Option 1: Manual Creation
1. Dashboard → "New Workflow"
2. Copy the JSON
3. Add steps manually using the editor

### Option 2: AI Generation
1. Dashboard → "Generate with AI"
2. Paste the goal description
3. Review and customize generated workflow

### Option 3: Import JSON (if import feature exists)
1. Dashboard → "Import Workflow"
2. Paste JSON
3. Save

## Customization Tips

1. **Variables**: Use `{{variableName}}` for dynamic values
2. **Selectors**: Test selectors in browser DevTools first
3. **Timeouts**: Adjust based on page load times
4. **Screenshots**: Enable for debugging
5. **Supervised Mode**: Always test new workflows in supervised mode first

## Best Practices

1. **Error Handling**: Add conditional steps to handle errors
2. **Logging**: Enable screenshots on critical steps
3. **Testing**: Test with small datasets first
4. **Validation**: Validate scraped data before use
5. **Rate Limiting**: Add wait steps to avoid overwhelming servers
6. **Authentication**: Handle login steps carefully
7. **Privacy**: Never store sensitive data in workflows
8. **Compliance**: Ensure workflows comply with platform ToS

## Troubleshooting

### Selector Not Found
- Inspect element and copy accurate selector
- Use fallback selectors
- Add wait step before action

### Timeout Errors
- Increase timeout value
- Add explicit wait steps
- Check network conditions

### Data Not Scraped
- Verify selector matches content
- Check if data loads dynamically
- Use appropriate wait conditions

### Authentication Issues
- Include login steps
- Handle session management
- Use secure credential storage

