const getClassName = function(obj){
    return obj.name || (obj+"");
};

const isEmpty = function(obj){
    for(let key in obj){
        return false;
    }
    return true;
};


export class ValidatorError{
    //specifying the display order on console, do not remove
    msg;
    path = "";
    target;
    context;
    constructor(msg,target,context){
        this.msg = msg;
        this.target = target;
        this.context = context;
    }
    addPath(ctx,literal){
        const {path} = this;
        if(literal){
            this.path = ctx + path;
        }
        if(typeof ctx === "number"){
            this.path = `[${ctx}]` + path;
        }else if(typeof ctx === "string"){
            if(ctx.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)){
                this.path = "."+ctx + path;
            }else{
                this.path = `[${ctx}]` + path;
            }
        }
    }
};


class Base_Validator{
    constructor(rule){
        //map aliases
        const aliases = this.constructor.aliases;
        if(aliases){
            for(let key in aliases){
                let maps = aliases[key];
                if(!(maps instanceof Array))maps = [maps];
                for(let map of maps){
                    if(map in rule){
                        rule[key] = rule[map];
                    }
                }
            }
        }
        if(rule.custom){
            this.custom = rule.custom;
            this.validate_inner = this.validate;
            this.validate = function(obj){
                let res;
                if((res = this.validate_inner(obj)) === true){
                    res = this.custom(obj);
                    if(res === true){
                        return true;
                    }else if(res instanceof ValidatorError){
                        return res;
                    }else if(!res){
                        return new ValidatorError("Custom validation failed",obj,this.custom.toString().slice(0,50));
                    }else{
                        console.log(res);
                        throw new Error("Unknown return value from custom validator",res);
                    }
                }
                return res;
            }.bind(this);
        }
    }
};

class Typeof_Validator extends Base_Validator{
    constructor(rule){
        super(rule);
        this.type = rule.type;
        this.custom = rule.custom;
    }
    validate(obj){
        if(typeof obj === this.type){
            return true;
        }
        return new ValidatorError(`Expected type ${this.type}, but got ${typeof obj} instead`,obj,this.type);
    }
};

class Instanceof_Validator extends Base_Validator{
    constructor(rule){
        super(rule);
        this.type = rule.type;
        this.custom = rule.custom;
    }
    validate(obj){
        if(obj instanceof this.type){
            return true;
        }
        return new ValidationError(`Expected ${getClassName(this.type.name)}, but got ${getClassName(obj.constructor)} instead`,obj,this.type);
    }
};

class Object_Validator extends Base_Validator{
    constructor(options){
        super(options);
        this.inclusive = this.getInclusiveness(options);
        const mp = options.props_mandatory || {};
        const op = options.props_optional || {};
        const ap = options.props_any || [];
        for(let key in mp){
            this.props_mandatory[key] = newValidator(mp[key]);
        }
        for(let key in op){
            this.props_optional[key] = newValidator(op[key]);
        }
        this.props_any = newValidator(ap);
    }
    static aliases = {
        props_any:["any", "others"],
        props_mandatory:["mandatory", "required"],
        props_optional:["optional", "props"]
    };
    getInclusiveness(options){
        if("inclusive" in options){
            return options.inclusive;
        }else if("props_any" in options){
            return true;
        }else if("props_optional" in options || "props_mandatory" in options){
            return false;
        }else{
            return true;
        }
    }
    props_mandatory = {};//value validator
    props_optional = {};
    props_any;//validator
    validate(obj){
        if(typeof obj !== "object"){
            return new ValidatorError(`Value not of type Object`,obj);
        }
        const {props_mandatory:mp,props_optional:op,props_any:ap} = this;
        for(let key in mp){
            if(!(key in obj)){
                return new ValidatorError(`Mandatory property ${key} absent`,obj,key);
            }
            let res = mp[key].validate(obj[key])
            if(res instanceof ValidatorError){
                res.addPath(key);
                return res;
            }
        }
        for(let key in obj){
            if(key in mp)continue;
            if(key in op){
                let res = op[key].validate(obj[key]);
                if(res instanceof ValidatorError){
                    res.addPath(key);
                    return res;
                }
            }else if(!this.inclusive){
                return new ValidatorError(`Unknown property ${key} in an exclusive context`,obj,key);
            }else{
                let res = ap.validate(obj[key]);
                if(res instanceof ValidatorError){
                    res.addPath(key);
                    return res;
                }
            }
        }
        return true;
    }
};

