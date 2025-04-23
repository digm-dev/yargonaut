# @digm/yargonaut

> ✨ Decorate your [yargs](https://yargs.js.org/) CLI output with [chalk](https://github.com/chalk/chalk) styles
> and [figlet](https://github.com/patorjk/figlet.js) fonts.

[![NPM Version](https://img.shields.io/npm/v/@digm/yargonaut?style=flat-square)](https://www.npmjs.com/package/@digm/yargonaut)
[![License](https://img.shields.io/npm/l/@digm/yargonaut?style=flat-square)](./LICENSE)

<!-- Add other badges later: Build Status, Coverage, etc. -->
<!-- ![yargs + chalk + figlet = yes please](https://img.shields.io/badge/yargs%20%2B%20chalk%20%2B%20figlet-yes%2C%20please!-ff69b4.svg) -->

---

**💡 Note:** This package, `@digm/yargonaut`, is a modern rewrite and successor to the original [
`yargonaut`](https://github.com/jamestalmage/yargonaut) package by James Talmage. It aims to provide the same core
functionality but with improved stability and a slightly different API. **Full credit for the original concept goes to
James Talmage.**

---

## Table of Contents

- [Motivation](#motivation)
- [Installation](#installation)
- [Usage](#usage)
- [Example Output (Conceptual)](#example-output-conceptual)
- [Customizing Output](#customizing-output)
- [API Summary](#api-summary)
- [API Details](#api-details)
  - [Constructor](#constructor)
  - [Configuration Methods](#configuration-methods)
  - [Utility Methods](#utility-methods)
  - [Types](#types)
- [Development](#development)
  - [Conventional Commits & Local Validation (Optional)](#conventional-commits--local-validation-optional)
- [TypeScript Types](#typescript-types)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## Motivation

The original `yargonaut` was a fantastic idea but relied on patching Node.js's `require` mechanism, which could be
fragile and dependent on specific versions of `yargs` and `y18n`.

This rewrite (`@digm/yargonaut`) achieves the same goal – styling `yargs` output – by using the official `yargs`
`updateLocale` API. This results in:

- ✅ **Improved Stability:** No more monkey-patching internals. Works reliably across `yargs` versions (that support
  `updateLocale`).
- ✅ **No `require` Order Dependency:** Import `yargs` and `@digm/yargonaut` in any order.
- ✅ **Modern Codebase:** Written in TypeScript, uses modern JavaScript features.
- ✅ **Explicit Initialization:** Requires passing your `yargs` instance for clear control.

[Return to top](#table-of-contents)

## Installation

---

|      |                                                   |
|------|---------------------------------------------------|
| bun  | ```bun add @digm/yargonaut yargs chalk figlet```  |
| npm  | ```pnpm add @digm/yargonaut yargs chalk figlet``` |
| pnpm | ```pnpm add @digm/yargonaut yargs chalk figlet``` |
| yarn | ```yarn add @digm/yargonaut yargs chalk figlet``` |

> [!NOTE]
> `@digm/yargonaut` requires `yargs`, `chalk`, and `figlet` as peer dependencies. You need to install them alongside it.

[Return to top](#table-of-contents)

## Usage

---

The key difference from the original `yargonaut` is that you must instantiate `Yargonaut` with your configured `yargs`
instance.

```ts
import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';
import {Yargonaut} from '@digm/yargonaut'; // Import the class

// 1. Get your yargs instance
const yargsInstance = yargs(hideBin(process.argv));

// 2. Create a Yargonaut instance, passing the yargs instance
const yargonaut = new Yargonaut(yargsInstance);

// 3. Configure styles and fonts using yargonaut
yargonaut
    .style('blue.bold', 'Commands:') // Style specific keys
    .help('Big')                   // Apply 'Big' font to all help sections
    .errorsStyle('red');           // Apply 'red' style to all error messages

// 4. Define your yargs commands and options *on the original yargs instance*
yargsInstance
    .command('launch <rocket>', 'Launch the specified rocket', (y) => {
        y.positional('rocket', {describe: 'Rocket name', type: 'string'});
    })
    .option('speed', {alias: 's', describe: 'Launch speed', choices: ['ludicrous', 'warp'], default: 'warp'})
    .demandCommand(1, 'You must specify a command.')
    .help() // Enable standard help output (which will be styled)
    .argv; // Parse arguments and trigger output if needed

// Yargonaut automatically called yargsInstance.updateLocale() when you used .style(), .font(), etc.

````

[Return to top](#table-of-contents)

## Example Output (Conceptual)

---

Running the above script with `--help` might produce output where "Commands:" is blue and bold,
and the section titles ("Commands:", "Options:") are rendered using the "Big" figlet font,
while any error messages (e.g., for missing commands) would appear in red.

[Return to top](#table-of-contents)

## Customizing Output

---

For fine-grained control, you can provide a function to `customizeOutput`.
This function runs after `Yargonaut` applies its styles/fonts but before the string is sent to `yargs`.

```ts
import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import {Yargonaut} from "@digm/yargonaut";
import type figlet from "figlet"; // Import figlet type if needed

const yargsInstance = yargs(hideBin(process.argv));
const yargonaut = new Yargonaut(yargsInstance);

yargonaut.customizeOutput(
    ({ key, modifiedString, fontName, styleString }) => {
        console.log(
            `[Customizing] Key: ${key}, Font: ${fontName}, Style: ${styleString}`,
        );
        // Add a prefix to all modified strings
        if (typeof modifiedString === "string") {
            return `🚀 ${modifiedString}`;
        }
        // Handle plural objects if necessary
        if (typeof modifiedString === "object" && modifiedString !== null) {
            return {
                one: `🚀 ${modifiedString.one}`,
                other: `🚀 ${modifiedString.other}`,
            };
        }
        return modifiedString;
    },
);

yargonaut.help("Standard"); // Apply font, then customization function will run

yargsInstance.command("fly", "Fly somewhere").help().argv;
```

[Return to top](#table-of-contents)

## API Summary

---

| Method                                                                                           | Type        | Description                                          |
|:-------------------------------------------------------------------------------------------------|:------------|:-----------------------------------------------------|
| [`new Yargonaut(yargs)`](#new-yargonautyargsinstance)                                            | Constructor | Creates & initializes the Yargonaut instance.        |
| **Configuration Methods**                                                                        |             | **(Chainable)**                                      |
| [`.help(fontName)`](#helpfontname)                                                               | Config      | Apply figlet font to help section titles.            |
| [`.errors(fontName)`](#errorsfontname)                                                           | Config      | Apply figlet font to error message titles.           |
| [`.font(fontName, keys)`](#fontfontname-keys)                                                    | Config      | Apply figlet font to specific or all keys.           |
| [`.helpStyle(styleString)`](#helpstylestylestring)                                               | Config      | Apply chalk style to help sections.                  |
| [`.errorsStyle(styleString)`](#errorsstylestylestring)                                           | Config      | Apply chalk style to error messages.                 |
| [`.style(styleString, keys)`](#stylestylestring-keys)                                            | Config      | Apply chalk style to specific or all keys.           |
| [`.transformWholeString(keys)`](#transformwholestringkeys)                                       | Config      | Render entire string with figlet for specified keys. |
| [`.transformUpToFirstColon(keys)`](#transformuptofirstcolonkeys)                                 | Config      | Render string up to first colon with figlet.         |
| [`.customizeOutput(customizationFunction)`](#customizeoutputcustomizationfunction)               | Config      | Set a function for final output customization.       |
| **Utility Methods**                                                                              |             |                                                      |
| [`.renderTextAsFont(text, fontName)`](#rendertextasfonttext-fontname)                            | Utility     | Renders text with a specified figlet font.           |
| [`.listAvailableFonts()`](#listavailablefonts)                                                   | Utility     | Returns an array of available figlet font names.     |
| [`.printTextInFont(fontName, text)`](#printtextinfontfontname-text)                              | Utility     | Prints text rendered in a specific font to console.  |
| [`.printTextInAllFonts(text)`](#printtextinallfontstext)                                         | Utility     | Prints text rendered in all available fonts.         |
| [`.getFigletInstance()`](#getfigletinstance)                                                     | Utility     | Returns the `figlet` instance.                       |
| [`.getChalkInstance()`](#getchalkinstance)                                                       | Utility     | Returns the `chalk` instance.                        |

[Return to top](#table-of-contents)

## API Details

---

### Constructor

#### [`new Yargonaut(yargsInstance)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L110)

Creates and initializes a new Yargonaut instance, linking it to your configured `yargs` instance.

* **Parameters:**
    * `yargsInstance: YargsInstance` - The instance returned by `yargs/yargs(...)`. Must have an `updateLocale` method.
* **Throws:** `Error` if `yargsInstance` is invalid or missing `updateLocale`.
* **Returns:** `Yargonaut` instance.

---

### Configuration Methods

These methods configure how Yargonaut styles output and are chainable (they return `this`).

#### [`.help(fontName)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L134)

Apply a specific figlet font to the titles of help sections (e.g., "Commands:", "Options:").

* **Parameters:**
    * `fontName: string` - The name of the figlet font (e.g., `'Standard'`, `'Big'`). See ![
      `.listAvailableFonts()`](#listavailablefonts).
* **Returns:** `this` (Yargonaut instance).

---

#### [`.errors(fontName)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L144)

Apply a specific figlet font to the titles of error messages (where applicable based on the transform function, e.g., "
Missing required argument:").

* **Parameters:**
    * `fontName: string` - The name of the figlet font. See ![`.listAvailableFonts()`](#listavailablefonts).
* **Returns:** `this` (Yargonaut instance).

---

#### [`.font(fontName, keys)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L173)

Apply a specific figlet font to one or more yargs locale keys.

* **Parameters:**
    * `fontName: string` - The name of the figlet font. See ![`.listAvailableFonts()`](#listavailablefonts).
    * `keys?: string | string[]` - Optional. A single key string or an array of key strings to apply the font to. If
      omitted, applies to all known keys.
* **Returns:** `this` (Yargonaut instance).

---

#### [`.helpStyle(styleString)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L186)

Apply a chalk style to all help section titles.

* **Parameters:**
    * `styleString: string` - A chalk style string (e.g., `'blue.bold'`). See ![
      Chalk documentation](https://github.com/chalk/chalk#styles).
* **Returns:** `this` (Yargonaut instance).

---

#### [`.errorsStyle(styleString)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L197)

Apply a chalk style to all error messages.

* **Parameters:**
    * `styleString: string` - A chalk style string (e.g., `'red'`). See ![
      Chalk documentation](https://github.com/chalk/chalk#styles).
* **Returns:** `this` (Yargonaut instance).

---

#### [`.style(styleString, keys)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L213)

Apply a chalk style to one or more yargs locale keys.

* **Parameters:**
    * `styleString: string` - A chalk style string (e.g., `'green.underline'`). See ![
      Chalk documentation](https://github.com/chalk/chalk#styles).
    * `keys?: string | string[]` - Optional. A single key string or an array of key strings to apply the style to. If
      omitted, applies to all known keys.
* **Returns:** `this` (Yargonaut instance).

---

#### [`.transformWholeString(keys)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L225)

Set the transform strategy to render the entire string with figlet for the specified keys.

* **Parameters:**
    * `keys?: string | string[]` - Optional. Key(s) to apply this transform strategy to. If omitted, applies to all
      known
      keys.
* **Returns:** `this` (Yargonaut instance).

---

#### [`.transformUpToFirstColon(keys)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L240)

Set the transform strategy to render only the part of the string up to the first colon with figlet for the specified
keys. This is useful for keys like "Missing required argument: %s" where you only want to figletize the label part.

* **Parameters:**
    * `keys?: string | string[]` - Optional. Key(s) to apply this transform strategy to. If omitted, applies to all
      known
      keys.
* **Returns:** `this` (Yargonaut instance).

---

#### [`.customizeOutput(customizationFunction)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L252)

Set a function to customize the output before it's sent to yargs. This lets you add your own final touches to the text after Yargonaut has applied fonts and styles, but before the text is passed to yargs.

* **Parameters:**
    * `customizationFunction: OutputCustomizationFunction | undefined` - A function that processes the text, or `undefined` to remove a previously set function. The function receives an object with the key, original string, modified string, figlet instance, font name, and style string, and returns the final string to use.
* **Returns:** `this` (Yargonaut instance).

---

### Utility Methods

These methods provide utility functions for working with figlet fonts and chalk styles.

#### [`.renderTextAsFont(text, fontName)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L279)

Render text using a specified figlet font.

* **Parameters:**
    * `text: string` - The text to render.
    * `fontName?: string` - Optional. The name of the figlet font to use. If omitted, the default font is used.
* **Returns:** `string` - The rendered string, or the original string if there is an error.

---

#### [`.listAvailableFonts()`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L305)

Get a list of all available figlet fonts.

* **Returns:** `string[]` - Array of font names. If there is an error, an empty array is returned and the error is
  logged.

---

#### [`.printTextInFont(fontName, text)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L328)

Print text rendered in a specific font to the console.

* **Parameters:**
    * `fontName?: string` - Optional. The name of the figlet font to use. Defaults to the default font.
    * `text?: string` - Optional. The text to render. Defaults to the fontName.
* **Returns:** `void`.

---

#### [`.printTextInAllFonts(text)`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L339)

Print text rendered in all available fonts to the console.

* **Parameters:**
    * `text?: string` - Optional. The text to render. Defaults to the font name for each font.
* **Returns:** `void`.

---

#### [`.getFigletInstance()`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L350)

Get the figlet instance used by Yargonaut.

* **Returns:** `typeof figlet` - The figlet instance.

---

#### [`.getChalkInstance()`](https://github.com/xerullian/yargonaut/blob/main/src/yargonaut.ts#L359)

Get the chalk instance used by Yargonaut.

* **Returns:** `typeof chalk` - The chalk instance.

---

> [!Note] 
> This documentation does not cover internal methods that are not exported in the public

### Differences from Original yargonaut

- **Initialization**: Requires `new Yargonaut(yargsInstance)` instead of just `require('yargonaut')`.
- No `require` Order: Does not depend on being required before `yargs`.
- **Stability**: Uses public `yargs.updateLocale` API, avoiding internal patching.
- `ocd` **Renamed**: The `ocd()` method is now `outputCustomizationDelegate()` with slightly different parameters passed
  to
  the callback.
- **Getter Methods Removed**: Methods like `getAllKeys`, `getHelpKeys`, `getErrorKeys` are removed from the instance
  API (
  they are internal implementation details or available via imports from `yargs-keys.ts` if needed).

[Return to top](#table-of-contents)

## Development

### Conventional Commits & Local Validation (Optional)

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for versioning and changelog generation, managed by [Cocogitto](https://github.com/cocogitto/cocogitto). Use the `cog` command for interactions.

To help ensure your commit messages follow the standard *before* you push, we provide an optional Git `commit-msg` hook that validates your message locally. This gives you immediate feedback and helps prevent CI failures on pull requests.

**Installation:**

1.  Make sure you have `cocogitto` installed (usually via `cargo install cocogitto` or `brew install cocogitto/tap/cocogitto`).
2.  Navigate to the project root directory in your terminal.
3.  Run the following command to install the hook defined in our `cog.toml`:

    ```bash
    cog install-hook commit-msg
    ```
    (Alternatively, `cog install-hook --all` installs all hooks defined in `cog.toml`, if any others are added in the future).

**Usage:**

Once installed, the hook runs automatically every time you execute `git commit`. If your commit message doesn't adhere to the Conventional Commits standard, the hook will prevent the commit and show an error message, prompting you to fix the message.

You can bypass the hook temporarily if needed (e.g., for `fixup!` commits if you haven't configured them to be ignored) using `git commit --no-verify`.

While this hook is optional, using it is recommended for a smoother development experience. The commit message format is enforced server-side via GitHub Actions on Pull Requests regardless.

[Return to top](#table-of-contents)

## TypeScript Types

Yargonaut is written in TypeScript and exports type definitions for better developer experience. The following types are
available for import:

### Core Types

```typescript
import {
    Yargonaut,
    TransformFunction,
    OutputCustomizationFunction,
    YargsKeyConfig
} from 'yargonaut';
```

### OutputCustomizationFunction

This type defines the function signature for custom output handlers:

```typescript
// Parameters for the output customization function
interface OutputCustomizationParams {
  /** The yargs locale key being processed */
  key: string;
  /** The original string from yargs before any modifications */
  originalString: string | { one: string; other: string };
  /** The string after Yargonaut has applied fonts and styles */
  modifiedString: string | { one: string; other: string };
  /** The figlet library instance for additional font rendering if needed */
  figletInstance: typeof figlet;
  /** The name of the font that was applied, if any */
  fontName?: string;
  /** The style string that was applied, if any */
  styleString?: string;
}

// Function type for customizing output
type OutputCustomizationFunction = (
  params: OutputCustomizationParams
) => string | { one: string; other: string };
```

Example usage:

```typescript
const myCustomizer: OutputCustomizationFunction = ({ key, modifiedString, fontName }) => {
    // Add a prefix to all help text
    if (key === 'help') {
        return `✨ ${modifiedString}`;
    }
    // For other keys, just return the already modified value
    return modifiedString;
};

yargonaut.customizeOutput(myCustomizer);
```

### TransformFunction

This type defines how text is split for figlet rendering:

```typescript
type TransformFunction = (text: string) => {
    renderPart: string;
    nonRenderPart: string
};
```

Example of a custom transform function:

```typescript
const customTransform: TransformFunction = (text) => {
    // Only render the first word with figlet
    const words = text.split(' ');
    const firstWord = words.shift() || '';
    return {
        renderPart: firstWord,
        nonRenderPart: words.length ? ' ' + words.join(' ') : ''
    };
};

// Apply your custom transform to specific keys
yargonaut.font('Standard', 'Commands:')
    .#applyTransform(customTransform, ['Commands:']);
```

### YargsKeyConfig

This type defines the configuration for yargs locale keys:

```typescript
type YargsKeyConfig = {
    transform?: TransformFunction;
    error?: boolean;
    plural?: string;
    isPlural?: boolean;
};
```

[Return to top](#table-of-contents)

## Contributing

**Development Environment:**

This project uses [Bun](https://bun.sh/) as the runtime and package manager for development. Please ensure you have Bun installed before attempting to contribute. It's used for installing dependencies, running tests, executing build scripts, and managing version updates via hooks.

Contributions to `@digm/yargonaut` are welcome and appreciated! Here's how you can contribute:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
3. **Install dependencies**:
   ```bash
   bun install
   ```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** and write tests if applicable
3. **Run tests** to ensure everything works:
   ```bash
   bun test
   ```
4. **Run linting** to ensure code quality:
   ```bash
   bun run lint
   ```
5. **Format your code**:
   ```bash
   bun run format:biome
   ```

### Pull Requests

1. **Push your changes** to your fork
2. **Submit a pull request** to the main repository
3. **Describe your changes** in detail in the PR description
4. **Reference any related issues** using GitHub's issue linking

### Code Style

This project uses ESLint and Biome for code quality and formatting.
Please ensure your code follows these standards by running the linting and formatting commands before submitting a PR.

### Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub. Be sure to include:

- A clear, descriptive title
- A detailed description of the issue or feature request
- Steps to reproduce (for bugs)
- Expected behavior and actual behavior
- Any relevant code snippets or error messages

[Return to top](#table-of-contents)

## Acknowledgements

- All contributors to `yargs`, `chalk`, and `figlet`.

[Return to top](#table-of-contents)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

[Return to top](#table-of-contents)