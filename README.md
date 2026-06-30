# 🎬 EpiCountdown

> Never miss an episode again! Live countdown timers for your favorite TV shows & anime.

[![Deploy to GitHub Pages](https://github.com/YOUR_USERNAME/countdown/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/countdown/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A sleek, modern single-page application that tracks upcoming TV show and anime episodes with real-time countdown timers. Built with vanilla JavaScript for lightning-fast performance and zero dependencies.

**🌐 Live Demo:** [countdown.anuraaggrao.com](https://countdown.anuraaggrao.com)

---

## ✨ Features

- **Real-Time Countdowns** – Live timers updating every second with days, hours, minutes, and seconds
- **Dual Content Streams** – Separate sections for trending TV shows and currently airing anime
- **Smart Search** – Instant search across both TV shows and anime with debounced queries
- **Responsive Design** – Fully responsive layout that works perfectly on all devices
- **Dark Mode First** – Sleek dark theme with modern violet/cyan accent colors
- **API Integration** – Fetches fresh data from TVmaze and Jikan (MyAnimeList) APIs
- **Error Handling** – Graceful fallbacks with placeholder images and error states
- **Zero Dependencies** – Pure vanilla JavaScript with no frameworks or libraries
- **Performance Optimized** – Document fragments, debounced search, and efficient DOM updates

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (or just open `index.html` directly)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/countdown.git
   cd countdown
   ```

2. **Open in browser**

   **Option A:** Direct file access

   ```bash
   # Simply open index.html in your browser
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

   **Option B:** Using Python's built-in server

   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option C:** Using Node.js `http-server`

   ```bash
   npx http-server -p 8000
   ```

3. **Navigate to** `http://localhost:8000`

---

## 📁 Project Structure

```
countdown/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── app.js                      # Main application logic
├── index.html                  # HTML structure
├── styles.css                  # Complete styling
├── CNAME                       # Custom domain configuration
├── .prettierrc.json           # Prettier code formatter config
├── .eslintrc.json             # ESLint linting rules
├── .gitignore                 # Git ignore patterns
└── README.md                   # This file
```

---

## 🛠️ Technology Stack

| Technology                    | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| **HTML5**                     | Semantic structure with template elements        |
| **CSS3**                      | Modern styling with CSS variables, Grid, Flexbox |
| **Vanilla JavaScript (ES6+)** | Application logic with async/await, modules      |
| **TVmaze API**                | TV show data and episode information             |
| **Jikan API v4**              | Anime data from MyAnimeList                      |
| **GitHub Actions**            | Automated CI/CD deployment                       |
| **GitHub Pages**              | Static site hosting                              |

---

## 🎨 Architecture Overview

### **Core Components**

1. **Countdown Engine** (`renderCountdown`, `startCountdownEngine`)
   - Updates all active countdowns every second
   - Calculates time differences and formats display
   - Handles TBA and already-aired states

2. **API Integration** (`fetchTVShows`, `fetchAnime`)
   - Fetches data from TVmaze and Jikan APIs
   - Normalizes data into unified show objects
   - Handles errors gracefully with Promise.allSettled

3. **Card Builder** (`buildCard`)
   - Generates DOM elements from show data
   - Clones template elements for performance
   - Registers cards with countdown engine

4. **Search System** (`performSearch`)
   - Debounced search input (400ms delay)
   - Searches both APIs simultaneously
   - Displays results in floating panel

### **Data Flow**

```
User Loads Page
    ↓
DOMContentLoaded Event
    ↓
init() Function
    ↓
Parallel API Fetches (TV + Anime)
    ↓
Normalize Data → Build Cards → Render Grid
    ↓
Start Countdown Engine (1s interval)
    ↓
Live Updates Every Second
```

---

## 🚢 Deployment

### GitHub Pages with Custom Domain

This project automatically deploys to GitHub Pages using GitHub Actions whenever you push to the `main` branch.

#### **Setup Instructions**

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"

2. **Add DNS Records**

   Add these records to your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy):

   **Option A: A Records (Recommended)**

   ```
   Type: A
   Name: countdown (or subdomain of your choice)
   Value: 185.199.108.153
   TTL: Auto

   Type: A
   Name: countdown
   Value: 185.199.109.153
   TTL: Auto

   Type: A
   Name: countdown
   Value: 185.199.110.153
   TTL: Auto

   Type: A
   Name: countdown
   Value: 185.199.111.153
   TTL: Auto
   ```

   **Option B: CNAME Record (Alternative)**

   ```
   Type: CNAME
   Name: countdown
   Value: YOUR_USERNAME.github.io
   TTL: Auto
   ```

3. **Configure Custom Domain in GitHub**
   - Go to Settings → Pages
   - Custom domain: `countdown.anuraaggrao.com`
   - Check "Enforce HTTPS"

4. **Push to Main Branch**

   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

5. **Wait for Deployment** (~2-5 minutes)
   - Check Actions tab for deployment status
   - DNS propagation may take up to 24 hours

---

## 🧪 Code Quality

### Linting

```bash
# Install ESLint globally (optional)
npm install -g eslint

# Run linting
eslint app.js
```

### Formatting

```bash
# Install Prettier globally (optional)
npm install -g prettier

# Format all files
prettier --write "*.{js,html,css,json,md}"

# Check formatting
prettier --check "*.{js,html,css,json,md}"
```

---

## 🔌 API Reference

### TVmaze API

- **Endpoint:** `https://api.tvmaze.com/schedule?country=US&date=YYYY-MM-DD`
- **Documentation:** https://www.tvmaze.com/api
- **Rate Limit:** 20 requests per 10 seconds per IP

### Jikan API v4

- **Endpoint:** `https://api.jikan.moe/v4/seasons/now`
- **Documentation:** https://docs.api.jikan.moe/
- **Rate Limit:** 3 requests per second, 60 per minute

---

## 🎯 Browser Support

| Browser | Version              |
| ------- | -------------------- |
| Chrome  | Latest 2 versions ✅ |
| Firefox | Latest 2 versions ✅ |
| Safari  | Latest 2 versions ✅ |
| Edge    | Latest 2 versions ✅ |

Requires ES6+ support (async/await, arrow functions, template literals, etc.)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Please ensure:**

- Code follows ESLint rules
- Files are formatted with Prettier
- No console errors or warnings

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **TVmaze** – For providing comprehensive TV show data
- **Jikan/MyAnimeList** – For anime data and broadcast information
- **Google Fonts** – Inter font family
- **GitHub Pages** – Free hosting platform

---

## 📧 Contact

**Anuraag Rao**

- Website: [anuraaggrao.com](https://anuraaggrao.com)
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

## 🗺️ Roadmap

- [ ] Add user authentication for personalized watchlists
- [ ] Implement notification system for upcoming episodes
- [ ] Add filtering by genre, rating, and status
- [ ] Create Progressive Web App (PWA) with offline support
- [ ] Add light theme toggle
- [ ] Integrate more streaming platforms (Crunchyroll, Netflix, etc.)

---

**Made with ❤️ using Vanilla JavaScript**
