# Contributing to Vent to Delete

Thank you for your interest in contributing to Vent to Delete! We're building a safe, judgment-free space for emotional release — no history, no judgment, just relief.

---

## 🤝 How to Contribute

### Reporting Bugs

1. **Search existing issues:** Check if the bug has already been reported at [github.com/meridian-apps/vent-to-delete/issues](https://github.com/meridian-apps/vent-to-delete/issues)
2. **Create a bug report:** Use the "Bug report" template
3. **Provide details:** Include steps to reproduce, expected behavior, and environment details

### Suggesting Features

1. **Check existing requests:** Search for similar feature requests
2. **Use the feature request template:** Provide clear use cases and benefits
3. **Discuss alternatives:** Consider different approaches or solutions

### Submitting Code

1. **Fork the repository**
2. **Create a branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes:** Follow the code style guidelines below
4. **Write tests:** Ensure your changes are tested
5. **Update documentation:** Update README, docs, or comments
6. **Commit your changes:** `git commit -m "Add: your feature description"`
7. **Push to your branch:** `git push origin feature/your-feature-name`
8. **Open a pull request:** Fill out the PR template

---

## 📋 Code Style Guidelines

### Language & Framework

- **Language:** Vanilla JavaScript (ES6+) with TypeScript type definitions
- **Styling:** Plain CSS with CSS variables for theming
- **Build:** Vite for fast development and optimized production builds
- **Storage:** `localStorage` for settings, **NO storage for vents**
- **Linter:** ESLint (Standard config)
- **Formatter:** Prettier

### Philosophy: Simplicity Over Everything

This app intentionally avoids complexity:

- **No frameworks** — Vanilla JS keeps it lightweight
- ** no tracking** — No analytics, no cookies, no telemetry
- **No accounts** — No sign-up, no authentication
- **No history** — Vents are deleted after session
- **Minimal dependencies** — Only what's absolutely necessary

### Naming Conventions

- **Functions:** camelCase (e.g., `initBreathingExercise()`, `handleVentSubmit()`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `BREATHING_INHALATION_MS`, `MAX_VENT_LENGTH`)
- **CSS Classes:** kebab-case (e.g., `.vent-textarea`, `.breathing-circle`, `.delete-button`)
- **Files:** kebab-case (e.g., `breathing.js`, `storage.js`, `utils.js`)

### Code Organization

```
src/
├── js/
│   ├── app.js              # Main entry point
│   ├── vent.js             # Vent submission logic
│   ├── breathing.js        # Breathing exercise animations
│   ├── storage.js          # LocalStorage for settings (NOT vents)
│   └── utils.js            # Helper functions
├── css/
│   ├── variables.css       # CSS custom properties (colors, spacing)
│   ├── typography.css      # Font definitions
│   ├── components.css      # Reusable component styles
│   └── themes.css          # Light/dark theme definitions
└── index.html              # Main HTML file
```

### Commenting Guidelines

- **Document breathing logic:** Explain inhalation/hold/exhalation timing and visual cues
- **Privacy features:** Explicitly comment on what data is NOT stored
- **Accessibility:** Explain ARIA labels, focus management, keyboard navigation
- **Edge cases:** Explain handling of empty vents, very long vents, rapid submissions

**Example:**

```javascript
/**
 * Initiates the 4-7-8 breathing exercise
 * 
 * Technique: Inhale for 4s, hold for 7s, exhale for 8s
 * This activates the parasympathetic nervous system, reducing anxiety
 * 
 * Visual feedback:
 * - Circle expands during inhalation (0% → 100% over 4s)
 * - Circle holds during breath hold (100% for 7s)
 * - Circle contracts during exhalation (100% → 0% over 8s)
 * 
 * Accessibility:
 * - Screen reader announces current phase ("Inhale", "Hold", "Exhale")
 * - Spacebar toggles pause/resume
 * - ESC key exits exercise
 * 
 * Privacy: No breathing data is logged or stored
 */
function startBreathingExercise() {
  // ... implementation
}
```

---

## ✅ Testing Guidelines

### Unit Tests

Test individual functions:

```javascript
// Example: tests/js/breathing.test.js
import { calculateBreathingPhase, formatTime } from '../src/js/breathing.js';

describe('calculateBreathingPhase', () => {
  it('should return inhalation phase for 0-4 seconds', () => {
    const phase = calculateBreathingPhase(2000); // 2 seconds in
    expect(phase).toBe('inhalation');
  });
  
  it('should return hold phase for 4-11 seconds', () => {
    const phase = calculateBreathingPhase(6000); // 6 seconds in
    expect(phase).toBe('hold');
  });
  
  it('should return exhalation phase for 11-19 seconds', () => {
    const phase = calculateBreathingPhase(15000); // 15 seconds in
    expect(phase).toBe('exhalation');
  });
});
```

### Integration Tests

Test complete user flows:

```javascript
// Example: tests/integration/vent-flow.test.js
import { setupPage, typeVent, submitVent, confirmDelete } from './helpers.js';

describe('Vent flow', () => {
  it('should allow user to vent, breathe, then delete', async () => {
    const page = await setupPage();
    
    // Type a vent
    await typeVent(page, "I'm feeling overwhelmed today");
    
    // Submit vent
    await submitVent(page);
    
    // Verify breathing exercise is shown
    const breathingCircle = page.querySelector('.breathing-circle');
    expect(breathingCircle).toBeInTheDocument();
    
    // Confirm deletion
    await confirmDelete(page);
    
    // Verify vent is gone (no history)
    const savedVents = localStorage.getItem('vents');
    expect(savedVents).toBeNull();
  });
});
```

### Accessibility Tests

Test keyboard navigation and screen reader compatibility:

```javascript
// Example: tests/a11y/keyboard.test.js
describe('Keyboard navigation', () => {
  it('should allow full flow with keyboard only', async () => {
    const page = await setupPage();
    
    // Tab to textarea
    await page.keyboard.press('Tab');
    expect(document.activeElement).toHaveClass('vent-textarea');
    
    // Type vent
    await page.keyboard.type('Test vent');
    
    // Tab to submit button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify submitted
    const breathingScreen = page.querySelector('.breathing-screen');
    expect(breathingScreen).toBeInTheDocument();
  });
});
```

### Coverage Goal

Aim for **>80% code coverage**. Run coverage report:

```bash
npm test -- --coverage
```

---

## 🎨 Design Guidelines

### Follow the Meridian Design System

Use CSS custom properties for colors and spacing:

```css
/* ✅ Good: Use CSS variables */
.vent-textarea {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
}

/* ❌ Bad: Hardcoded values */
.vent-textarea {
  background-color: #FFFFFF;
  color: #3A3228;
  padding: 16px;
  border-radius: 8px;
}
```

### Color Usage

```css
/* From variables.css */
:root {
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F5F0E6;
  --color-text-primary: #3A3228;
  --color-text-secondary: #6B5D4F;
  --color-accent: #C8A880;
  --color-error: #C17767;
}

.dark {
  --color-bg-primary: #2A241E;
  --color-bg-secondary: #3D362F;
  --color-text-primary: #F5F0E6;
  --color-text-secondary: #D4C4B0;
}
```

### Dark Mode

Dark mode is **critical** for this app (people vent at night):

```css
/* ✅ Good: Default to light, respect system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #2A241E;
    --color-text-primary: #F5F0E6;
  }
}

/* ✅ Also: Manual toggle in settings */
body.dark-mode {
  --color-bg-primary: #2A241E;
  --color-text-primary: #F5F0E6;
}
```

### Typography

Clean, readable, calming:

```css
/* ✅ Good: Comfortable reading for long text */
.vent-textarea {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 18px;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

/* ❌ Bad: Tight, hard to read */
.vent-textarea {
  font-size: 14px;
  line-height: 1.2;
}
```

---

## 📖 Documentation

### Update README if Adding Features

If you add a significant feature:

1. Update the "Features" section
2. Add usage example
3. Update screenshots if UI changes

### Add Inline Comments for Privacy Features

```javascript
/**
 * PRIVACY CRITICAL: This function handles vent submission
 * 
 * Security measures:
 * - Vent is displayed to user for confirmation
 * - Vent is NOT saved to localStorage, sessionStorage, or any backend
 * - Vent is NOT logged to console or analytics
 * - After user confirms deletion, vent is permanently removed from DOM
 * 
 * Data flow:
 * 1. User types vent → stored in memory (JS variable)
 * 2. User clicks "Vent Now" → displayed in modal
 * 3. User does breathing exercise
 * 4. User clicks "Delete Forever" → removed from DOM
 * 5. No trace remains
 */
function handleVentSubmit(ventText) {
  // ... implementation with NO storage calls
}
```

### Update ARIA Labels for Accessibility

```html
<!-- ✅ Good: Descriptive ARIA labels -->
<textarea
  id="vent-textarea"
  class="vent-textarea"
  aria-label="Write your vent here"
  aria-describedby="vent-instructions"
  maxlength="5000"
></textarea>
<div id="vent-instructions" class="sr-only">
  Type whatever is on your mind. No limits, no judgment.
  Your vent will be permanently deleted after you submit it.
</div>

<!-- ❌ Bad: Missing accessibility -->
<textarea id="vent" maxlength="5000"></textarea>
```

---

## 🚀 Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

### Before Committing

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test

# Build to check for errors
npm run build
```

### Commit Message Format

Follow conventional commits:

```
feat: add sound option for breathing exercise
fix: resolve dark mode toggle bug
docs: update privacy documentation
style: format CSS with Prettier
refactor: simplify breathing animation logic
test: add unit tests for breathing timer
chore: update Vite to version 6.x
```

---

## 📦 Release Process

Maintainers handle releases:

1. **Version bump:** Update `package.json` version (semantic versioning)
2. **Changelog:** Add entry to `CHANGELOG.md`
3. **Tag:** `git tag -a v1.x.x -m "Release version 1.x.x"`
4. **Push:** `git push origin v1.x.x`
5. **Deploy:** Vercel auto-deploys on tag push

---

## 💬 Communication

- **GitHub Issues:** For bugs and feature requests
- **Discussions:** For questions and ideas
- **Discord:** [Join the community](https://discord.gg/meridian-apps) (for real-time chat)

---

## 🙏 Code of Conduct

Be respectful, constructive, and inclusive. We're all here to build something great together.

**Examples of acceptable behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Examples of unacceptable behavior:**
- Trolling, insulting/derogatory comments, personal/political attacks
- Public or private harassment
- Publishing others' private information (doxing)
- Unprofessional conduct

---

## 🌟 Areas to Contribute

### High Priority

- **[Accessibility]** Improve screen reader support (ARIA live regions)
- **[Mobile]** Better mobile experience (touch targets, swipe gestures)
- **[Breathing]] Add more breathing techniques (box breathing, 4-7-8 alternatives)
- **[Performance]] Reduce bundle size (tree-shaking, code splitting)

### Medium Priority

- **[Features]] Sound options (nature sounds, white noise during breathing)
- **[Features]] Post-vent journal (OPTIONAL local save, off by default)
- **[Features]] Crisis resources (helpline numbers for severe distress)
- **[Localization]] Translations (Spanish, French, German)

### Low Priority

- **[Features]] Themes beyond light/dark (sepia, high contrast)
- **[Integrations]] Export to journaling apps (Day One, Notion)
- **[Social]] Anonymous vent sharing (opt-in community support)

---

## 🔒 Privacy Commitment

**This app's core value is privacy. When contributing:**

- **Never add tracking** — No analytics, no metrics, no telemetry
- **Never store vents** — No backend, no localStorage, no sessionStorage
- **Never log sensitive data** — No console.logs of vent content
- **Default to deletion** — Always assume user wants data gone
- **Document privacy decisions** — Explain why data is NOT stored

If a feature requires storing user data, it **does not belong in this app**.

---

**Happy contributing! 🎉**

---

*Built with ❤️ by [Meridian App House](https://meridianapphouse.com)*

*Your data. Your apps. No bullshit.*
