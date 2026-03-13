import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SCENARIOS = {
  'Hero -> Story transition': async (page) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await wait(1000);
    
    // Scroll to Story panel (assuming it's around 100vh down)
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    });
    
    await wait(2000);
    return await captureTransitionState(page, 'hero-story');
  },
  
  'Story -> Event transition': async (page) => {
    // Scroll to Story panel first
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }));
    await wait(1000);
    
    // Scroll to Event/Details panel
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 2, behavior: 'smooth' });
    });
    
    await wait(2000);
    return await captureTransitionState(page, 'story-event');
  },
  
  'Reverse scroll Event -> Story': async (page) => {
    // Start at Event panel
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' }));
    await wait(1000);
    
    // Scroll back to Story
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    });
    
    await wait(2000);
    return await captureTransitionState(page, 'event-story-reverse');
  },
  
  'Fast-scroll forward (Hero -> Story -> Event)': async (page) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await wait(500);
    
    // Fast scroll through multiple panels
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 2.5, behavior: 'auto' });
    });
    
    await wait(1500);
    return await captureTransitionState(page, 'fast-forward');
  },
  
  'Fast-scroll reverse (Event -> Story -> Hero)': async (page) => {
    // Start at Event panel
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.5, behavior: 'instant' }));
    await wait(500);
    
    // Fast scroll back
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    
    await wait(1500);
    return await captureTransitionState(page, 'fast-reverse');
  }
};

async function captureTransitionState(page, scenarioId) {
  const state = await page.evaluate(() => {
    const results = {
      heroOverlayPresent: false,
      visiblePanels: [],
      emptyGlassShells: 0,
      unreadableContent: 0,
      consoleErrors: [],
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight
    };
    
    // Check for hero/logo overlay
    const heroOverlay = document.querySelector('[data-hero-overlay]') || 
                       document.querySelector('.hero-overlay') ||
                       document.querySelector('[class*="hero"][class*="overlay"]');
    results.heroOverlayPresent = heroOverlay ? 
      window.getComputedStyle(heroOverlay).opacity > 0 : false;
    
    // Find all panel elements - look for common patterns
    const selectors = [
      '[data-panel-id]',
      '[data-panel]',
      '[class*="Panel"]',
      '[class*="panel"]',
      'section',
      '[data-tier]'
    ];
    
    const panelElements = new Set();
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => panelElements.add(el));
    });
    
    Array.from(panelElements).forEach(panel => {
      const rect = panel.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible) {
        const panelId = panel.dataset.panelId || 
                       panel.dataset.panel || 
                       panel.dataset.tier ||
                       panel.id || 
                       panel.className;
        const computedStyle = window.getComputedStyle(panel);
        const text = panel.textContent.trim();
        const hasContent = text.length > 0;
        const opacity = parseFloat(computedStyle.opacity);
        const isTransparent = opacity < 0.1;
        
        results.visiblePanels.push({
          id: String(panelId).substring(0, 100),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height),
          opacity: opacity,
          hasContent,
          contentLength: text.length,
          contentPreview: text.substring(0, 50)
        });
        
        // Check for empty glass shells (visible but transparent or no content)
        if ((isTransparent || !hasContent) && rect.height > 50) {
          results.emptyGlassShells++;
        }
        
        // Check for unreadable content (has text but very low opacity)
        if (hasContent && opacity < 0.3 && opacity > 0.01) {
          results.unreadableContent++;
        }
      }
    });
    
    return results;
  });
  
  // Get console errors from page
  return state;
}

