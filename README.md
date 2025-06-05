# node-strip-code

`node-strip-code` is a Node.js module used to remove sections of code from your files. It's ideal for stripping out development-only or test-only code (like debug statements, test hooks, etc.) from production builds.

It works by identifying code sections using start and end comment delimiters or by matching custom regular expression patterns.

For example:

```
/* test-code */
removeMeInProduction();
/* end-test-code */

doNotRemoveMe();


```

A common use-case is to make private JavaScript functions accessible to unit tests without exposing them in the final production code. This [blog post by Philip Walton](http://philipwalton.com/articles/how-to-unit-test-private-functions-in-javascript/) provides more context on this concept.

This module is the core logic behind the [grunt-strip-code](https://github.com/nuzzio/grunt-strip-code) Grunt plugin.


## Stats

Travis CI

| Branch  | CI                                                                                                            | Tests                                                                                                                                                                        |
|:--------|:--------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| main    | ![example](https://github.com/nuzzio/node-strip-code/actions/workflows/npm-test.yml/badge.svg?branch=main)    | [![Coverage Status](https://coveralls.io/repos/github/nuzzio/node-strip-code/badge.svg?branch=main)](https://coveralls.io/github/nuzzio/node-strip-code?branch=main)         |
| develop | ![example](https://github.com/nuzzio/node-strip-code/actions/workflows/npm-test.yml/badge.svg?branch=develop) | [![Coverage Status](https://coveralls.io/repos/github/nuzzio/node-strip-code/badge.svg?branch=develop)](https://coveralls.io/github/nuzzio/node-strip-code?branch=develop) |


AppVeyor

| Branch  | CI                                                                                                                                                              |
|:--------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| main    | [![Build Status](https://ci.appveyor.com/api/projects/status/9nmtj03i0f0k2yrx/branch/main?svg=true)](https://ci.appveyor.com/project/nuzzio/node-strip-code)    |
| develop | [![Build Status](https://ci.appveyor.com/api/projects/status/9nmtj03i0f0k2yrx/branch/develop?svg=true)](https://ci.appveyor.com/project/nuzzio/node-strip-code) |




## Features

* Strip code blocks defined by start and end comment-like delimiters.
* Strip code based on custom regular expression patterns.
* Supports multiple block types and multiple patterns.
* Optional checks for block parity (equal start/end tags) and block intersection (improper nesting).
* Returns a list of issues (errors/warnings) found during processing.
* Supports legacy options for backward compatibility with earlier versions of `grunt-strip-code`.

## Installation

Install using npm:

```bash
npm install node-strip-code --save-dev
```

Or using yarn:

```bash
yarn add node-strip-code --dev
```

## Usage

**As an ES Module (if your project uses `"type": "module"` in `package.json` or you're using `.mjs` files):**

```javascript
import strip from 'node-strip-code';
import fs from 'fs'; // Using ESM import for built-in module

// Example source code
const sourceCode = `
  function mainFeature() {
    console.log("Main feature is running.");

    /* dev-block-start */
    console.log("This is a development log.");
    const devVariable = true;
    /* dev-block-end */

    // debug-only-start
    if (devVariable) { // This line will cause an error if devVariable is stripped
        console.warn("Debug mode active!");
    }
    // debug-only-end

    console.log("Another main feature log.");
    console.error("This is an error that might be stripped by a pattern.");
  }
  mainFeature();
`;

// Define options for stripping
const options = {
  blocks: [
    {
      start_block: "/* dev-block-start */",
      end_block: "/* dev-block-end */"
    },
    {
      start_block: "// debug-only-start",
      end_block: "// debug-only-end"
    }
  ],
  patterns: [
    /console\.error\(.*\);?\s*(\r?\n)?/g // Remove console.error statements
  ],
  parityCheck: true,        // Default: true
  intersectionCheck: true   // Default: true
};

// Process the code (strip is now synchronous)
const result = strip(sourceCode, options);

// Check for issues
if (result.issues.length > 0) {
  console.warn("Issues found during stripping:");
  result.issues.forEach(issue => {
    console.warn(`- [${issue.type.toUpperCase()}] ${issue.message} (Line: ${issue.line || 'N/A'}, Block: ${issue.blockName || 'N/A'})`);
  });
}

// Use the stripped code
console.log("\n--- Original Code ---");
console.log(sourceCode);
console.log("\n--- Stripped Code ---");
console.log(result.strippedCode);

/*
Output might look like:

--- Original Code ---
... (original code) ...

--- Stripped Code ---

  function mainFeature() {
    console.log("Main feature is running.");



    console.log("Another main feature log.");
  }
  mainFeature();

*/
```

**If you need to use this ES Module from a CommonJS project:**

You would typically use dynamic `import()`:

```javascript
// In a CommonJS file (e.g., your_script.js)
async function main() {
  const { default: strip } = await import('node-strip-code'); // Dynamic import for ESM
  const fs = require('fs'); // fs can still be required

  const sourceCode = "..."; // (Same as above)
  const options = { /* ... */ }; // (Same as above)
  
  // strip() itself is synchronous once imported
  const result = strip(sourceCode, options); 
  
  // ... (logging issues and results, same as above) ...
}

main().catch(console.error);
```


## API

### `strip(codeString, [userOptions])`

Processes the input `codeString` and returns an object containing the `strippedCode` and an array of `issues`. This function is **synchronous**.

* `codeString` (String): The source code string to process.
* `userOptions` (Object, optional): Configuration options for the stripping process.
    * `blocks` (Array<Object>, optional): An array of block definition objects. Each object should have:
        * `start_block` (String): The text of the opening comment/delimiter.
        * `end_block` (String): The text of the closing comment/delimiter.
        * Default: `[{ start_block: "/* test-code *\/", end_block: "/* end-test-code */" }]`
    * `patterns` (RegExp | Array<RegExp>, optional): A single regular expression or an array of regular expressions. Code matching these patterns will be removed.
        * Default: `[]`
    * `parityCheck` (Boolean, optional): If `true`, performs a check to ensure that for each block type, there's an equal number of start and end delimiters. Errors are reported in the `issues` array.
        * Default: `true`
    * `intersectionCheck` (Boolean, optional): If `true`, performs a check for improperly nested or intersecting blocks. Errors are reported in the `issues` array.
        * Default: `true`
    * `legacy` (Object, optional): An object for backward compatibility with options from `grunt-strip-code` v0.1.x.
        * `start_comment` (String): Legacy start comment text (e.g., `test-code`). Becomes `/* test-code */`.
        * `end_comment` (String): Legacy end comment text. Becomes `/* end-test-code */`.
        * `pattern` (RegExp): A legacy regex pattern. If provided, this pattern is added to the modern `patterns` array.

**Return Value:**

An object with the following properties:

* `strippedCode` (String): The processed code string. If `parityCheck` or `intersectionCheck` are enabled and fatal errors are detected, this might be the original `codeString` (stripping is skipped to prevent data corruption).
* `issues` (Array<Object>): An array of issue objects found during processing. Each issue object typically has:
    * `type` (String): The type of issue, e.g., `'error'` or `'warning'`.
    * `id` (String): A machine-readable identifier for the issue (e.g., `'parity_unclosed_start'`, `'intersection_mismatch'`).
    * `message` (String): A human-readable description of the issue.
    * `line` (Number, optional): The line number in the original `codeString` where the issue was detected.
    * `blockName` (String, optional): The name/description of the block involved in the issue.

**Behavior with Validation Errors:**

If `parityCheck` or `intersectionCheck` is enabled (which they are by default) and an `'error'` type issue is detected, the stripping process for block comments will be skipped to avoid potentially corrupting the code. Pattern-based stripping might still occur if it happens before block stripping in the internal logic, or if it's independent of block validation. The `issues` array will contain details of all problems found. It's recommended to check `result.issues` before using `result.strippedCode` in critical workflows if validation is enabled.

If both `parityCheck` and `intersectionCheck` are set to `false`, stripping will be attempted regardless of block validity, which could lead to unexpected results if the source code has malformed blocks.

## Use Cases

* Removing `console.log`, `console.warn`, etc., statements from production code.
* Stripping out debug-only sections of HTML or JavaScript.
* Removing test-specific code or hooks (e.g., exposing internal functions for unit tests) that should not be in the final build.
* Conditional compilation based on comment blocks for different environments.

## Contributing

Contributions are welcome! Please feel free to open an issue to discuss a bug or feature, or submit a pull request.

When contributing, please try to:

1. Maintain the existing coding style.

2. Add unit tests for any new or changed functionality.

3. Ensure all tests pass (`npm test`).

4. Update documentation if necessary.

## Release History

#### 1.0.0

* Initial release of `node-strip-code` as a standalone module.

## License

MIT © Rene Cabral
