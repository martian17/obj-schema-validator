const loopObject = function*(obj){
    for(let key in obj){
        yield [key,obj[key]];
    }
};


class Object_Validator{
    constructor(options){
        this.inclusive = options.inclusive || !!(options.props_any || options.any);
        const mp = options.props_mandatory || options.mandatory || {};
        const op = options.props_optional || options.optional || options.props || {};
        const ap = options.props_any || options.any || [];
        for(let key in mp){
            this.props_mandatory[key] = new Validator(mp[key]);
        }
        for(let key in op){
            this.props_optional[key] = new Validator(op[key]);
        }
        this.props_any = new Validator(op[key]);
    }
    props_mandatory = {};//value validator
    props_optional = {};
    props_any;//validator
    validate(obj){
        if(typeof obj !== "object"){
            console.log(obj);
            throw new Error(`Value of type "object"`);
        }
        const {props_mandatory:mp,props_optional:op,props_any:ap} = this;
        for(let key in mp){
            if(!(key in obj)){
                console.log(obj);
                throw Error(`Mandatory property ${key} absent`);
            }
            mp[key].validate(obj[key]);
        }
        for(let key in obj){
            if(key in mp)continue;
            if(key in op){
                op[key].validate(obj[key]);
            }else if(this.inclusive){
                console.log(obj);
                throw new Error(`Unknown property ${key} in an exclusive context`);
            }else{
                ap.validate(obj[key]);
            }
        }
    }
};

class Array_Validator{
    constructor(options){
        this.maxLength = options.maxLength || Infinity;
        this.minLength = options.minLength || -Infinity;
        if(options.pattern){
            //valid patterns: ? + * <validator>
            for(let pat of options.pattern){
                if(pat.match(/^[\?\+\*]$/)){
                    this.pattern.push(pat);
                }else{
                    this.pattern.push(new Validator(pat));
                }
            }
        }
        this.repeat = this.repeat || options.repeat || false;
        //pattern must be exhausted
        this.align_end = options.align_end || options.align || true;
        if(options.all){
            //overrides other options
            this.pattern = [new Validator(options.all)];
            this.repeat = true;
        }
    }
    pattern = [];
    validate(arr){
        if(!(arr instanceof Array)){
            console.log(arr);
            throw new Error(`Value not of type Array`);
        }
        const {maxLength,minLength} = this;
        if(arr.length > maxLength){
            console.log(arr);
            throw new Error(`Value exceeds max length of ${maxLength}`);
        }
        if(arr.length < minLength){
            console.log(arr);
            throw new Error(`Value exceeds min length of ${minLength}`);
        }
        let patidx = 0;
        let i = 0;
        const {pattern} = this;
        if(pattern.length === 0)return true;
        while(i < arr.length){
            if(patidx >= pattern.length){
                if(this.repeat){
                    patidx = 0;
                }else{
                    console.log(arr);
                    throw new Error(`Array contains more values than pattern`);
                }
            }
            if(!pattern[patidx] instanceof Validator){
                console.log(pattern);
                throw new Error(`Invalid array pattern`);
            }
            const pat = pattern[patidx++];
            let suffix = "";
            if(patidx < pattern.length){
                if(typeof pattern[patidx] === "string"){
                    suffix = pattern[patidx++];
                }
            }
            if(suffix === ""){
                pat.validate(arr[i++]);
            }else if(suffix === "?"){
                try{
                    pat.validate(arr[i]);
                    i++;
                }catch(err){
                }
            }else if(suffix === "+"){
                pat.validate(arr[i++]);
                while(i < arr.length){
                    try{
                        pat.validate(arr[i]);
                        i++;
                    }catch(err){
                    }
                }
            }else if(suffix === "*"){
                while(i < arr.length){
                    try{
                        pat.validate(arr[i]);
                        i++;
                    }catch(err){
                    }
                }
            }else{
                throw new Error(`Unexpected suffix ${suffix}`);
            }
        }
        if(this.align_end && patidx !== pattern.length){
            console.log(arr);
            console.log(pattern);
            throw new Error(`Array pattern not exhausted`);
        }
        return true;
    }
};

class String_Validator{
    constructor(options){
        this.match = options.match || /.*/;
    }
    validate(str){
        if(typeof str !== str){
            console.log(str);
            throw new Error("Expected a string");
        }
        if(str.match(this.match)){
            return true;
        }else{
            console.log(this.match);
            console.log(str);
            throw new Error(`String pattern does not match`);
        }
    }
};


export class Validator{
    schemas = [];
    constructor(options){
        if(!(options instanceof Array)){
            options = [options];
        }
        for(let option of options){
            let type = option.type || "custom";
            if("type" in option){
                this.schemas.push(new this.types[option.type](option));
            }else if(){
            }
        }
    }
    types = {
        "object":Object_Validator,
        "array":Array_Validator,
        "string":String_Validator,
        "instanceof":Instanceof_Validator,
        "typeof":Typeof_Validator,
        "custom":Custom_Validator
    };
    validate(obj){
        let err;
        if(this.schemas.length === 0)return true;
        for(let schema of this.schemas){
            try{
                schema.validate(obj);
                return true;
            }catch(_err){
                err = _err;
            }
        }
        throw err;
    }
};

//validator[schemas]
//schema -> allowed properties
//property is an instance of validator

const validator = new Validator;
const variants = validator
    .allow("object","exclusive")
    .prop("variants","mandatory")
    .allow("object","inclusive");
variants
    .prop_any()
    .allow("object","inclusive")
    .prop("model","mandatory")
    .allow("string",/^minecraft\:.*$/);

const validator = new Validator([{
    type:"object",
    mode:"exclusive",
    props:{
        "variants":[{
            type:"object",
            mode:
        }]
    }
},{
    type:"object",
    mode:"exclusive",
    props_mandatory:{
        "multipart":[{
            type:"array",
            prop_any:[{
                type:"object",
                mode:"exclusive",
                props:{

                }
            }]
        }]
    }
}]);




//could also do addSchema("number") or addSchema("array") or addSchema(custom)
//default: whitelist mode
//could alter with .blacklist()
const variants_props = variants.prop("variants").addSchema("object");
variants_props.anyProp()

variants.whitelist("variants");
variants.prop("variants").addSchema();

new Validator(V_or({
    ""
},{

}));



