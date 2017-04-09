function clone(obj,sel) {
    return (obj ? _clone("",obj,sel) : obj);
 }

function _clone(pth,src,sel) {
    var ret=(src instanceof Array ? [] : {});

    for(var key in src) {
        if(!src.hasOwnProperty(key)) { continue; }

        var val=src[key], sub;

        if(sel) {
            sub+=pth+"/"+key;
            if(!sel(sub,key,val)) { continue; }
            }

        if(val && typeof(val)=='object') {
            if     (val instanceof Boolean) { val=Boolean(val);        }
            else if(val instanceof Number ) { val=Number (val);        }
            else if(val instanceof String ) { val=String (val);        }
            else                            { val=_clone(sub,val,sel); }
            }
        ret[key]=val;
        }
    return ret;
    } 