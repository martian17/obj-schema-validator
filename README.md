# Object Schema Validator
XXX.js is an error rich schema validation library intended for use in debugging and reverse engineering. It supports a similar syntax supported by Mongoose and Ajv JSON schema validator, and custom options for types listed below. The difference is that for each error, you get an object describing the object path and the context alongside with the error message. This library also supports custom user defined callbacks to validate objects and class instances flexibly.

## Example
```js
const validator = new Validator({
    type:"object",
    required:{
        "id":{type:"number"},
        "name":{type:"string",match:/^[a-zA-Z]+\ [a-zA-Z]+$/}
    },
    optional:{
        "age":{type:"number", custom:n => n>10},
        "buffer":{type:Uint8Array, custom:buff => buff.length<1000},
        "houses":{
            type:"array",
            repeat:true,
            pattern:[
                {type:"string"},
                [{type:"number"},{type:"bigint"}],
                "+"
            ]
        }
    },
    others:{type:"string"}
});

console.log(validator.validate({
    id: 53,
    name: "Barack Obama",
    age: 61,
    houses: ["New York",5,3,1,2,"Los Angeles",2,14513451234123n,6,3],
    buffer: new Uint8Array(500)
}));
// Result:
// true


console.log(validator.validate({
    id: 54,
    name: "Noah Jenkins",
    age: 6
}));
// Result:
// ValidatorError {
//   msg: 'Custom validation failed',
//   path: '.age',
//   target: 6,
//   context: 'n => n>10'
// }


console.log(validator.validate({
    id: 55,
    name: "Alan Bartlett Shepard Jr."
}));
// Result:
// ValidatorError {
//   msg: 'String does not match the pattern',
//   path: '.name',
//   target: 'Alan Bartlett Shepard Jr.',
//   context: /^[a-zA-Z]+\ [a-zA-Z]+$/
// }


console.log(validator.validate({
    id: 56,
    name: "Ken Wins",
    houses: ["Albuquerque",3,2,1,true]
}));
// Result:
// ValidatorError {
//   msg: 'Expected a string, but got a boolean instead',
//   path: '.houses[4]',
//   target: true,
//   context: 'string'
// }
```

## Basic syntax
```js
const validator = new Validator({
    type:<type name in string>,
    ... //other options depending on the types
});
```

# Documentation
Documentation is in WIP, and may not match the implementation

## Validator
`Validator` is a constructor for the `Validator` class. The argument is `options | Array<options>`

## options
Options contain the option
### options.type == "object"
The validator will check if the input is of type [Object](Object) regardless of options
#### options.inclusive: [Boolean](Boolean)
Default: `false`  
If set to true, the validator will accept objects with properties that don't appear in `options.props_mandatory` and `options.props_optional`, and check it against rules defined in `options.props_any`
#### options.props\_mandatory: [PropertyMap](#PropertyMap)
Default: `{}`
Look at [PropertyMap](#PropertyMap) for the interface definition.
The validator will reject the input object if any of the properties defined in this field are absent. It will then check the object against the rules defined inside this map.
#### options.props\_optional: [PropertyMap](#PropertyMap)
Default: `{}`
Look at [PropertyMap](#PropertyMap) for the interface definition.  
The validator will check the input object against the rules defined inside this map. If the property in question is absent, the object will be accepted by default.
#### options.props\_any: [Rule](#Rule)
Default: `[]`
The validator will check the input object property against this rule if the property does not appear in either `options.props_mandatory` or `options.props_optional`.
If this option is available, `options.inclusive` will automatically be set to `true`
If left empty the validator will accept all properties that checks against this rule.
#### options.mandatory
Alias for `options.props_mandatory`
#### options.optional
Alias for `options.props_optional`
#### options.props
Alias for `options.props_optional`
#### options.any
Alias for `options.props_any`


### options.type == "array"
The validator will check if the input is of type [Array](Array) regardless of options
#### options.maxLength: [Number](Number)
Default: `Infinity`
The input array may not exceed this length
#### options.minLength: [Number](Number)
Default: `-Infinity`
The input array may not be shorter than this length
#### options.pattern: [Array](Array)\<[Rule](#Rule) \| "?" \| "+" \| "\*"\>
Default: `[]`
Array of [Rule](#Rule)s. The validator will try to match the input array from the pattern head, and repeat the matches using string suffixes if present with the same rule as regex
#### options.repeat: [Boolean](Boolean)
Default: `false`
If the pattern is exhausted, the rest of the input array will be matched using repeating the pattern
#### options.align\_end: [Boolean](Boolean)
Default: `true`
The validator will reject if the pattern end does not match the input array end.
### options.all: [Rule](#Rule)
Default: N/A
This will override all the other options. The validator will accept if all of the input array elements match this rule.

### options.type == "string"
The validator will check if the input is of type [String](String) regardless of options
#### options.match: [String](String) | [RegExp](RegExp)
Default: `/.*/`
The validator will reject inputs that don't match this option using `String.prototype.match()`.

### options.type == "instanceof"
#### options.class: [Function](Function)
Default: mandatory
The validator will reject if the input object is not an instance of the class specified in this field.  

### options.type == "typeof"
#### options.typename: [String](String)
Default: mandatory
The validator will reject if the input does not match the type specified in this field.

### options.type == "custom"
#### options.validator: [Function](Function)
Default: mandatory
The validator will call the function specified in this field, with the object in question as the argument. The function should either return `true` to accept the object, or throw an error to reject the object. 

## Types and interfaces
### PropertyMap: [Object](Object)
An object that contains key value pair that corresponds to the input.  
The values should either be an instance of `Validator` or a valid argument of `Validator` constructor.
definition
```ts
interface PropertyMap {
    [key: string]: Rule 
}
```
### Rule: [Validator](#) | [ValidatorConstructorArgument](ValidatorConstructorArgument)
### ValidatorConstructorArgument: [options](#options) | [Array](Array)<[options](#options)>
A valid option argument for the `Validator` constructor.


## Objects
### validator\_accept\_any: [Validator](#)
An instance of `Validator` that accepts any value


[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[Number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[Function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[Boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp


