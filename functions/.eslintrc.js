module.exports = {

    // Recommended features
    "extends": [ "eslint:recommended", "plugin:react/recommended" ],

    //Parser features
    parser: "@babel/eslint-parser",
    parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 12,
        sourceType: "module",
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
        }
    },

    // Specific rules, 2: err, 1: warn, 0: off
    rules: {
        "prefer-arrow-callback": 1,
        "no-mixed-spaces-and-tabs": 1,
        "react/react-in-jsx-scope": 0, // CRA globally imports it
        "no-unused-vars": [ 1, { vars: 'all', args: 'none' } ], // All variables, no function arguments

        // React specific
        "react/prop-types": 0,
        "react/display-name": 0
    },

    // What environment to run in
    env:{
        node: true,
        browser: false,
        mocha: false,
        jest: false,
        es6: true
    },

    // What global variables should be assumed to exist
    globals: {

    }

}