class Array_Validator extends Base_Validator{
    constructor(options){
        super(options);
        this.maxLength = options.maxLength || Infinity;
        this.minLength = options.minLength || -Infinity;
        if(options.pattern){
            //valid patterns: ? + * <Validator>
            for(let pat of options.pattern){
                if(typeof pat === "string"){
                    if(pat.match(/^[\?\+\*]$/)){
                        this.pattern.push(pat);
                    }else{
                        throw new Error(`Unknown patternstring ${pat}`);
                    }
                }else{
                    this.pattern.push(newValidator(pat));
                }
            }
        }
        //repeat the pattern
        this.repeat = this.getRepeat(options);
        //with align_end patterns must be exhausted
        this.align_end = this.getAlign_End(options);
        if(options.all){
            //overrides other options
            this.pattern = [newValidator(options.all)];
            this.repeat = true;
        }
    }
    getRepeat(options){
        //could do !!options.repeat,
        // but using this format for readability and maintainability
        if("repeat" in options){
            return options.repeat;
        }
        return false;
    }
    getAlign_End(options){
        if("align_end" in options){
            return options.align_end;
        }
        return true;
    }
    static aliases = {
        align_end:"align"
    };
    
    pattern = [];
    validate(arr){
        if(!(arr instanceof Array)){
            return new ValidatorError(`Value not of type Array`,arr);
        }
        const {maxLength,minLength} = this;
        if(arr.length > maxLength){
            return new ValidatorError(`Value exceeds max length of ${maxLength}`,arr);
        }
        if(arr.length < minLength){
            return new ValidatorError(`Value exceeds min length of ${minLength}`,arr);
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
                    return new ValidatorError(`Array contains more values than pattern`,arr,pattern);
                }
            }
            //todo: move this to constructor
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
                let res = pat.validate(arr[i++]);
                if(res instanceof ValidatorError){
                    res.addPath(i-1);
                    return res;
                }
            }else if(suffix === "?"){
                let res = pat.validate(arr[i]);
                if(res === true){
                    i++;
                }
            }else if(suffix === "+"){
                let res = pat.validate(arr[i++]);
                if(res instanceof ValidatorError){
                    res.addPath(i-1);
                    return res;
                }
                while(i < arr.length){
                    let res = pat.validate(arr[i]);
                    if(res === true){
                        i++;
                    }else{
                        break;
                    }
                }
            }else if(suffix === "*"){
                while(i < arr.length){
                    let res = pat.validate(arr[i]);
                    if(res === true){
                        i++;
                    }else{
                        break;
                    }
                }
            }else{
                throw new Error(`Unexpected suffix ${suffix}`);
            }
        }
        if(this.align_end && patidx !== pattern.length){
            return new ValidatorError(`Array pattern not exhausted`,arr,pattern);
        }
        return true;
    }
};

class String_Validator extends Base_Validator{
    constructor(options){
        super(options);
        this.match = options.match || /.*/;
    }
    validate(str){
        if(typeof str !== "string"){
            return new ValidatorError(`Expected a string, but got a ${typeof str} instead`,str,"string");
        }
        if(str.match(this.match)){
            return true;
        }else{
            return new ValidatorError(`String does not match the pattern`,str,this.match);
        }
    }
};

class Wildcard_Validator extends Base_Validator{
    constructor(rule){
        super(rule || {});
    }
    validate(obj){
        return true;
    }
}


export class Validator{
    schemas = [];
    static types = {
        "object":Object_Validator,
        "array":Array_Validator,
        "string":String_Validator
    };
    constructor(rules){
        if(!(rules instanceof Array)){
            rules = [rules];
        }
        for(let rule of rules){
            if(rule instanceof Validator){
                this.schemas.push(rule);
            }else if(isEmpty(rule)){
                this.schemas.push(new Wildcard_Validator());
            }else if("type" in rule){
                const types = this.constructor.types;
                if(rule.type in types){
                    this.schemas.push(new types[rule.type](rule));
                }else if(typeof rule.type === "string"){
                    this.schemas.push(new Typeof_Validator(rule));
                }else if(typeof rule.type === "function"){
                    this.schemas.push(new Instanceof_Validator(rule));
                }
            }else if("custom" in rule){
                this.schemas.push(new Wildcard_Validator(rule));
            }else{
                console.log(rule);
                throw new Error("Invalid rule");
            }
        }
    }
    validate(obj){
        let maxerr;
        const {schemas} = this;
        if(this.schemas.length === 0)return true;
        for(let i = 0; i < schemas.length; i++){
            const schema = schemas[i];
            let res = schema.validate(obj);
            if(res instanceof ValidatorError){
                if(schemas.length > 1)
                    res.addPath(`{validator[${i}]}`,true);
                if(!maxerr || maxerr.path.length < res.path.length){
                    maxerr = res;
                }
            }else{
                return true;
            }
        }
        return maxerr;
    }
};

const newValidator = function(rules){
    if(rules instanceof Validator){
        return rules;
    }
    return new Validator(rules);
};




