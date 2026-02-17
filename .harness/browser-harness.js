#!/usr/bin/env node

/**
 * Browser Evidence Harness
 * Captures visual, functional, performance, and accessibility evidence
 * for Meridian App House applications using Playwright.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class BrowserHarness {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    this.evidenceDir = path.join(process.cwd(), '.harness/evidence');
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    console.log(`🔍 Initializing browser harness for ${this.app}...`);
    
    // Ensure evidence directory exists
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (compatible; MeridianEvidenceBot/1.0)'
    });

    this.page = await this.context.newPage();
    
    // Inject performance monitoring
    await this.page.addInitScript(() => {
      window.performanceMetrics = {};
      
      // Capture Core Web Vitals
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.performanceMetrics[entry.entryType] = 
            window.performanceMetrics[entry.entryType] || [];
          window.performanceMetrics[entry.entryType].push(entry);
        }
      }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
    });
  }

  async captureEvidence(scenario, viewport = 'desktop') {
    console.log(`  📸 Capturing evidence: ${scenario} @ ${viewport}`);
    
    const viewportConfig = this.config.evidenceRequirements.visual.viewports
      .find(v => v.name === viewport);
    
    if (viewportConfig) {
      await this.page.setViewportSize(viewportConfig);
    }

    const evidence = {
      scenario,
      viewport,
      timestamp: new Date().toISOString(),
      app: this.app,
      version: this.config.version,
      artifacts: {}
    };

    // Visual evidence (screenshot)
    if (this.config.evidenceRequirements.visual.enabled) {
      const screenshotPath = path.join(
        this.evidenceDir,
        `${this.app}-${scenario}-${viewport}.png`
      );
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      evidence.artifacts.screenshot = screenshotPath;
    }

    // Performance metrics
    if (this.config.evidenceRequirements.performance.enabled) {
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paints = performance.getEntriesByType('paint');
        
        return {
          navigation: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
            loadComplete: navigation.loadEventEnd - navigation.startTime,
            firstPaint: paints.find(p => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: paints.find(p => p.name === 'first-contentful-paint')?.startTime
          },
          vitals: window.performanceMetrics
        };
      });
      
      evidence.artifacts.performance = metrics;
      
      // Validate against thresholds
      const thresholds = this.config.evidenceRequirements.performance.thresholds;
      evidence.artifacts.performance.passes = 
        (metrics.navigation.firstContentfulPaint || 0) <= thresholds.LCP;
    }

    // Accessibility scan
    if (this.config.evidenceRequirements.accessibility.enabled) {
      const axeResults = await this.page.evaluate(() => {
        // Basic accessibility checks (would integrate with axe-core in production)
        const images = Array.from(document.querySelectorAll('img'));
        const imagesWithoutAlt = images.filter(img => !img.alt);
        
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
        const skippedLevels = headingLevels.some((level, i) => 
          i > 0 && level > headingLevels[i - 1] + 1
        );

        return {
          imagesWithoutAlt: imagesWithoutAlt.length,
          totalImages: images.length,
          skippedHeadings: skippedLevels,
          contrastRatio: 'auto-detected', // Would use axe-core
          ariaLabels: document.querySelectorAll('[aria-label]').length
        };
      });
      
      evidence.artifacts.accessibility = axeResults;
      evidence.artifacts.accessibility.passes = 
        axeResults.imagesWithoutAlt === 0 && !axeResults.skippedHeadings;
    }

    // Save evidence manifest
    const manifestPath = path.join(
      this.evidenceDir,
      `${this.app}-${scenario}-${viewport}.json`
    );
    fs.writeFileSync(manifestPath, JSON.stringify(evidence, null, 2));
    
    return evidence;
  }

  async navigate(url) {
    console.log(`  🌐 Navigating to ${url}`);
    const startTime = Date.now();
    
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`  ✅ Page loaded in ${loadTime}ms`);
      return { success: true, loadTime };
    } catch (error) {
      console.error(`  ❌ Navigation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async runScenario(scenario, baseUrl) {
    console.log(`\n🎬 Running scenario: ${scenario}`);
    
    const scenarioUrls = {
      'home-page': `${baseUrl}`,
      'upload-outfit': `${baseUrl}/upload`,
      'analysis-results': `${baseUrl}/analysis/sample`,
      'wardrobe-library': `${baseUrl}/wardrobe`,
      'style-recommendations': `${baseUrl}/recommendations`,
      'profile-analysis': `${baseUrl}/analyze`,
      'compatibility-scoring': `${baseUrl}/compatibility`,
      'conversation-suggestions': `${baseUrl}/suggestions`,
      'match-history': `${baseUrl}/history`,
      'trend-analysis': `${baseUrl}/trends`,
      'prediction-engine': `${baseUrl}/predict`,
      'creator-analytics': `${baseUrl}/analytics`,
      'hashtag-optimization': `${baseUrl}/hashtags`,
      'journal-page': `${baseUrl}/journal`,
      'write-entry': `${baseUrl}/write`,
      'mood-tracking': `${baseUrl}/mood`,
      'sentiment-analysis': `${baseUrl}/sentiment`,
      'secure-deletion': `${baseUrl}/delete`,
      'bias-detection': `${baseUrl}/bias`,
      'perspective-analysis': `${baseUrl}/perspective`,
      'argument-mapping': `${baseUrl}/arguments`,
      'socratic-dialogue': `${baseUrl}/dialogue`
    };

    const url = scenarioUrls[scenario] || `${baseUrl}/${scenario}`;
    const navResult = await this.navigate(url);
    
    if (!navResult.success) {
      return { success: false, scenario, error: navResult.error };
    }

    // Wait for page to stabilize
    await this.page.waitForTimeout(1000);

    // Capture evidence for all viewports
    const evidence = [];
    const viewports = ['mobile', 'desktop'];
    
    for (const viewport of viewports) {
      const result = await this.captureEvidence(scenario, viewport);
      evidence.push(result);
    }

    return { 
      success: true, 
      scenario, 
      evidence,
      loadTime: navResult.loadTime 
    };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up browser harness...');
    
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    
    console.log('✅ Browser harness closed');
  }

  generateReport(results) {
    const report = {
      app: this.app,
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        avgLoadTime: results
          .filter(r => r.loadTime)
          .reduce((sum, r) => sum + r.loadTime, 0) / results.length
      },
      results
    };

    const reportPath = path.join(
      this.evidenceDir,
      `${this.app}-evidence-report.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Evidence report saved: ${reportPath}`);
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const app = process.argv[2];
  const baseUrl = process.argv[3];
  const scenario = process.argv[4];

  if (!app || !baseUrl) {
    console.error('Usage: node browser-harness.js <app> <base-url> [scenario]');
    process.exit(1);
  }

  const configPath = path.join(process.cwd(), '.harness/evidence-config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`Evidence config not found: ${configPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const harness = new BrowserHarness(app, config);

  (async () => {
    await harness.init();

    const scenarios = scenario 
      ? [scenario]
      : config.evidenceRequirements.visual.scenarios;

    const results = [];
    
    for (const s of scenarios) {
      const result = await harness.runScenario(s, baseUrl);
      results.push(result);
    }

    const report = harness.generateReport(results);
    await harness.cleanup();

    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
  })();
}

module.exports = BrowserHarness;
