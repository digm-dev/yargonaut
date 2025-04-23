// Test setup file to silence console output during tests
// This helps prevent excessive logging that might interfere with coverage reporting
import { mock } from 'bun:test'; // Ensure mock is imported

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  debug: console.debug,
  warn: console.warn,
  // Keep error logging enabled for debugging test failures
  // error: console.error
};

// --- Store original process.exit --- 
const originalProcessExit = process.exit;

// Replace console methods with no-op functions during tests
// This prevents excessive output that might interfere with coverage collection
if (process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  
  // Only silence warnings if explicitly requested
  if (process.env.SILENCE_WARNINGS === 'true') {
    console.warn = () => {};
  }
  
  // --- Mock process.exit to prevent tests stopping prematurely ---
  process.exit = mock((code?: number) => {
    // Log the attempt to exit, but don't actually exit
    // Use originalConsole.warn to ensure it's visible even if console.warn is silenced
    originalConsole.warn(`Intercepted process.exit with code: ${code ?? 'unknown'}`);
  }) as never;
  
  // Error logs are kept for debugging purposes
}

// Export a function to restore console behavior if needed in specific tests
export function restoreConsole() {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.warn = originalConsole.warn;
}

// Export a function to re-silence console if needed after temporary restoration
export function silenceConsole() {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  if (process.env.SILENCE_WARNINGS === 'true') {
    console.warn = () => {};
  }
}

// --- Export function to restore process.exit (optional, if needed) ---
export function restoreProcessExit() {
  process.exit = originalProcessExit;
}
