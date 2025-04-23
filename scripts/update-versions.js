#!/usr/bin/env bun
// scripts/update-versions.js
import { argv } from 'node:process';
import { existsSync } from 'node:fs'; // Using Node's fs for existsSync compatibility

const newVersion = argv[2];
const packageJsonPath = './package.json';
const jsrJsonPath = './jsr.json';

if (!newVersion) {
  console.error('Error: No version argument provided.');
  process.exit(1);
}

// Basic semver validation (adjust regex if needed for more complex versions)
if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/.test(newVersion)) {
    console.error(`Error: Invalid version format provided: ${newVersion}`);
    process.exit(1);
}

console.log(`Updating versions to: ${newVersion}`);

async function updateVersionInFile(filePath) {
  try {
    if (!existsSync(filePath)) {
       console.warn(`Warning: File not found, skipping: ${filePath}`);
       return; // Don't treat missing files as fatal errors
    }

    const file = Bun.file(filePath); // Bun API to read file
    const content = await file.json(); // Bun API to parse JSON

    if (content.version === newVersion) {
        console.log(` - ${filePath} already at version ${newVersion}. Skipping.`);
        return;
    }

    console.log(` - Updating ${filePath} from ${content.version} to ${newVersion}`);
    content.version = newVersion;

    // Write back using Bun API, formatted nicely (2 spaces indent + newline)
    await Bun.write(filePath, JSON.stringify(content, null, 2) + '\n');

  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    process.exit(1); // Exit if we fail to read/write/parse a file that exists
  }
}

// Update both files
await updateVersionInFile(packageJsonPath);
await updateVersionInFile(jsrJsonPath);

console.log('Version updates complete.');
