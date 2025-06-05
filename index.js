/*
 * node-strip-code
 * https://github.com/nuzzio/node-strip-code
 *
 * Copyright (c) 2025 Rene Cabral
 * Licensed under the MIT license.
 */

// node-strip-code/index.js
// 'use strict'; // Not necessary in ES Modules

import escapeStringRegexp from 'escape-string-regexp';

/**
 * Strips code from a string based on specified block comments or regex patterns.
 *
 * @param {string} codeString The source code string to process.
 * @param {object} [userOptions={}] Configuration options for stripping.
 * @param {Array<object>} [userOptions.blocks] Array of block definitions.
 * Each block object should have `start_block` and `end_block` string properties.
 * Defaults to `[{ start_block: "/* test-code *\/", end_block: "/* end-test-code *\/"" }]`.
 * @param {Array<RegExp>|RegExp} [userOptions.patterns] Regex or array of regexes to match and remove.
 * @param {boolean} [userOptions.parityCheck=true] If true, checks for an equal number of start and end blocks.
 * @param {boolean} [userOptions.intersectionCheck=true] If true, checks for intersecting/improperly nested blocks.
 * @param {object} [userOptions.legacy] Legacy options for backward compatibility.
 * @param {string} [userOptions.legacy.start_comment] Legacy start comment text (without /* and *\/).
 * @param {string} [userOptions.legacy.end_comment] Legacy end comment text.
 * @param {RegExp} [userOptions.legacy.pattern] Legacy regex pattern.
 * @returns {{strippedCode: string, issues: Array<object>}} An object
 * containing the stripped code and an array of any issues found.
 */
