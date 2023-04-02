import { vec3 } from "gl-matrix";
import { EPSILON, Hit, Ray } from "./Film";
import { add2, cross, divide, dot, normalize, scale, sollution, sub2, verbose } from "./utils";

export abstract class Shape {
    abstract ComputeIntersection(ray:Ray):Hit|undefined;
}

export class Sphere implements Shape{
    type="Sphere";
    constructor( ){
        
    }
    private center:vec3 = [0,0,0]
    private Radius = 1;

    //cache:{[number]}
    o_c: vec3 = [-12345,-1,-1];
    c=-12345
    ComputeIntersection(ray:Ray){
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
        var posSols =sols.filter(s=>s>EPSILON);
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
    constructor(public normal:vec3, public point:vec3){}
    ComputeIntersection(ray: Ray): Hit | undefined {
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
    
}
export class Area1 implements Shape{
    type="Area";
    plane:Plane
    constructor(){
        //this.plane = null
    }
    ComputeIntersection(ray: Ray): Hit | undefined {
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
    
}
export class Area implements Shape{
    type="Area";
    plane:Plane
    constructor(public p:vec3, public e1:vec3, public e2:vec3){
        //console.log("Area", e1, e2, cross(e1,e2));
        this.plane = new Plane(cross(e1,e2),p)
    }
    ComputeIntersection(ray: Ray): Hit | undefined {
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
    
}
export class Box implements Shape{
    type="Area";
    constructor(public bMin:vec3, public bMax:vec3){
        //console.log("Area", e1, e2, cross(e1,e2));
    }
    ComputeIntersection(ray: Ray): Hit | undefined {

        var t0 = divide(sub2(this.bMin, ray.origin),ray.direction);
        var t1 = divide(sub2(this.bMax, ray.origin),ray.direction);
        //console.log("Area", this.e1, this.e2, cross(this.e1,this.e2));
        //return ;
        //ray.origin
        return ;
    }
    
}