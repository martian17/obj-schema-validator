import {Validator} from "./index.mjs";

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


