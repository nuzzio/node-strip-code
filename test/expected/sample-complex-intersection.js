function outer() {
    /* outer-start */
    console.log("Outer pre-inner");
    /* inner-start */
    console.log("Inner content");
    /* outer-end */ // Error: inner was not closed
    console.log("Outer post-inner, but inner unclosed");
    /* inner-end */
}