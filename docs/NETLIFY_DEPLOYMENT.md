# Netlify Deployment Guide

This guide covers deploying ShopOS to Netlify with proper configuration for redirects, headers, and environment variables.

## Prerequisites

1. A Netlify account ([sign up here](https://app.netlify.com/signup))
2. Your ShopOS project repository (GitHub, GitLab, or Bitbucket)
3. Environment variables ready (see below)

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider and select the ShopOS repository
4. Netlify will auto-detect the build settings from `netlify.toml`

### 2. Configure Build Settings

The `netlify.toml` file is already configured with:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20 (LTS)

These settings are automatically detected, but you can verify them in the Netlify dashboard under Site settings → Build & deploy.

### 3. Set Environment Variables

Navigate to **Site settings → Environment variables** and add the following:

#### Required Variables

- `GEMINI_API_KEY` - Your Google Gemini API key for AI features
  - Get one at: https://ai.google.dev/

#### Optional Variables

- `PAYSTACK_PUBLIC_KEY` - Paystack public key for payment processing
  - Note: This can also be configured in Admin settings after deployment
  - Get one at: https://paystack.com/

#### Adding Variables

1. Go to **Site settings → Environment variables**
2. Click "Add a variable"
3. Add each variable with its value
4. Click "Save"

**Important:** After adding/changing environment variables, you'll need to **trigger a new deployment** for changes to take effect:
- Go to **Deploys** tab
- Click "Trigger deploy" → "Clear cache and deploy site"

### 4. Deploy

1. After connecting the repository, Netlify will automatically:
   - Install dependencies (`npm install`)
   - Run the build command (`npm run build`)
   - Deploy the `dist` folder

2. Your site will be live at: `https://your-site-name.netlify.app`

3. You can set up a custom domain in **Domain settings**

## Configuration Files

### netlify.toml

This file contains all Netlify configuration:
- **Build settings** - Command and output directory
- **Redirect rules** - SPA routing (all routes → index.html)
- **Security headers** - XSS protection, CSP, etc.
- **Caching headers** - Optimized caching for static assets

### public/_redirects

Backup redirect file that gets copied to `dist` during build. This ensures SPA routing works even if `netlify.toml` isn't processed.

## Features Enabled

### ✅ SPA Routing

All routes (including `/traceroot/admin/*`) are properly handled:
- Direct URL access works
- Browser back/forward buttons work
- No 404 errors on refresh

### ✅ Security Headers

- **X-Frame-Options:** Prevents clickjacking
- **X-Content-Type-Options:** Prevents MIME sniffing
- **Content-Security-Policy:** Controls resource loading
- **Strict-Transport-Security:** Enforces HTTPS

### ✅ Performance Optimization

- Static assets cached for 1 year (immutable)
- HTML files not cached (always fresh)
- Fonts cached for 1 year

### ✅ Content Security Policy

The CSP allows:
- Tailwind CSS CDN
- Google Fonts
- Paystack payment gateway
- Supabase database and storage
- Google Generative AI API
- Image hosting (ibb.co)

## Troubleshooting

### Build Fails

1. **Check build logs** in the Netlify dashboard
2. **Verify Node version** - Should be 20
3. **Check environment variables** - Ensure all required vars are set
4. **Test locally:** Run `npm run build` locally to see errors

### Routes Return 404

1. **Verify redirects** - Check that `netlify.toml` has redirect rules
2. **Check `_redirects` file** - Should exist in `public/` directory
3. **Clear cache** - Trigger a new deploy with cache cleared

### Environment Variables Not Working

1. **Redeploy after adding vars** - Variables only apply to new deployments
2. **Check variable names** - Must match exactly (case-sensitive)
3. **Verify build logs** - Check if variables are being read

### Supabase Connection Issues

1. **Check Supabase URL** - Currently hardcoded in `services/supabase/client.ts`
2. **Verify anon key** - Also hardcoded in the same file
3. **Check CORS settings** - Ensure your Netlify domain is allowed in Supabase

### Payment Gateway Not Working

1. **Check Paystack key** - Set `PAYSTACK_PUBLIC_KEY` environment variable
2. **Or configure in Admin** - Can be set in Admin settings after deployment
3. **Verify Paystack account** - Ensure account is active

## Custom Domain Setup

1. Go to **Domain settings** in Netlify dashboard
2. Click "Add custom domain"
3. Follow instructions to:
   - Add DNS records (if using subdomain)
   - Update nameservers (if using apex domain)
4. SSL certificate is automatically provisioned by Netlify

## Continuous Deployment

Netlify automatically deploys when you:
- Push to the main branch
- Merge a pull request to main
- Manually trigger a deploy

### Branch Deploys

- **Production:** Deploys from `main` branch
- **Preview:** Every branch/PR gets a unique preview URL
- **Deploy contexts:** Configure different env vars per branch

## Post-Deployment Checklist

- [ ] Site loads correctly at the Netlify URL
- [ ] All routes work (try `/traceroot/admin`)
- [ ] Environment variables are set
- [ ] Supabase connection works
- [ ] Payment gateway works (if configured)
- [ ] AI features work (requires GEMINI_API_KEY)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)

## Monitoring

- **Analytics:** Enable in Netlify dashboard (paid feature)
- **Logs:** Check build logs and function logs in dashboard
- **Performance:** Use Netlify Analytics or external tools

## Support

For issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify environment variables
4. Review this documentation

For Netlify-specific issues, see: https://docs.netlify.com/

