# Deployment Guide

## Prerequisites

- Supabase account
- Vercel account (for web app)
- OpenAI API key
- Chrome Web Store developer account (for extension)

## Step 1: Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database initialization

### Run Migrations

Option A: Using Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Option B: Manual SQL
1. Open Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/001_init_schema.sql`
3. Execute
4. Copy content from `supabase/migrations/002_rpc_functions.sql`
5. Execute

### Get API Keys

1. Project Settings → API
2. Copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)

### Enable Realtime

1. Database → Replication
2. Enable realtime for tables:
   - workflow_runs
   - run_logs

## Step 2: Web Application Deployment

### Deploy to Vercel

1. Push code to GitHub

2. Import project to Vercel:
```bash
npm install -g vercel
vercel
```

3. Set environment variables in Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=your_vercel_url
```

4. Deploy:
```bash
vercel --prod
```

### Alternative: Self-Hosted

Build and run:
```bash
npm run build
npm run start
```

With Docker:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

## Step 3: Chrome Extension Deployment

### Build Extension

```bash
npm run build:extension
```

### Test Locally

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/` directory
5. Test all features

### Package for Distribution

```bash
cd extension/dist
zip -r ../extension.zip .
cd ../..
```

### Publish to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `extension.zip`
4. Fill in:
   - Name: "Signal Recorder"
   - Description: (from README)
   - Category: "Productivity"
   - Screenshots: (create screenshots showing features)
   - Icon: 128x128 PNG
   - Detailed description
   - Privacy policy URL
5. Set visibility (Public/Unlisted/Private)
6. Submit for review

### Update Extension

For updates:
1. Increment version in `manifest.json`
2. Rebuild: `npm run build:extension`
3. Re-package
4. Upload to Chrome Web Store
5. Submit for review

## Step 4: Post-Deployment Setup

### Create Admin User

```bash
# In Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@example.com',
  crypt('your_password', gen_salt('bf')),
  NOW()
);
```

Or use Supabase Auth UI:
```bash
npm run dev
# Navigate to /auth/login
# Click "Sign up"
```

### Test Full Flow

1. Sign in to web app
2. Create a test workflow
3. Install extension
4. Configure extension with Supabase URL and token
5. Test recording
6. Test replay
7. Test supervised execution

## Step 5: Monitoring Setup

### Vercel Analytics

Enable in Vercel dashboard:
- Analytics
- Speed Insights
- Web Vitals

### Supabase Monitoring

Configure alerts:
1. Database → Monitoring
2. Set up alerts for:
   - High query latency
   - Connection pool exhaustion
   - Disk usage

### Error Tracking

Optional: Add Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## Step 6: Scaling Considerations

### Database Optimization

1. Add indexes for common queries:
```sql
CREATE INDEX idx_workflows_user_created ON workflows(user_id, created_at DESC);
CREATE INDEX idx_runs_status_started ON workflow_runs(status, started_at DESC);
```

2. Enable connection pooling in Supabase

3. Consider read replicas for heavy read workloads

### API Rate Limiting

Add middleware:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter((time: number) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);

  return NextResponse.next();
}
```

### Background Jobs

For production, use a queue system:

```typescript
// lib/queue/workflow-executor.ts
import { Queue } from 'bullmq';

export const workflowQueue = new Queue('workflows', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!),
  },
});

// Add job
await workflowQueue.add('execute', {
  runId: 'uuid',
  workflowId: 'uuid',
});
```

### CDN Setup

Enable Vercel Edge Network or use Cloudflare:
- Cache static assets
- Optimize images
- DDoS protection

## Troubleshooting

### Extension Not Loading

1. Check manifest.json validity
2. Verify all files are in dist/
3. Check browser console for errors
4. Ensure Chrome version is compatible

### Database Connection Errors

1. Verify environment variables
2. Check Supabase project status
3. Verify RLS policies
4. Check connection limits

### Realtime Not Working

1. Enable realtime on tables
2. Verify subscription code
3. Check browser console
4. Test with Supabase client directly

### AI Generation Failing

1. Verify OpenAI API key
2. Check API quota
3. Review error logs
4. Test with simpler prompts

## Security Checklist

- [ ] Environment variables set correctly
- [ ] RLS enabled on all tables
- [ ] Service role key kept secret
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection
- [ ] CSRF tokens for sensitive operations

## Backup and Recovery

### Database Backups

Supabase automatically backs up daily. To restore:
1. Dashboard → Database → Backups
2. Select backup
3. Click "Restore"

### Manual Backup

```bash
pg_dump -h your-db.supabase.co -U postgres -d postgres > backup.sql
```

### Restore

```bash
psql -h your-db.supabase.co -U postgres -d postgres < backup.sql
```

## Maintenance

### Regular Tasks

Weekly:
- Review error logs
- Check database performance
- Monitor API usage
- Review user feedback

Monthly:
- Update dependencies
- Review and optimize queries
- Clean up old data
- Review security advisories

Quarterly:
- Performance audit
- Security audit
- Cost optimization review
- Feature usage analysis

## Support

For issues:
1. Check logs in Vercel
2. Check Supabase logs
3. Review browser console
4. Check extension background page logs

Contact: [Your support email/link]

