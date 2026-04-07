# DueDiligence AI

AIを活用した世界最強のデューディリジェンス分析プラットフォーム。上場・未上場を問わず、あらゆる企業の財務・法務・税務・ビジネスを包括的に分析します。

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fagewaller%2Fduediligence&env=GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET,NEXTAUTH_URL,NEXT_PUBLIC_PAYPAL_CLIENT_ID,NEXT_PUBLIC_PAYPAL_PLAN_ID,PAYPAL_CLIENT_SECRET&envDescription=Required%20environment%20variables%20for%20DueDiligence%20AI&envLink=https%3A%2F%2Fgithub.com%2Fagewaller%2Fduediligence%2Fblob%2Fmain%2F.env.example&project-name=duediligence-ai)

**上のボタンをクリックするだけでVercelにデプロイできます。**

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret (run `openssl rand -base64 32`) | Yes |
| `NEXTAUTH_URL` | Production URL (e.g. `https://your-app.vercel.app`) | Yes |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Client ID | Yes |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID` | PayPal Subscription Plan ID | Yes |
| `PAYPAL_CLIENT_SECRET` | PayPal Client Secret | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API Key (also configurable in admin) | Optional |
| `OPENAI_API_KEY` | OpenAI API Key (also configurable in admin) | Optional |
| `GOOGLE_AI_API_KEY` | Google AI API Key (also configurable in admin) | Optional |

> **Note:** AI API Keys can be set via the admin panel after deployment. Only Google OAuth and PayPal credentials are required at deploy time.

## Features

- **10 DD Analysis Types**: Business, Financial, Legal, Tax, IT, HR, ESG, Market, IP, Operations
- **8 AI Models**: Claude Opus/Sonnet/Haiku, GPT-4o/Mini, o3, Gemini 2.5 Pro/Flash
- **Follow-up Analysis**: Deep dive with additional questions and context
- **Admin Panel**: AI model config, API key management, prompt CRUD, sample reports
- **PayPal Subscription**: $50/month
- **8 Languages**: Japanese, English, Chinese, Korean, Spanish, French, German, Portuguese
- **Sample Reports**: Public reports on landing page

## Admin Access

`agewaller@gmail.com` is automatically assigned the admin role on login.

## Local Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
node prisma/seed.mjs

# Start dev server
npm run dev
```

## Tech Stack

- Next.js 15 + TypeScript + Tailwind CSS
- Prisma ORM (SQLite / LibSQL)
- NextAuth.js (Google OAuth)
- AI SDK (Anthropic, OpenAI, Google)
- PayPal Subscriptions