async function runTests() {
  console.log('Starting choreography validation tests...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(`Runtime error: ${error.message}`);
  });
  
  try {
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('Page loaded successfully\n');
    console.log('='.repeat(80));
    
    const results = {};
    
    for (const [scenarioName, testFn] of Object.entries(SCENARIOS)) {
      console.log(`\nTesting: ${scenarioName}`);
      console.log('-'.repeat(80));
      
      try {
        const state = await testFn(page);
        state.consoleErrors = [...consoleErrors];
        consoleErrors.length = 0; // Clear for next test
        
        results[scenarioName] = analyzeScenario(scenarioName, state);
        
        console.log(`Status: ${results[scenarioName].passed ? 'PASS ✓' : 'FAIL ✗'}`);
        console.log(`Scroll position: ${state.scrollY}px (viewport: ${state.viewportHeight}px)`);
        console.log(`Visible panels: ${state.visiblePanels.length}`);
        state.visiblePanels.forEach((panel, idx) => {
          console.log(`  [${idx}] ${panel.id.substring(0, 60)}`);
          console.log(`      Position: top=${panel.top}, bottom=${panel.bottom}, height=${panel.height}`);
          console.log(`      Opacity: ${panel.opacity.toFixed(2)}, Content: ${panel.contentLength} chars`);
          if (panel.contentPreview) {
            console.log(`      Preview: "${panel.contentPreview.replace(/\n/g, ' ')}..."`);
          }
        });
        console.log(`Issues: ${results[scenarioName].issues.length === 0 ? 'None' : ''}`);
        results[scenarioName].issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
        
      } catch (error) {
        results[scenarioName] = {
          passed: false,
          issues: [`Test execution failed: ${error.message}`]
        };
        console.log(`Status: FAIL ✗`);
        console.log(`  - Test execution failed: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\nFINAL SUMMARY:');
    console.log('='.repeat(80));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [scenario, result] of Object.entries(results)) {
      const status = result.passed ? 'PASS ✓' : 'FAIL ✗';
      console.log(`\n${scenario}: ${status}`);
      
      if (result.passed) {
        totalPassed++;
      } else {
        totalFailed++;
        if (result.issues.length > 0) {
          console.log('  Issues:');
          result.issues.forEach(issue => console.log(`    - ${issue}`));
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

function analyzeScenario(scenarioName, state) {
  const issues = [];
  
  // Filter out infrastructure/container elements that are expected to be visible
  const contentPanels = state.visiblePanels.filter(p => 
    p.hasContent && 
    p.contentLength > 50 && // Real content, not just boilerplate
    !p.id.includes('sceneRoot') && 
    !p.id.includes('panelLayer') &&
    !p.id.includes('panelStage')
  );
  
  // Validation rules based on scenario
  if (scenarioName.includes('Hero -> Story')) {
    // Hero overlay should exit before Story becomes readable
    if (state.heroOverlayPresent) {
      const storyPanel = contentPanels.find(p => 
        p.contentPreview && p.contentPreview.includes('История')
      );
      if (storyPanel && storyPanel.opacity > 0.5) {
        issues.push('Hero overlay still present while Story panel is readable');
      }
    }
  }
  
  // Check for actual empty glass shells (not infrastructure containers)
  // Look for elements with reasonable size, visibility, but no content
  const actualEmptyShells = state.visiblePanels.filter(p => 
    !p.hasContent && 
    p.height > 200 && 
    p.opacity > 0.5 &&
    p.id.includes('panelStack') // This is the suspicious empty stack
  );
  
  if (actualEmptyShells.length > 0) {
    issues.push(`${actualEmptyShells.length} empty glass shell(s) detected: ${actualEmptyShells.map(s => s.id.substring(0, 40)).join(', ')}`);
  }
  
  // Check for multiple DISTINCT content panels visible (not duplicates in DOM hierarchy)
  const distinctContent = new Map();
  contentPanels.forEach(p => {
    const preview = p.contentPreview || '';
    if (!distinctContent.has(preview) && p.opacity > 0.3) {
      distinctContent.set(preview, p);
    }
  });
  
  if (distinctContent.size > 2 && !scenarioName.includes('Fast-scroll')) {
    const panels = Array.from(distinctContent.values());
    issues.push(`Multiple distinct content panels visible: ${panels.map(p => p.contentPreview.substring(0, 30)).join(' | ')}`);
  }
  
  // Check for unreadable content (partially faded)
  const partiallyVisible = contentPanels.filter(p => 
    p.opacity > 0.1 && p.opacity < 0.5
  );
  
  if (partiallyVisible.length > 0) {
    issues.push(`${partiallyVisible.length} panel(s) with partially visible content (opacity ${partiallyVisible.map(p => p.opacity.toFixed(2)).join(', ')})`);
  }
  
  // Check for disappear/reappear - look for panels with opacity = 0 that have content
  const hiddenButPresent = state.visiblePanels.filter(p =>
    p.hasContent && 
    p.contentLength > 50 &&
    p.opacity === 0 &&
    p.height > 100
  );
  
  if (hiddenButPresent.length > 0) {
    issues.push(`${hiddenButPresent.length} content panel(s) present but hidden (possible flicker)`);
  }
  
  // Check for console/runtime errors
  if (state.consoleErrors.length > 0) {
    // Filter out known non-critical errors
    const criticalErrors = state.consoleErrors.filter(err => 
      !err.includes('404') || err.includes('.js') || err.includes('.css')
    );
    if (criticalErrors.length > 0) {
      issues.push(`Console errors: ${criticalErrors.join('; ')}`);
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
    state
  };
}

runTests().catch(console.error);
