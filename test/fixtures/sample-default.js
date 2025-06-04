(function() {

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

// Keep this line