import { vec3 } from "gl-matrix";
import { Hit, Scene } from "./Film";
import { add2, distance, dot, minus, mul, normalize, reflect, sampleBetween2, scale, sub2, verbose2 } from "./utils";
import { FORCCE_LI_HIT, FORCCE_LI_MAT, FORCCE_L_HIT, FORCCE_L_HIT_N, FORCCE_NORMAL, LIMITS, SHINESS, verbose3 } from "./config";



export abstract class Material{
    abstract Eval(scene: Scene, hit: Hit, origin: vec3):vec3;
}
export class PhongMaterial extends Material{
    constructor(private matColorDiff:vec3, private matColorSpec:vec3 = [0,0,0], private shiness:number = SHINESS){ super()}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3 {
        var v2 = sampleBetween2(scene.Sample, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3])
        if( verbose2) 
            console.log("Evaluating material", scene.sample,v2);
        let c:vec3 = mul(scene.ambientLight, this.matColorDiff);
        let v:vec3 = normalize(sub2(origin, hit!.p))
        var n = normalize(hit!.n??[0,1,0]);
        
        if(FORCCE_NORMAL) {
            var r = n.map(v=>Math.abs(v));
            return <vec3>r;
        }
        //return c;
        //return mul(add2([1,-1,1],n), [1/2,-1/2,1/2]);
        //vec3.normalize(v,)
        scene.instances.filter(i=>Boolean(i.light)==true).forEach(instance=>{
            var ls = instance.light!;
            var {li,l} = ls.Radiance(scene, hit!.p, n)
            var ml = minus(l);
            var contrib = scale(mul(this.matColorDiff, li), Math.max(0, dot(l,n)));
            
            if(FORCCE_L_HIT)
            {
                var r2 = l.map(v=>Math.abs(v));
                c = add2(c, <vec3>r2);
                return;
            }
            if(FORCCE_L_HIT_N)
            {
                var r2 = scale([1,0,0],dot(l,n)).map(v=>Math.abs(v));
                c = add2(c, <vec3>r2);
                return;
            }
            if(FORCCE_LI_HIT)
            {
                var r2 = li.map(v=>Math.abs(v));
                c = add2(c, <vec3>r2);
                return;
            }
            if(FORCCE_LI_MAT)
            {
                var r2 = mul(this.matColorDiff, li).map(v=>Math.abs(v));
                c = add2(c, <vec3>r2);
                return;
            }
            //console.log("Contrib",contrib, li, l,n,dot(l,n))
            if(li[0]>0.5)
            {
                //console.log(li,l,ml, contrib, this.matColorDiff, hit, dot(l,n))

            }
            add(contrib);
            if(distance(hit.p, [2,1.5,2.9])<0.2)
            {
                //console.log("Hit Eval", n, hit.p, l,ml, distance(hit.p, [2,1.5,2.9]), dot(l,n));
            }
            var r = reflect(l, n);
            //console.log(li,l, contrib, hit, r, n, dot(r,v))
            //var c2 = scale([1,1,1],Math.pow(Math.max(0,dot(r,v)), 10)*255);
            //console.log("Dot",dot(r,v))
            var c2 = scale(this.matColorSpec,Math.pow(Math.max(0,Math.min(dot(r,v), 1)), this.shiness));
            if(verbose3)console.log("shine", c2, c, r, v, dot(r,v), "L",l,ml, ls, n,hit);
            add(c2);
            //console.log("shine", c2, c);
            //TODO: FALTA SPEC
        }
        )
        return c;
        function add(color:vec3)
        {
            c = vec3.min([1,1,1], [1,1,1], add2(c, color));
        }
    }
    P: vec3;

}