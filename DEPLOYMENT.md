# AIQualityHQ Deployment Guide (Cloudflare Pages)

AIQualityHQ is architected as a **Static-First, Local-First SaaS**. This means the entire application can be hosted for **$0.00/month** on Cloudflare Pages while delivering sub-10ms response times globally.

---

## 🚀 Step 1: Push Code to Git
Initialize git and push your repository to GitHub, GitLab, or Bitbucket:
```bash
git init
git add .
git commit -m "feat: complete AIQualityHQ launch core"
# Connect and push to your git remote...
```

---

## 📦 Step 2: Configure Cloudflare Pages

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Configure the **Build settings**:
   *   **Framework preset:** `Astro`
   *   **Build command:** `npm run build`
   *   **Build output directory:** `dist`
5. Click **Save and Deploy**.

---

## ⚙️ Step 3: Production Optimization Settings

### Node Version Compatibility
Ensure Cloudflare compiles using Node 20:
1. In your Cloudflare Pages project, go to **Settings** > **Variables and Secrets**.
2. Add an environment variable:
   *   **Variable Name:** `NODE_VERSION`
   *   **Value:** `20`

### API Key (Optional)
If you want to restrict the `/api/check` endpoint to authorized callers:
1. In **Settings** > **Variables and Secrets**, add a secret:
   *   **Variable Name:** `AIQuality_API_Key`
   *   **Value:** *(your chosen secret key)*
2. Clients pass it as the `X-API-Key` header. Requests without a matching key return `401`.

### Custom Domains & SSL
1. Go to **Custom domains** tab in your Pages project dashboard.
2. Add your custom domain (e.g., `aiqualityhq.com`).
3. Cloudflare will automatically provision a free SSL/TLS certificate and configure edge redirects.

---

## 🛠️ Local Verification Checks

Before pushing, verify the production build locally:

1. **Build the site:**
   ```bash
   npm run build
   ```
2. **Preview the production bundle locally:**
   ```bash
   npm run preview
   ```
3. Open `http://localhost:4321` to inspect page navigations, local storage sessions, SVG trend charts, and the prompt enhancer logic.
