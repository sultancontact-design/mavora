import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Mavora (مافورa)
 * Arabic Marketplace - Morocco (ar-MA)
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // ============================================================
  // Test Directory
  // ============================================================
  testDir: './e2e',
  
  // ============================================================
  // Parallel Execution
  // ============================================================
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  // ============================================================
  // CI Settings
  // ============================================================
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  // ============================================================
  // Reporter Configuration
  // ============================================================
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    process.env.CI ? ['json', { outputFile: 'test-results.json' }] : null,
  ].filter(Boolean) as any,
  
  // ============================================================
  // Global Settings
  // ============================================================
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Action timeout */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
    
    /* Default locale for tests */
    locale: 'ar-MA',
    
    /* Timezone */
    timezoneId: 'Africa/Casablanca',
    
    /* Color scheme */
    colorScheme: 'light',
  },

  // ============================================================
  // Browser Projects Configuration
  // ============================================================
  /* Configure projects for major browsers */
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile Devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet
    {
      name: 'Tablet Safari',
      use: { ...devices['iPad Pro'] },
    },
    
    // Dark Mode Testing
    {
      name: 'Dark Mode - Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
  ],

  // ============================================================
  // Web Server Configuration
  // ============================================================
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // ============================================================
  // Test Timeout Configuration
  // ============================================================
  timeout: 60000,
  expect: {
    /* Default timeout for assertions */
    timeout: 10000,
  },
  
  // ============================================================
  // Global Setup/Teardown
  // ============================================================
  /* Global setup file for test environment preparation */
  // globalSetup: './e2e/setup/global-setup.ts',
  // globalTeardown: './e2e/setup/global-teardown.ts',
  
  // ============================================================
  // Output Directory
  // ============================================================
  outputDir: 'test-results',
  
  // ============================================================
  // Ignore Patterns
  // ============================================================
  // ignore: ['**/helpers/**', '**/fixtures/**'],
});
