const newValidator = function(rules){
    if(rules instanceof Validator){
        return rules;
    }
    return new Validator(rules);
};

const objSizeAtMost(obj,size){
    let cnt = 0;
    for(let key in obj){
        cnt++;
        if(cnt > size)return false;
    }
    return true;
};

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
            if("type" in rule){
                if(rule.type in Validator.types){
                    this.schemas.push(new Validator.types[rule.type]);
                }
                if(typeof type === "string"){
                    this.schemas.push(new Typeof_Validator(rule));
                }else if(typeof type === "function"){
                    this.schemas.push(new Instanceof_Validator(rule));
                }
            }else if("custom" in rule){
                this.schemas.push(new Custom_Validator(rule));
            }else{
                throw new Error("Invalid rule");
            }
        }
    }
    validate(obj){
        let err;
        if(this.schemas.length === 0)return true;
        for(let i = 0; i < this.schemas.length; i++){
            const schema = this.schemas[i];
            try{
                schema.validate(obj);
                return true;
            }catch(_err){
                if(_err instanceof ValidatorError){
                    err = _err;
                    //push schema index to context
                    if(schemas.length > 1)
                        err.context.push(i);
                }else{
                    throw _err;
                }
            }
        }
        throw err;
    }
}




