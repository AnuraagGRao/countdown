# Contributing to EpiCountdown

First off, thank you for considering contributing to EpiCountdown! 🎉

Following these guidelines helps communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

---

## Code of Conduct

This project and everyone participating in it is governed by basic principles of respect and professionalism. By participating, you are expected to uphold this standard.

**Expected Behavior:**

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

**Unacceptable Behavior:**

- Harassment, trolling, or discriminatory language
- Personal attacks or political arguments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript (ES6+)
- Git installed on your machine
- A code editor (VS Code recommended)
- A modern web browser for testing

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/countdown.git
   cd countdown
   ```

3. **Add the upstream repository**:

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/countdown.git
   ```

4. **Install development dependencies**:

   ```bash
   npm install
   ```

5. **Open the project**:
   ```bash
   # Open in your browser
   open index.html

   # Or start a local server
   npm run serve
   ```

---

## Development Workflow

1. **Create a new branch** for your feature or bug fix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following the coding standards below

3. **Test your changes** thoroughly:
   - Test in multiple browsers (Chrome, Firefox, Safari, Edge)
   - Test responsive design on different screen sizes
   - Verify API calls work correctly
   - Check for console errors

4. **Lint and format your code**:

   ```bash
   npm run lint
   npm run format
   ```

5. **Commit your changes** (see commit guidelines below)

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub

---

## Coding Standards

### JavaScript

- Use ES6+ features (arrow functions, template literals, async/await, etc.)
- Follow the ESLint configuration (`.eslintrc.json`)
- Use `const` by default, `let` only when reassignment is needed
- Never use `var`
- Use single quotes for strings
- Include JSDoc comments for functions:
  ```javascript
  /**
   * Brief description of what the function does.
   * @param {type} paramName - Description
   * @returns {type} Description
   */
  function myFunction(paramName) {
    // implementation
  }
  ```

### HTML

- Use semantic HTML5 elements
- Include proper ARIA attributes for accessibility
- Keep indentation consistent (2 spaces)
- Use lowercase for element names and attributes

### CSS

- Follow the BEM naming convention for classes
- Use CSS variables for colors and common values
- Group related properties together
- Include comments for complex sections
- Mobile-first responsive design approach

### File Organization

```
countdown/
├── app.js           # Main application logic
├── index.html       # HTML structure
├── styles.css       # All styles
└── ...
```

**Note:** Since this is a vanilla JS project, we keep it simple. If the project grows significantly, we may refactor into modules.

---

## Commit Guidelines

We follow conventional commit messages for clarity and automated changelog generation:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD configuration changes

### Examples

```bash
feat(search): add debounced search functionality

- Implemented 400ms debounce on search input
- Prevents excessive API calls
- Improves user experience

Closes #42
```

```bash
fix(countdown): correct timezone calculation for anime

- Fixed JST to UTC conversion
- Now properly handles daylight saving time
- Tested across multiple timezones

Fixes #38
```

```bash
docs(readme): update installation instructions

- Added npm scripts section
- Clarified DNS configuration steps
- Fixed broken links
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass (no console errors)
- [ ] Code is formatted with Prettier (`npm run format`)
- [ ] ESLint shows no errors (`npm run lint`)
- [ ] Tested in multiple browsers
- [ ] Documentation updated if needed
- [ ] Commit messages follow guidelines

### Submitting Your PR

1. **Use a clear, descriptive title**:
   - ✅ Good: "Add filtering by genre feature"
   - ❌ Bad: "Update app.js"

2. **Provide a detailed description**:

   ```markdown
   ## Description

   Brief overview of what this PR does.

   ## Changes Made

   - Added genre filtering dropdown
   - Updated UI to show active filters
   - Implemented filter logic in fetchTVShows()

   ## Testing

   - Tested in Chrome, Firefox, Safari
   - Verified responsive design
   - No console errors

   ## Screenshots (if applicable)

   [Add screenshots showing UI changes]

   ## Related Issues

   Closes #123
   ```

3. **Link related issues**: Use keywords like "Closes #123", "Fixes #456"

4. **Be responsive to feedback**: Address review comments promptly and professionally

### Review Process

- Maintainers will review your PR within 3-5 business days
- You may be asked to make changes
- Once approved, a maintainer will merge your PR
- Your contribution will be acknowledged in the release notes!

---

## Reporting Bugs

### Before Submitting a Bug Report

- Check the [Issues](https://github.com/YOUR_USERNAME/countdown/issues) to see if it's already reported
- Try to reproduce the bug in multiple browsers
- Collect relevant information (browser version, console errors, etc.)

### Submitting a Bug Report

Use the bug report template and include:

**Required Information:**

- **Browser & Version**: e.g., Chrome 120.0.6099.109
- **Operating System**: e.g., Windows 11, macOS Sonoma
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable
- **Console Errors**: Any errors from browser console
- **Additional Context**: Any other relevant information

**Example:**

```markdown
**Browser:** Chrome 120.0.6099.109  
**OS:** Windows 11

**Description:**  
Countdown timer shows incorrect time for anime episodes airing in JST.

**Steps to Reproduce:**

1. Open the site
2. Scroll to Anime section
3. Check countdown for "Attack on Titan"
4. Compare with official air time

**Expected:** Shows correct countdown to JST air time  
**Actual:** Shows time 9 hours off

**Console Errors:**
```

NaN appears in countdown calculation

```

**Additional Context:**
This happens only for anime, TV shows work correctly.
```

---

## Suggesting Enhancements

### Before Submitting

- Check if the enhancement has already been suggested
- Consider if it fits the project's scope and vision
- Think about how it benefits most users

### Submitting an Enhancement

Use the feature request template and include:

**Required Information:**

- **Feature Description**: Clear description of the enhancement
- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives Considered**: Other ways to achieve this
- **Additional Context**: Mockups, examples, references

**Example:**

```markdown
**Feature:** User authentication for personal watchlists

**Use Case:**  
Users want to save their favorite shows and get personalized recommendations without re-searching every time they visit.

**Proposed Solution:**  
Implement OAuth login (Google, GitHub) and localStorage for saved shows. Add "Add to Watchlist" button on each card.

**Alternatives:**

1. Browser-based localStorage only (no authentication)
2. Email-based authentication
3. Integration with existing services (Trakt, MAL)

**Mockups:**  
[Attach mockup images]
```

---

## Questions?

Feel free to:

- Open an issue with your question
- Email: [your-email@example.com]
- Join discussions in the repository

---

## Recognition

Contributors will be recognized in:

- README.md Contributors section
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉

---

**Last Updated:** 2026-06-30