function strip(codeString, userOptions = {}) {
  // escapeStringRegexp is now available from the static import

  const issues = [];
  let strippedCode = codeString;

  // --- Options Processing ---
  const defaultOptions = {
    blocks: [{
      start_block: "/* test-code */",
      end_block: "/* end-test-code */"
    }],
    patterns: [],
    parityCheck: true,
    intersectionCheck: true,
    legacy: {
      start_comment: false,
      end_comment: false,
      pattern: false
    }
  };

  const options = {
    ...defaultOptions,
    ...userOptions,
    legacy: {
      ...defaultOptions.legacy,
      ...(userOptions.legacy || {})
    }
  };

  if (options.legacy) {
    if (options.legacy.pattern instanceof RegExp) {
      if (!Array.isArray(options.patterns)) {
        options.patterns = [];
      }
      if (!options.patterns.some(p => p.toString() === options.legacy.pattern.toString())) {
        options.patterns.push(options.legacy.pattern);
      }
    } else if (options.legacy.start_comment && options.legacy.end_comment) {
      if (!Array.isArray(options.blocks)) {
        options.blocks = [];
      }
      const legacyBlock = {
        start_block: `/* ${options.legacy.start_comment} */`,
        end_block: `/* ${options.legacy.end_comment} */`
      };
      if (!options.blocks.some(b => b.start_block === legacyBlock.start_block && b.end_block === legacyBlock.end_block)) {
        options.blocks.push(legacyBlock);
      }
    }
  }

  let processedBlocks = [];
  if (Array.isArray(options.blocks)) {
    processedBlocks = options.blocks.filter(block =>
      typeof block === 'object' && block !== null &&
      typeof block.start_block === 'string' &&
      block.start_block &&
      typeof block.end_block === 'string' &&
      block.end_block &&
      block.start_block !== block.end_block
    );
  } else if (options.blocks && typeof options.blocks === 'object' && options.blocks.start_block && options.blocks.end_block) {
    if (typeof options.blocks.start_block === 'string' &&
      options.blocks.start_block &&
      typeof options.blocks.end_block === 'string' &&
      options.blocks.end_block &&
      options.blocks.start_block !== options.blocks.end_block) {
      processedBlocks = [options.blocks];
    }
  }

  let processedPatterns = [];
  if (Array.isArray(options.patterns)) {
    processedPatterns = options.patterns.filter(pattern => pattern instanceof RegExp);
  } else if (options.patterns instanceof RegExp) {
    processedPatterns = [options.patterns];
  }

  if (processedBlocks.length === 0 && processedPatterns.length === 0) {
    return { strippedCode, issues };
  }

  const EOL = '(?:\\r\\n|\\r|\\n)';
  const EOL_OPTIONAL_CAPTURE = `(${EOL})?`;

  const blockDefinitions = processedBlocks.map((blockDef, index) => {
    const startEscaped = escapeStringRegexp(blockDef.start_block);
    const endEscaped = escapeStringRegexp(blockDef.end_block);
    return {
      index: index,
      name: `Block (start: "${blockDef.start_block}", end: "${blockDef.end_block}")`,
      strippingRegex: new RegExp(
        `[\\t ]*${startEscaped}[\\s\\S]*?${endEscaped}[\\t ]*${EOL_OPTIONAL_CAPTURE}`,
        'g'
      ),
      startRegex: new RegExp(escapeStringRegexp(blockDef.start_block)),
      endRegex: new RegExp(escapeStringRegexp(blockDef.end_block)),
      start_block_text: blockDef.start_block,
      end_block_text: blockDef.end_block,
    };
  });

  if ((options.parityCheck || options.intersectionCheck) && blockDefinitions.length > 0) {
    const lines = codeString.split(/\r\n|\r|\n/);
    const blockStats = blockDefinitions.map(() => ({
      startCount: 0,
      endCount: 0,
      lastStartLine: -1,
    }));
    const blocksStack = [];

    lines.forEach((line, lineNum) => {
      if (line.trim() === '') return;

      blockDefinitions.forEach(blockDef => {
        const stat = blockStats[blockDef.index];
        const isStart = blockDef.startRegex.test(line);
        const isEnd = blockDef.endRegex.test(line);

        if (isStart) {
          if (options.parityCheck && stat.startCount > stat.endCount) {
            issues.push({
              type: 'error',
              id: 'parity_extra_start',
              message: `Parity Check: Extra start block "${blockDef.start_block_text}" found at line ${lineNum + 1}. Previous start for this block type was at line ${stat.lastStartLine + 1} and not closed.`,
              line: lineNum + 1,
              blockName: blockDef.name
            });
          }
          stat.startCount++;
          stat.lastStartLine = lineNum;
          if (options.intersectionCheck) {
            blocksStack.push({ blockDef, lineNum });
          }
        }

        if (isEnd) {
          if (options.parityCheck && stat.endCount >= stat.startCount) {
            issues.push({
              type: 'error',
              id: 'parity_extra_end',
              message: `Parity Check: Extra end block "${blockDef.end_block_text}" found at line ${lineNum + 1} with no matching start block.`,
              line: lineNum + 1,
              blockName: blockDef.name
            });
          }
          stat.endCount++;
          if (options.intersectionCheck) {
            if (blocksStack.length > 0) {
              const lastOpened = blocksStack[blocksStack.length - 1];
              if (lastOpened.blockDef.index === blockDef.index) {
                blocksStack.pop();
              } else {
                issues.push({
                  type: 'error',
                  id: 'intersection_mismatch',
                  message: `Intersection Check: End block "${blockDef.end_block_text}" at line ${lineNum + 1} does not match currently open block "${lastOpened.blockDef.start_block_text}" (started at line ${lastOpened.lineNum + 1}).`,
                  line: lineNum + 1,
                  openBlock: lastOpened.blockDef.name,
                  openLine: lastOpened.lineNum + 1,
                  closingBlock: blockDef.name
                });
                let recovered = false;
                for (let i = blocksStack.length - 1; i >= 0; i--) {
                  if (blocksStack[i].blockDef.index === blockDef.index) {
                    blocksStack.splice(i, blocksStack.length - i);
                    recovered = true;
                    break;
                  }
                }
              }
            } else {
              issues.push({
                type: 'error',
                id: 'intersection_unmatched_end',
                message: `Intersection Check: End block "${blockDef.end_block_text}" at line ${lineNum + 1} found with no corresponding open block in the stack.`,
                line: lineNum + 1,
                blockName: blockDef.name
              });
            }
          }
        }
      });
    });

    if (options.parityCheck) {
      blockStats.forEach((stat, index) => {
        const blockDef = blockDefinitions[index];
        if (stat.startCount > stat.endCount) {
          issues.push({
            type: 'error',
            id: 'parity_unclosed_start',
            message: `Parity Check: Block "${blockDef.start_block_text}" (last seen at line ${stat.lastStartLine + 1}) was not closed. Found ${stat.startCount} start(s) and ${stat.endCount} end(s).`,
            line: stat.lastStartLine + 1,
            blockName: blockDef.name
          });
        }
      });
    }
    if (options.intersectionCheck && blocksStack.length > 0) {
      blocksStack.forEach(unclosed => {
        issues.push({
          type: 'error',
          id: 'intersection_unclosed',
          message: `Intersection Check: Block "${unclosed.blockDef.start_block_text}" started at line ${unclosed.lineNum + 1} was never closed.`,
          line: unclosed.lineNum + 1,
          blockName: unclosed.blockDef.name
        });
      });
    }
  }

  const hasFatalErrors = issues.some(issue => issue.type === 'error');

  if ( (!options.parityCheck && !options.intersectionCheck) || !hasFatalErrors ) {
    blockDefinitions.forEach(blockDef => {
      strippedCode = strippedCode.replace(blockDef.strippingRegex, '');
    });

    processedPatterns.forEach(pattern => {
      strippedCode = strippedCode.replace(pattern, '');
    });
  }

  return { strippedCode, issues };
}

export default strip; // Changed to ES Module export
