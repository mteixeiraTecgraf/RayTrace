import { vec3 } from "gl-matrix";
import { EPSILON, Hit, Ray } from "./Film";
import { add2, closeTo, cross, distance, divide, dot, length, max, min, normalize, scale, sollution, sub2, triple, verbose } from "./utils";
import { FORCCE_HIT, FORCCE_HIT_ON_VERTEX } from "./config";

export abstract class Shape {
    computationCount = 0;
    SuccessCount = 0;
    abstract ComputeIntersection(ray:Ray):Hit|undefined;
    abstract BondingBox():Box;
}

export class Sphere implements Shape{
    computationCount = 0;
    SuccessCount = 0;
    type="Sphere";
    constructor( ){
        
    }
    bbox = new Box([-1,-1,-1], [1,1,1]);
    BondingBox(){
        return this.bbox;

    }
    private center:vec3 = [0,0,0]
    private Radius = 1;

    //cache:{[number]}
    o_c: vec3 = [-12345,-1,-1];
    c=-12345
    ComputeIntersection(ray:Ray){
        this.computationCount++;
        var v1 = verbose //|| sampleBetween(ray, 0.49,0.51, 0.49, 0.51)
        //if(this.o_c[0]==-12345)
        {
            this.o_c = (sub2(ray.origin, this.center));
            //this.o_c = (sub2(this.center, ray.origin));
            this.c = dot(this.o_c,this.o_c) -(this.Radius*this.Radius);
        }
        
        //console.log("Ray o - c", o_c, ray.origin, ray.direction)
        var a = dot(ray.direction, ray.direction);
        var b = dot(ray.direction, this.o_c)*2;
        var c = this.c;
        //console.log("abc", a,b,c)
        var sols = sollution([a,b,c])
        if(v1) console.log("Solutions", sols,a,b,c)
        var posSols =sols.filter(s=>Math.abs(s)>EPSILON);
        if(posSols.length<=0)
        {
            return ;
        }
        
        if(v1) console.log("Solutions", sols,a,b,c)
        //console.log("Intersection", a,b,c)
        var t1 = Math.min(...posSols);
        //if(t < t1)return;
        var t = t1;
        var p = add2(ray.origin,scale(ray.direction, t));
        //var p = scale(ray.direction, t);
        var backface = (posSols.length == 1)
        var n= normalize(sub2(p,this.center));
        //var material = obj.material
        
        return <Hit>{
            material:undefined,
            t: t,
            p: p,
            n: n,
            backface:backface,
        }
    }
    
}
export class Plane implements Shape{
    type="Plane";
    computationCount = 0;
    SuccessCount = 0;
    constructor(public normal:vec3, public point:vec3){}
    ComputeIntersection(ray: Ray): Hit | undefined {
        this.computationCount++;
        var d2 = dot(ray.direction, this.normal)
        //console.log("Plane Intersection", d2, ray.direction, this.normal)
        if((d2>= -EPSILON) && ( d2<=EPSILON))
        {
            //parallel
            //console.log("Not Intersect");
            return ;
        }
        var num = dot(sub2(this.point, ray.origin), this.normal)
        var t = num/d2;
        //var p = add2(this.point,scale(ray.direction, t));
        var p = add2(ray.origin,scale(ray.direction, t));
        var backface = d2>0;
        var n= this.normal;
        //console.log("Plane", num, d2, t, p, n, backface);
            //console.log("Hit", t,p,n, num, d2,ray.direction, this.point);
        return <Hit>{
            material:undefined,
            t: t,
            p: p,
            n: n,
            backface:backface,
        }
    }
    bbox = new Box(sub2(this.point, [1000,1000,0.001] ), add2(this.point, [1000,1000,0.001]) )
    BondingBox():Box
    {
        return this.bbox
    }
    
}
export class Area1 implements Shape{
    computationCount = 0;
    SuccessCount = 0;
    type="Area";
    plane:Plane
    constructor(){
        //this.plane = null
    }
    ComputeIntersection(ray: Ray): Hit | undefined {
        this.computationCount++;
        //return ;
        var hit = this.plane.ComputeIntersection(ray);
        if(hit)
        {
            var [x,y] = hit.p;
            //if(delta[0]<1)
            if(x>=0 && x<1 && y>=0 && y<1)
            {
                return hit;
            }
        }
        return ;
    }
    BondingBox():Box
    {
        return new Box();
    }
    
}
export class Area implements Shape{
    type="Area";
    computationCount = 0;
    SuccessCount = 0;
    plane:Plane
    constructor(public p:vec3, public e1:vec3, public e2:vec3){
        //console.log("Area", e1, e2, cross(e1,e2));
        this.plane = new Plane(cross(e1,e2),p)
    }
    ComputeIntersection(ray: Ray): Hit | undefined {
        this.computationCount++;
        //console.log("Area", this.e1, this.e2, cross(this.e1,this.e2));
        //return ;
        //ray.origin
        var hit = this.plane.ComputeIntersection(ray);
        if(hit)
        {
            //console.log("Plant Hit", hit);
            //var [x,y] = hit.p;
            var p = hit.p;
            var pn = sub2(p,this.p);
            var x = dot(pn, this.e1);
            var y = dot(pn, this.e2);
            //console.log("Plane Hit", hit, p, pn, x, y);
            //if(delta[0]<1)
            if(x>=0 && x<1 && y>=0 && y<1)
            {
                return hit;
            }
        }
        return ;
    }
    bbox = new Box(this.p, add2(add2(this.p, this.e1), add2(this.e2, scale(cross(this.e1, this.e2), EPSILON))))
    BondingBox():Box
    {
        return this.bbox;
    }
    
}
export class Box implements Shape{
    type="Box";
    computationCount = 0;
    SuccessCount = 0;
    constructor(public bMin:vec3 = [0,0,0], public bMax:vec3 = [1,1,1]){
        //console.log("Area", e1, e2, cross(e1,e2));
    }
    Borders(){

        return <vec3[]>[
            [this.bMin[0],this.bMin[1],this.bMin[2]],    
            [this.bMin[0],this.bMin[1],this.bMax[2]],    
            [this.bMin[0],this.bMax[1],this.bMin[2]],    
            [this.bMin[0],this.bMax[1],this.bMax[2]],    
            [this.bMax[0],this.bMin[1],this.bMin[2]],    
            [this.bMax[0],this.bMin[1],this.bMax[2]],    
            [this.bMax[0],this.bMax[1],this.bMin[2]],    
            [this.bMax[0],this.bMax[1],this.bMax[2]],    
        ]
    }
    Centroid():vec3{
        return scale([
            this.bMax[0]+this.bMin[0],
            this.bMax[1]+this.bMin[1],
            this.bMax[2]+this.bMin[2],
        ],0.5)
    }
    ComputeIntersection(ray: Ray): Hit | undefined {
        this.computationCount++;
        

        let tn0 = 0;
        let tn1 = Number.POSITIVE_INFINITY;
        let h = [-1,-1]
        for(let i=0; i<3;++i){
            let bm = this.bMin[i];
            let bmax = this.bMax[i];
            let tn = Math.max(bm-ray.origin[i])/ray.direction[i];
            let tf = Math.min(bmax-ray.origin[i])/ray.direction[i];
            if(tn >tf)
            {
                let tmp = tf;
                tf = tn;
                tn = tmp;
            }
            tn0 = Math.max(tn0, tn);
            tn1 = Math.min(tn1, tf);
            h[0] = (tn0==tn)?i:h[0];
            h[1] = (tn1==tf)?3+i:h[1];
            if(tn0>tn1)
                return;
            

        }
        if(false)
        {

            var t0 = divide(sub2(this.bMin, ray.origin),ray.direction);
            var t1 = divide(sub2(this.bMax, ray.origin),ray.direction);
            
            var tnear = min(t0,t1);
            var tfar = max(t0,t1);
            
            //console.log("tnear ", tnear, "tfar", tfar);
            
            var tmin = Math.max(...tnear);
            var tmax = Math.min(...tfar);
        }
        var tmin = tn0;
        var tmax = tn1;
        if(tmin<tmax)
        {

            var t = tmin>0?tmin:tmax;
            var p = add2(ray.origin,scale(ray.direction,t));
            var n:vec3 = [0,0,0];
    
            var hf = tmin>0?h[0]:h[1];
            let ns = <vec3[]>[
                [-1,0,0],
                [0,-1,0],
                [0,0,-1],
                [1,0,0],
                [0,1,0],
                [0,0,1],
            ]
            n = ns[hf]

            if(true){

                if(closeTo(p[0],this.bMin[0],0.0001))
                {
                    n = [-1,0,0];
                }
                else if(closeTo(p[0],this.bMax[0],0.0001))
                {
                    n = [1,0,0];
                }
                else if(closeTo(p[1],this.bMin[1],0.0001))
                {
                    n = [0,-1,0];
                }
                else if(closeTo(p[1],this.bMax[1],0.0001))
                {
                    n = [0,-1,0];
                }
                else if(closeTo(p[2],this.bMin[2],0.0001))
                {
                    n = [0,0,-1];
                }
                else if(closeTo(p[2],this.bMax[2],0.0001))
                {
                    n = [0,0,1];
                }
                else{
                    throw Error("Invalid Normal Option");
                }
            }
            this.SuccessCount++;
            //console.log("CloseTo",p, this.bMin, this.bMax, n )
            return <Hit>{
                t:t,
                p:p,
                backface: tmin < 0,
                n:n,
            }
            //return
        }
        //console.log("Area", this.e1, this.e2, cross(this.e1,this.e2));
        //return ;
        //ray.origin
        return ;
    }
    BondingBox():Box
    {
        return this;
    }
    
}

