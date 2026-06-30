# ⚡ Quick Start Guide for EpiCountdown

This is your fast-track guide to get EpiCountdown up and running.

---

## 🚀 5-Minute Setup

### For Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/countdown.git
cd countdown

# 2. Install dev dependencies (optional, for linting/formatting)
npm install

# 3. Start local server
npm run serve
# OR
python -m http.server 8000

# 4. Open browser
open http://localhost:8000
```

### For GitHub Pages Deployment

```bash
# 1. Create new GitHub repository named "countdown"

# 2. Push your code
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/countdown.git
git push -u origin main

# 3. Enable GitHub Pages
# Go to Settings → Pages → Source: "GitHub Actions"

# 4. Configure custom domain (if applicable)
# Settings → Pages → Custom domain: "countdown.anuraaggrao.com"

# 5. Add DNS records at your registrar
# Add 4 A records pointing to GitHub Pages IPs:
# 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
```

---

## 📁 Project Structure

```
countdown/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore patterns
├── .prettierrc.json               # Prettier code formatter
├── app.js                          # Main JavaScript logic
├── CNAME                           # Custom domain config
├── CONTRIBUTING.md                 # Contribution guidelines
├── index.html                      # HTML structure
├── LICENSE                         # MIT License
├── package.json                    # NPM scripts & metadata
├── QUICKSTART.md                   # This file
├── README.md                       # Main documentation
└── styles.css                      # All CSS styles
```

---

## 🛠️ NPM Scripts

```bash
# Linting
npm run lint              # Check for code issues
npm run lint:fix          # Auto-fix linting issues

# Formatting
npm run format            # Format all files with Prettier
npm run format:check      # Check formatting without changes

# Development
npm run serve             # Start local server on port 8000
```

---

## 🌐 DNS Records (Quick Reference)

Add these **A records** to your domain registrar:

```
Type: A    Name: countdown    Value: 185.199.108.153
Type: A    Name: countdown    Value: 185.199.109.153
Type: A    Name: countdown    Value: 185.199.110.153
Type: A    Name: countdown    Value: 185.199.111.153
```

**Verification:**

```bash
nslookup countdown.anuraaggrao.com
# OR
dig countdown.anuraaggrao.com +short
```

---

## 🔑 Key Features

| Feature              | Status | Description                  |
| -------------------- | ------ | ---------------------------- |
| Real-time Countdowns | ✅     | Updates every second         |
| TV Shows             | ✅     | TVmaze API integration       |
| Anime                | ✅     | Jikan (MAL) API integration  |
| Search               | ✅     | Debounced, dual-source       |
| Responsive           | ✅     | Mobile-first design          |
| Dark Theme           | ✅     | Modern violet/cyan aesthetic |

---

## 🎨 Customization Quick Tips

### Change Color Scheme

Edit `styles.css` variables:

```css
:root {
  --accent-1: #7c3aed; /* Primary accent (violet) */
  --accent-2: #06b6d4; /* Secondary accent (cyan) */
  --bg-base: #0d0d14; /* Background */
  --text-primary: #f0f0f8; /* Primary text */
}
```

### Change Show Limit

Edit `app.js` constants:

```javascript
// Line 18-19
const JIKAN_SEASONS = 'https://api.jikan.moe/v4/seasons/now?limit=24';

// Line 303, 367
.slice(0, 24)  // Change to desired limit
```

### Add Your Own Shows

Modify fetch functions in `app.js` to filter by specific show names, genres, or networks.

---

## 📚 Documentation Quick Links

- **Main README:** [README.md](./README.md)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **License:** [LICENSE](./LICENSE)

---

## 🔗 External Resources

| Resource          | URL                             |
| ----------------- | ------------------------------- |
| TVmaze API Docs   | https://www.tvmaze.com/api      |
| Jikan API Docs    | https://docs.api.jikan.moe/     |
| GitHub Pages Docs | https://docs.github.com/pages   |
| ESLint Docs       | https://eslint.org/docs/latest/ |
| Prettier Docs     | https://prettier.io/docs/en/    |

---

## 🚨 Important Notes

1. **API Rate Limits:**
   - TVmaze: 20 requests per 10 seconds
   - Jikan: 3 requests per second, 60 per minute

2. **Browser Support:**
   - Requires ES6+ support (Chrome 51+, Firefox 54+, Safari 10+, Edge 15+)

3. **GitHub Pages:**
   - Repository must be public for free GitHub Pages
   - Custom domain requires DNS configuration

4. **HTTPS:**
   - Automatically provisioned via Let's Encrypt
   - May take 10-20 minutes after DNS verification

---

## 💡 Pro Tips

- **Development:** Use browser DevTools with live reload for faster iteration
- **Testing:** Test API responses with `curl` or Postman before implementing
- **Performance:** Monitor Network tab for API response times
- **SEO:** Add meta tags and Open Graph tags in `<head>` for better sharing
- **Analytics:** Add Google Analytics or Plausible for visitor tracking

---

## ✅ Pre-Flight Checklist

Before deploying:

- [ ] Test in multiple browsers
- [ ] Verify responsive design on mobile
- [ ] Check console for errors
- [ ] Run `npm run lint` and `npm run format`
- [ ] Update GitHub username in README badges
- [ ] Add DNS records at registrar
- [ ] Enable GitHub Pages in repository settings

---

## 🎉 Next Steps

After deployment:

1. Share your site on social media
2. Monitor GitHub Actions for future deployments
3. Gather user feedback
4. Check out the [Roadmap](./README.md#-roadmap) for future features
5. Consider contributing back to the project!

---

**Need Help?** Open an issue on GitHub or consult the full documentation.

**Happy Coding!** 🚀
