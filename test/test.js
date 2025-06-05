// node-strip-code/test/test.js
// 'use strict'; // Not needed in ESM

import test from 'tape';
import strip from '../index.js'; // ES Module import
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // For __dirname equivalent in ESM

// ESM equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function writeFixture(filename, content) {
  const filePath = path.join(__dirname, 'fixtures', filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeExpected(filename, content) {
  const filePath = path.join(__dirname, 'expected', filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function readFixture(filename) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf8');
}

function readExpected(filename) {
  return fs.readFileSync(path.join(__dirname, 'expected', filename), 'utf8');
}

// ---- Setup Fixtures and Expected files ----
// For Test 1 (Default options)
writeFixture('sample-default.js',
  `(function() {

  var foo;

  /* test-code */
  function bar() { console.log('removed bar'); }
  bar();
  /* end-test-code */

  return {
    fizz: "buzz"
    /* test-code */ , bar: "bar" /* end-test-code */
  };
}());

// Keep this line`
);
writeExpected('sample-default.js',
  `(function() {

  var foo;


  return {
    fizz: "buzz"
  };
}());

// Keep this line`
);

// For Test 6 (Legacy options: start_comment and end_comment)
writeFixture('sample-legacy.js',
  `function mainLogic() {
  return "active";
}

/* legacy-code */
function forTestingOnly() {
  return "test data";
}
/* end-legacy-code */

var result = mainLogic();`
);
writeExpected('sample-legacy.js',
  `function mainLogic() {
  return "active";
}


var result = mainLogic();`
);


// For Test 5 (Intersection check)
writeFixture('sample-intersection-multiline.js',
  `/* block-a */
/* block-b */
content
/* end-block-a */
/* end-block-b */`
);
writeExpected('sample-intersection-multiline.js', readFixture('sample-intersection-multiline.js'));


// For Test 11 (legacy-precedence-pattern-over-blocks)
writeFixture('sample-legacy-precedence.js',
  `console.log("Keep this");
/* legacy-start */
console.log("This would be removed by legacy block comments");
/* legacy-end */
legacyPatternCall(); // This should be removed by legacy pattern
console.log("Keep this too");`
);
writeExpected('sample-legacy-precedence.js',
  `console.log("Keep this");
/* legacy-start */
console.log("This would be removed by legacy block comments");
/* legacy-end */
console.log("Keep this too");`
);

// For multiple-block-types
writeFixture('sample-multiple-blocks.js',
  `// Type A Start
var a_debug = true;
// Type A End
console.log("Useful stuff");
/* Type B Start */
var b_debug = "yes";
/* Type B End */
// Type C Start - No End (should be caught by parity if on)
var c_debug_unclosed;`
);
writeExpected('sample-multiple-blocks.js',
  `console.log("Useful stuff");
// Type C Start - No End (should be caught by parity if on)
var c_debug_unclosed;`
);

// For Test 14 (special-chars-in-delimiters)
writeFixture('sample-special-chars.js',
  `keepOpening();
/*$START$*/
removeSpecial();
/*$END$*/
keepClosing();`
);
writeExpected('sample-special-chars.js',
  `keepOpening();
keepClosing();`
);

// For Test 15 (checks-disabled-with-errors)
writeFixture('sample-checks-disabled.js',
  `/* start-A */
content A1
/* start-B */
content B
/* end-A */
// Intersection error line (now separate)
content A2
/* end-B */
/* unclosed-C */
content C`
);
writeExpected('sample-checks-disabled.js',
  `// Intersection error line (now separate)
content A2
/* end-B */
/* unclosed-C */
content C`
);


// For complex-intersection (Test 12)
writeFixture('sample-complex-intersection.js',
  `function outer() {
    /* outer-start */
    console.log("Outer pre-inner");
    /* inner-start */
    console.log("Inner content");
    /* outer-end */ // Error: inner was not closed
    console.log("Outer post-inner, but inner unclosed");
    /* inner-end */
}`);
writeExpected('sample-complex-intersection.js', readFixture('sample-complex-intersection.js'));


// For complex-parity-extra-start (Test 16)
writeFixture('sample-complex-parity.js',
  `/* block-1 */
  /* block-1 */ // Extra start
  console.log("Content 1");
/* end-block-1 */
/* end-block-1 */ // Extra end
`
);
writeExpected('sample-complex-parity.js', readFixture('sample-complex-parity.js'));


// For block-at-start-of-file (Test 17)
writeFixture('sample-block-at-start.js',
  `/* remove-me */
content to remove at start
/* end-remove-me */
Actual content to keep.`
);
writeExpected('sample-block-at-start.js',
  `Actual content to keep.`
);

// For block-at-end-of-file (Test 18)
writeFixture('sample-block-at-end.js',
  `Actual content to keep.
/* remove-me-at-end */
content to remove at end
/* end-remove-me-at-end */`
);
writeExpected('sample-block-at-end.js',
  `Actual content to keep.`
);

// For empty-block (Test 19)
writeFixture('sample-empty-block.js',
  `before();
/* empty */ /* end-empty */
after();`
);
writeExpected('sample-empty-block.js',
  `before();
after();`
);

// For Test 3 (Pattern options)
writeFixture('sample-patterns.js',
  `function keepMe() {
  // This is a kept function
}
console.log("Remove this log");
var x = 10;
console.log ( "And this one with spaces" ) ;
// Keep this comment
function alsoKeepMe() {
  console.log("But not this log inside a function");
}
`
);
writeExpected('sample-patterns.js',
  `function keepMe() {
  // This is a kept function
}var x = 10;// Keep this comment
function alsoKeepMe() {}`
);

// For Test 7 (Legacy options: pattern)
writeFixture('sample-legacy-pattern.js',
  `function usefulFunction() {
  // important stuff
}
legacyRemoveThis();
anotherUsefulFunction();`
);
writeExpected('sample-legacy-pattern.js',
  `function usefulFunction() {
  // important stuff
}
anotherUsefulFunction();`
);

// For Test 2 (Custom blocks)
writeFixture('sample-custom-blocks.html',
  `<!DOCTYPE html>
<html lang="">
<head>
    <title>Test</title>
    <script>
        function keepThis() {
            console.log('kept');
        }
        /* BEGIN JS DEBUG */
        function removeThisJs() {
            console.log('removed js');
        }
        removeThisJs();
        /* END JS DEBUG */
    </script>
</head>
<body>
    <h1>Hello</h1>
    <!--#BEGIN DEBUG#-->
    <p>This is a debug paragraph.</p>
    <!--#END DEBUG#-->
    <p>Regular content.</p>
</body>
</html>`
);
writeExpected('sample-custom-blocks.html',
  `<!DOCTYPE html>
<html lang="">
<head>
    <title>Test</title>
    <script>
        function keepThis() {
            console.log('kept');
        }
    </script>
</head>
<body>
    <h1>Hello</h1>
    <p>Regular content.</p>
</body>
</html>`
);
// ---- End of Fixture Setup ----

// Test 1
test('Default options: strips /* test-code */ blocks', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-default.js');
  const expected = readExpected('sample-default.js');
  const result = strip(source); // No await

  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip default blocks');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 2
test('Custom blocks: strips specified HTML and JS comments', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-custom-blocks.html');
  const expected = readExpected('sample-custom-blocks.html');
  const options = {
    blocks: [
      { start_block: '<!--#BEGIN DEBUG#-->', end_block: '<!--#END DEBUG#-->' },
      { start_block: '/* BEGIN JS DEBUG */', end_block: '/* END JS DEBUG */' }
    ]
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip custom HTML and JS blocks');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 3
test('Pattern options: strips console.log statements', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-patterns.js');
  const expected = readExpected('sample-patterns.js');
  const options = {
    patterns: /\s*console\.log\s*\([\s\S]*?\)\s*;?\s*(\r?\n)?/g,
    blocks: []
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip console.log using pattern');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 4
test('Parity check: detects unclosed block', (t) => { // No async
  t.plan(3);
  const source = "/* test-code */ unclosed content";
  const result = strip(source, { parityCheck: true, intersectionCheck: false }); // No await

  t.equal(result.strippedCode, source, 'should not strip code if parity error and checks enabled');
  t.equal(result.issues.length, 1, 'should report one issue');
  if (result.issues.length > 0) {
    t.equal(result.issues[0].id, 'parity_unclosed_start', 'issue should be parity_unclosed_start');
  } else {
    t.fail('Expected parity_unclosed_start issue, but none found.');
  }
});

// Test 5
test('Intersection check: detects improperly nested blocks (multi-line)', (t) => { // No async
  t.plan(3);
  const source = readFixture('sample-intersection-multiline.js');
  const expected = readExpected('sample-intersection-multiline.js');
  const options = {
    blocks: [
      { start_block: "/* block-a */", end_block: "/* end-block-a */" },
      { start_block: "/* block-b */", end_block: "/* end-block-b */" }
    ],
    parityCheck: false,
    intersectionCheck: true
  };
  const result = strip(source, options); // No await

  t.equal(result.strippedCode.trim(), expected.trim(), 'should not strip code if intersection error and checks enabled');
  t.ok(result.issues && Array.isArray(result.issues) && result.issues.length > 0, 'should report issues and issues should be an array');
  if (result.issues && result.issues.length > 0) {
    const intersectionIssue = result.issues.find(issue => issue && issue.id === 'intersection_mismatch');
    t.ok(intersectionIssue, 'should specifically report an intersection_mismatch error. Found: ' + JSON.stringify(intersectionIssue));
  } else {
    t.fail('Expected issues to be reported for third assertion, but issues array was empty or undefined.');
  }
});

// Test 6
test('Legacy options: start_comment and end_comment', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-legacy.js');
  const expected = readExpected('sample-legacy.js');
  const options = {
    legacy: {
      start_comment: 'legacy-code',
      end_comment: 'end-legacy-code'
    },
    blocks: []
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip using legacy start/end_comment');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 7
test('Legacy options: pattern', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-legacy-pattern.js');
  const expected = readExpected('sample-legacy-pattern.js');
  const options = {
    legacy: {
      pattern: /legacyRemoveThis\(\);(\r?\n)?/g
    },
    blocks: []
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip using legacy pattern');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 8
test('No matching blocks or patterns: should return original code', (t) => { // No async
  t.plan(2);
  const source = 'const a = 10;\nfunction hello() { return "world"; }';
  const options = {
    blocks: [{ start_block: "/* no-match */", end_block: "/* end-no-match */" }],
    patterns: [/nonExistentPattern/g]
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode, source, 'code should be unchanged');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 9
test('Empty input string', (t) => { // No async
  t.plan(2);
  const source = '';
  const result = strip(source); // No await
  t.equal(result.strippedCode, '', 'stripped code should be empty');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 10
test('Input string with only comments to be stripped', (t) => { // No async
  t.plan(2);
  const source = '/* test-code */\nconsole.log("remove");\n/* end-test-code */';
  const expected = '';
  const result = strip(source); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'code should be empty or whitespace after stripping');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 11
test('Legacy Precedence: pattern over start/end comments', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-legacy-precedence.js');
  const expected = readExpected('sample-legacy-precedence.js');
  const options = {
    legacy: {
      start_comment: 'legacy-start',
      end_comment: 'legacy-end',
      pattern: /legacyPatternCall\(\);[^\r\n]*(\r?\n)?/g
    },
    blocks: []
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'legacy pattern should take precedence');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 12
test('Intersection: A starts, B starts, A ends (error), B ends (complex fixture)', (t) => { // No async
  t.plan(3);
  const source = readFixture('sample-complex-intersection.js');
  const expected = readExpected('sample-complex-intersection.js');
  const options = {
    blocks: [
      { start_block: "/* outer-start */", end_block: "/* outer-end */" },
      { start_block: "/* inner-start */", end_block: "/* inner-end */" }
    ],
    parityCheck: true,
    intersectionCheck: true
  };
  const result = strip(source, options); // No await

  t.equal(result.strippedCode.trim(), expected.trim(), 'should not strip code due to intersection error');
  t.ok(result.issues && Array.isArray(result.issues) && result.issues.length > 0, 'should report issues and issues should be an array');
  if (result.issues && result.issues.length > 0) {
    const intersectionIssue = result.issues.find(issue => issue && issue.id === 'intersection_mismatch');
    t.ok(intersectionIssue, 'should specifically report an intersection_mismatch error. Actual issues: ' + JSON.stringify(result.issues.map(i => i.id)));
  } else {
    t.fail('Expected issues to be reported for third assertion, but issues array was empty or undefined after 2nd assertion passed.');
  }
});

// Test 13
test('Multiple distinct block types in one file', (t) => { // No async
  t.plan(3);
  const source = readFixture('sample-multiple-blocks.js');
  const expected = source;
  const options = {
    blocks: [
      { start_block: "// Type A Start", end_block: "// Type A End" },
      { start_block: "/* Type B Start */", end_block: "/* Type B End */" },
      { start_block: "// Type C Start", end_block: "// Type C End" }
    ],
    parityCheck: true,
    intersectionCheck: true
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should not strip due to Type C parity error');

  t.ok(result.issues && result.issues.length > 0, 'should report at least one issue');
  if (result.issues && result.issues.length > 0) {
    const parityIssue = result.issues.find(issue => issue && issue.id === 'parity_unclosed_start' && issue.blockName && issue.blockName.includes("Type C Start"));
    t.ok(parityIssue, 'issue should be for unclosed Type C. Actual issues: ' + JSON.stringify(result.issues.map(i => i.id)));
  } else {
    t.fail('Expected parity issue for Type C, but no issues found or issues array malformed.');
  }
});

// Test 14
test('Blocks with special regex characters in delimiters', (t) => { // No async
  t.plan(2);
  const originalFixture = 'sample-special-chars.js';
  const tempFixtureContent = `keepOpening();\n/*$START$*/\nremoveSpecial();\n/*$END$*/\nkeepClosing();`;
  const tempExpectedContent = `keepOpening();\nkeepClosing();`;

  writeFixture(originalFixture, tempFixtureContent);
  writeExpected(originalFixture, tempExpectedContent);

  const source = readFixture(originalFixture);
  const expected = readExpected(originalFixture);

  const options = {
    blocks: [
      { start_block: "/*$START$*/", end_block: "/*$END$*/" }
    ]
  };
  const result = strip(source, options); // No await

  t.equal(result.strippedCode.trim(), expected.trim(), 'should handle special characters in delimiters');
  t.deepEqual(result.issues, [], 'should have no issues with valid special char blocks');
});

// Test 15
test('Checks disabled (parityCheck: false, intersectionCheck: false) with problematic code', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-checks-disabled.js');
  const expected = readExpected('sample-checks-disabled.js');
  const options = {
    blocks: [
      { start_block: "/* start-A */", end_block: "/* end-A */" },
      { start_block: "/* start-B */", end_block: "/* end-B */" },
      { start_block: "/* unclosed-C */", end_block: "/* end-unclosed-C */" }
    ],
    parityCheck: false,
    intersectionCheck: false
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip code even with underlying errors when checks are off');
  t.deepEqual(result.issues, [], 'should report no issues from the strip function itself when checks are off');
});

// Test 16
test('More complex parity: A starts, A starts (extra), A ends, A ends (extra)', (t) => { // No async
  t.plan(3);
  const source = readFixture('sample-complex-parity.js');
  const expected = readExpected('sample-complex-parity.js');
  const options = {
    blocks: [ { start_block: "/* block-1 */", end_block: "/* end-block-1 */" } ],
    parityCheck: true,
    intersectionCheck: false
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should not strip code due to parity errors');

  t.ok(result.issues && result.issues.length >= 1, 'should report at least one parity issue. Count: ' + (result.issues ? result.issues.length : 'N/A'));

  if (result.issues && result.issues.length > 0) {
    const extraStartIssue = result.issues.find(issue => issue && issue.id === 'parity_extra_start');
    const extraEndIssue = result.issues.find(issue => issue && issue.id === 'parity_extra_end');
    t.ok(extraStartIssue || extraEndIssue, 'should report an extra_start or extra_end parity error. Issues: ' + JSON.stringify(result.issues.map(i => i.id)));
  } else {
    t.fail('Expected parity issues but none were found or issues array is malformed.');
  }
});

// Test 17
test('Block at start of file', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-block-at-start.js');
  const expected = readExpected('sample-block-at-start.js');
  const options = {
    blocks: [ { start_block: "/* remove-me */", end_block: "/* end-remove-me */" } ]
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should correctly strip block at start of file');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 18
test('Block at end of file', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-block-at-end.js');
  const expected = readExpected('sample-block-at-end.js');
  const options = {
    blocks: [ { start_block: "/* remove-me-at-end */", end_block: "/* end-remove-me-at-end */" } ]
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should correctly strip block at end of file');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 19
test('Empty block (no content between delimiters)', (t) => { // No async
  t.plan(2);
  const source = readFixture('sample-empty-block.js');
  const expected = readExpected('sample-empty-block.js');
  const options = {
    blocks: [ { start_block: "/* empty */", end_block: "/* end-empty */" } ]
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should correctly strip empty block');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 20
test('Block delimiters with leading/trailing spaces in source', (t) => { // No async
  t.plan(2);
  const source = `
        console.log("before");
          /* test-code */   
        console.log("remove this");
        /* end-test-code */   
        console.log("after");
    `;
  const expected = `
        console.log("before");
        console.log("after");
    `;
  const result = strip(source); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should strip blocks with extra spaces around delimiters');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 21
test('No stripping if only patterns are defined but none match', (t) => { // No async
  t.plan(2);
  const source = 'const x = 1;\nconst y = 2;';
  const options = {
    blocks: [],
    patterns: [/nonExistentPattern/g]
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode, source, 'code should be unchanged');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 22
test('Option: blocks as a single object instead of array', (t) => { // No async
  t.plan(2);
  const source = 'abc\n/* single-obj */\ndef\n/* end-single-obj */\nghi';
  const expected = 'abc\nghi';
  const options = {
    blocks: { start_block: '/* single-obj */', end_block: '/* end-single-obj */' }
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should handle options.blocks as a single object');
  t.deepEqual(result.issues, [], 'should have no issues');
});

// Test 23
test('Option: patterns as a single RegExp instead of array', (t) => { // No async
  t.plan(2);
  const source = 'line1\nremoveThisLine();\nline3';
  const expected = 'line1\nline3';
  const options = {
    patterns: /removeThisLine\(\);(\r?\n)?/g,
    blocks: []
  };
  const result = strip(source, options); // No await
  t.equal(result.strippedCode.trim(), expected.trim(), 'should handle options.patterns as a single RegExp');
  t.deepEqual(result.issues, [], 'should have no issues');
});