export class Vertex implements Shape{
    computationCount: number;
    SuccessCount: number;
    e1: vec3;
    e2: vec3;
    cross:vec3
    normal:vec3
    area:number
    constructor(public a:vec3, public b:vec3, public c:vec3){
        this.refresh();
    }
    refresh(){        
        this.e1 = sub2(this.b,this.a)
        this.e2 = sub2(this.c,this.a);
        this.cross = cross(this.e1, this.e2);
        this.normal = normalize(this.cross);
        this.area = length(this.cross)/2
    }
    ComputeIntersection(ray: Ray): Hit | undefined {
        let d = ray.direction;
        const denominador = triple(d,this.e2,this.e1);
        if(Math.abs(denominador)<=EPSILON){
            return;
        }
        let r = sub2(ray.origin,this.a);
        let u = triple(d, this.e2, r)/denominador;
        if((u<0) || (u>1)) return;

        let v = triple(d, r, this.e1)/denominador;
        if((v<0) || (v>1)) return;

        if(u+v>1) return;

        let t = triple(r,this.e1, this.e2)/denominador;
        if(t<0)return;

        let backface = denominador<0;
        let n = this.normal;
        //let p = add2(scale(this.e1,u),scale(this.e2,v))
        let p = add2(ray.origin, scale(d, t))
        
        return <Hit>{
            backface,
            n,
            t,
            p,
            forceOnVertex:FORCCE_HIT_ON_VERTEX,
            uv:[u,v]
        }
        
    }
    BondingBox(): Box {
        let minB = min(this.a, this.b, this.c);
        let maxB = max(this.a, this.b, this.c);
        let diff = sub2(maxB, minB)
        let minDiff = max(diff,[EPSILON,EPSILON,EPSILON])
        return new Box(min(this.a, this.b, this.c), add2(minB, minDiff));
    }

}