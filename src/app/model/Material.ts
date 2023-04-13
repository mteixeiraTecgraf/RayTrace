import { vec3 } from "gl-matrix";
import { EPSILON, Hit, Ray, Scene, createRay } from "./Film";
import { abs, add2, distance, dot, minus, mul, normalize, reflect, sampleBetween2, scale, sub2, verbose2 } from "./utils";
import { DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, FORCCE_LI_HIT, FORCCE_LI_MAT, FORCCE_L_HIT, FORCCE_L_HIT_N, FORCCE_NORMAL, LIMITS, SHINESS, verbose3 } from "./config";



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
export class PhongMetal extends Material{
    constructor(private phongMaterial:PhongMaterial, private r0:number){ super()}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3
    {
        let p = hit.p;
        let n = normalize(hit.n);
        let v = normalize(sub2(origin, p));
        let R = this.r0 + (1-this.r0)*Math.pow((1-dot(v,n)),5);
        
        if(false) return this.phongMaterial.Eval(scene, hit, origin);
        
        if(false) R=1.0;
        if(false) return abs(minus(v));
        if(false) return abs(scale([1,0,0], Math.pow((dot(v,n)),5)));
        if(false) {
            //return this.phongMaterial.Eval(scene, hit, origin) 
            //return [1,0,0]
            //var v2 = n.map(c=>Math.abs(c));
            var v2 = v.map(c=>Math.abs(c));
            return <vec3>v2;
        }
        
        /*
        if(R<=EPSILON)
        {
            return [0,0,0];
        }
        */
        let c = scale(this.phongMaterial.Eval(scene, hit, origin), (1-R));
        let r = normalize(reflect((v), n));
        if(false) return abs(reflect((v), n));
        let ray = createRay(p, r, {addEps:true})
        var refl = scale(scene.TraceRay(ray),R);
        c = add2(c, refl)

        if(DEBUG_TRACE_POINT && distance(hit?.p??[0,0,0], DEBUG_TRACE_POINT_COORDS)<0.08)
        {
            console.log("Hit", R, refl, v, r,n);
            return [0,0,1]
            //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
        }
        
        return c;

    }
}

export class PhongDieletrics extends Material{
    override Eval(scene: Scene, hit: Hit, origin: vec3): vec3 {
        throw new Error("Method not implemented.");
    }

}