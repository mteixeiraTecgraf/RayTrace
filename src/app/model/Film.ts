import { vec2, vec3, vec4 } from "gl-matrix";
import * as GLMat from  "gl-matrix";
import { TitleStrategy } from "@angular/router";

const verbose = false;
function sollution([a,b,c]:vec3)
{
    var delta = b*b -4*a*c;
    var sol1 = (-b + Math.sqrt(delta))/(2*a)
    var sol2 = (-b - Math.sqrt(delta))/(2*a);
    if(verbose)console.log("Calc Solution", -b, delta, 2*a)
    return [sol1,sol2];
    
}

function add2(v1:vec3, v2:vec3)
{
    return vec3.add([0,0,0], v1, v2);
}
function sub2(v1:vec3, v2:vec3)
{
    return vec3.sub([0,0,0], v1, v2);
}
function mul(v1:vec3, v2:vec3)
{
    return vec3.mul([0,0,0], v1, v2);
}
function dot(v1:vec3, v2:vec3)
{
    return vec3.dot( v1, v2);
}
function reflect(d:vec3, n:vec3){
    //d−2(d⋅n)n
    return sub2(d, scale(n,2*dot(d,n)))
}
function scale(v1:vec3, n:number)
{
    return vec3.scale([0,0,0], v1, n);
}
function distance(v1:vec3, v2:vec3)
{
    return vec3.distance(v1, v2);
}
function normalize(v:vec3)
{
    return vec3.normalize([0,0,0], v);
}
function inverse(v:GLMat.mat4)
{
    return GLMat.mat4.invert([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,], v);
}
function toVec4(v:vec3):vec4{
    return [v[0],v[1],v[2],1];
}
function toVec3(v:vec4):vec3{
    return [v[0],v[1],v[2]];
}
const setPixel = (myImageData:any, x:number, y:number, width:number, height:number, r:number, g:number, b:number, a:number = 255) => {

    const colorIndices = getColorIndicesForCoord(x, height-(y+1), width);
    const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;
    //film->SetPixelValue(i, j, glm::vec3(1.0f, 0.0f, 0.0f));
    myImageData.data[redIndex] = r;
    myImageData.data[greenIndex] = g;
    myImageData.data[blueIndex] = b;
    myImageData.data[alphaIndex] = a;
  }
  
  const getColorIndicesForCoord = (x:number, y:number, width:number) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
  };
export class Film{
    GetSample(i: number, j: number): vec2 {
        return [i/this.W, j/this.H];
    }
    public static Make(resolution: vec2, value:number, ctx?:CanvasRenderingContext2D)
    {
        return new Film(resolution, new Array(resolution[0]).fill([]).map(() => new Array(resolution[1]).fill([]).map(()=>[value,value,value])), ctx);
        //var a:vec2 = []
    }

    constructor(public Resolution:vec2, public Data:vec3[][], public Context?:CanvasRenderingContext2D ){}

    SetPixelValue(i_idx:number,j:number,value:vec3){
        const i2 = i_idx;
        //console.log(i, j, value);
        //console.log("Data", i_idx, j, this.Data)
        const v = 155 + (i_idx/this.W) * 100;
        this.Data[i_idx][j]=value;
        //console.log("Data", i_idx, j, this.Data[i2][j])
    }
    get H(){
        return this.Resolution[1]
    }
    get W(){
        return this.Resolution[0];
    }
    
    RenderImage(Context:CanvasRenderingContext2D){
        Context = Context ?? this.Context;
        if(Context){
            console.log("Data", this.Data)
            const myImageData = Context!.createImageData(this.W, this.H);
            this.Data.forEach((l,idx)=>{
                l.forEach((c,jdx)=>{
                    setPixel(myImageData, idx,jdx,this.W, this.H, c[0]*255, c[1]*255,c[2]*255,255 );
                })
            })
            //console.log("myImageData", myImageData)
            Context!.putImageData(myImageData,0,0);
        }
    }

    SaveImage(){

    }
}

export class Camera{
    toWorldMatric:GLMat.mat4 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    constructor(public u:vec3, public v: vec3, public w: vec3, public angle:number, public distance:number, public ratio:number)
    {
        this.lookAt(u,v,w);   
    }

    RotateX(rot:number)
    {
        this.u = vec3.rotateX([0,0,0],this.u, [0,0,0], Math.PI*rot/180)
        this.v = vec3.rotateX([0,0,0],this.v, [0,0,0], Math.PI*rot/180)
        this.w = vec3.rotateX([0,0,0],this.w, [0,0,0], Math.PI*rot/180)

        this.lookAt(this.u, this.v, this.w);
    }
    lookAt(u:vec3, v: vec3, w: vec3)
    {
        this.toWorldMatric = [
            u[0],u[1],u[2],0,
            v[0],v[1],v[2],0,
            w[0],w[1],w[2],0,
            0   , 0  , 0  ,1,
        ]
    }
    ToCameraPosition(v:GLMat.vec3){

        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(v), inverse(this.toWorldMatric)))
    }
    ToWorldPosition(v:GLMat.vec3):vec3{
        return toVec3(GLMat.vec4.transformMat4([0,0,0,0],toVec4(v), this.toWorldMatric))

    }
    GenerateRay([nx,ny]: vec2): Ray {
        const degrees_to_radians = (deg:number) => (deg * Math.PI) / 180.0;
        var f = this.distance;
        var theta = degrees_to_radians(this.angle);
        var dv = f*Math.tan(theta/2);
        var du = dv*this.ratio;
        var p:vec3 = [-du + 2*du*nx, -dv + 2*dv*ny, -f];
        var o = this.ToWorldPosition([0,0,0]);
        var t = this.ToWorldPosition(p);
        return {origin:o,direction: normalize(sub2(t, o))}
    }

}
export class Light{
    Radiance(scene: Scene, p: vec3, n: vec3): { li: vec3; l: vec3; } {
        var l = normalize(sub2(this.Position, p))
        var r = distance(this.Position, p);
        var Li = scale(this.Potencia,1/(r*r*0.3))
        
        //console.log("Radiance", this.Potencia, l, r,Li, r, 1/(r*r*0.5));
        return {li:Li, l:l}
    }
    constructor(public Position: vec3 = [0,0,0], public Potencia: vec3 = [1,1,1]){}

}
export class Material{
    constructor(private matColorDiff:vec3){}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3 {
        if(verbose)console.log("Evaluating material");
        let c:vec3 = mul(scene.ambientLight, this.matColorDiff);
        let v:vec3 = normalize(vec3.sub([0,0,0], origin, hit!.p))
        //vec3.normalize(v,)
        scene.instances.filter(i=>Boolean(i.light)==true).forEach(instance=>{
            var ls = instance.light!;
            var n = hit!.n;
            var ray:Ray = {origin:hit.p, direction:normalize(sub2(ls.Position,hit.p))};

            if(verbose)console.log("Computing intersection with same light", hit, ray);
            var hit2 = scene.ComputeIntersection(ray);
            if((!hit2) || (!hit2.light) ||  (hit2.light != ls))
            {
                if(verbose)console.log("Hit2", ray, hit2, hit.light, ls)
                return;
            }
            /*
            scene.obj.forEach(ob=>{
                var lighthit = ob.shape.ComputeIntersection(ray);
                if(lighthit && lighthit.t>0.0001 && (lighthit.t < (hit.t-0.001)))
                {
                    //shadow
                    return;
                }
            });
            */
            var {li,l} = ls.Radiance(scene, hit!.p, n)
            var ml = scale(l,-1);
            var contrib = scale(mul(this.matColorDiff, li), Math.max(0, dot(l,n)));
            if(li[0]>0.5)
            {
                //console.log(li,l,ml, contrib, this.matColorDiff, hit, dot(l,n))

            }
            add(contrib);
            var r = reflect(ml, n);
            //console.log(li,l, contrib, hit, r, n, dot(r,v))
            //var c2 = scale([1,1,1],Math.pow(Math.max(0,dot(r,v)), 10)*255);
            var c2 = scale([1,1,1],Math.pow(Math.max(0,dot(r,v)), 10));
            //console.log("shine", c2, c);
            add(c2);
            //console.log("shine", c2, c);
            //TODO: FALTA SPEC
        }
        )
        return c;
        function add(color:vec3)
        {
            c = vec3.min([1,1,1], [255,255,255], add2(c, color));
        }
    }
    P: vec3;

}
export type Ray = {origin:vec3, direction:vec3};
export type Hit = {
    n:vec3;
    t: number;
    light?: Light;
    material?: Material;
    backface:boolean;
    p:vec3
};
export class Scene{

    constructor(private Film:Film, public camera:Camera, public ambientLight:vec3){}
    get W(){return this.Film.W}
    get H(){return this.Film.H}
    Render(Context:CanvasRenderingContext2D){
        const film = this.Film
        for(let i = 0; i<this.W;i++ )
        {
        
            //console.log("Pixel", i)
            for(let j = 0; j<this.H;j++ )
            {
                
                var sample:vec2 = film.GetSample(i,j);
                var ray:Ray = this.camera.GenerateRay(sample);
                
                //console.log("Ray",i,j, ray)
                var c:vec3 = this.TraceRay(ray);
                //console.log("Pixel", i,j,c)
                film.SetPixelValue(i,j,c);
                
            }
        }
        this.Film.RenderImage(Context);
    }
    TraceRay(ray: Ray): vec3 {
        var hit = this.ComputeIntersection(ray);
        if (hit)
        {
            //console.log("Hit Some");
            if(hit.light)
            {
                var c:vec3 = [0,0,0];
                var r:number = hit.t;
                c = add2(this.ambientLight, scale(hit.light.Potencia,1/r*r));
                //c = hit.light.Potencia;
                //c = scale(c,255)
                
                return  c;
            }
            else if(hit.material)
            {
                var c = hit.material.Eval(this, hit, ray.origin);
                
                //console.log("Hit Some ", c, hit);
                return c;
            }

        }
        //console.log("Hit None");
        return [0,0,0];
            //return this.temp(ray);
    }
    AddLight(light:Light) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        this.AddEntity({light, shape:new Sphere(light.Position, 0.02)});

    }
    //lightSources:Light[]=[    ]
    materials:Material[] = [
        new Material([1,0,0]), 
        new Material([0,1,0]),
        new Material([0,0, 1]),
        new Material([1,1,1]),
    ]
    
    AddEntity(arg0: { material?: Material; light?:Light, shape: Shape; }) {
        //this.obj.push(arg0);
        this.instances.push(arg0)
    }
    instances:{material?:Material, light?:Light,shape:Shape}[] =[]
    //obj:{material:Material,shape:Shape}[] =[]
    ComputeIntersection(ray: Ray):Hit|undefined {
        
        var t = Infinity;
        var p:vec3 = [0,0,0];
        var n:vec3 = [0,0,0];
        var backface=false;
        var material:Material = new Material([0,0,0]);
        var bestHit:Hit|undefined = undefined; 
        this.instances.forEach(obj => {
            
            if(verbose)console.log("Computing intersections", ray, obj);
            var hit = obj.shape.ComputeIntersection(ray);
            if(verbose)console.log("Hit Object", hit, obj);
            if(hit && (hit?.t > 0.0000005) && (hit.t < (bestHit?.t??Infinity)))
            {
                bestHit = hit;
                bestHit.material = obj.material;
                bestHit.light = obj.light;
                //console.log("Hit", bestHit);

            }
            
        });
        return bestHit;

        //var c = 
        var i = ray.origin[0]*this.W;
        var j = ray.origin[1]*this.H;
        
        var resMat = 0;
        if (i < (this.W / 2))
        {
            
            if (j < (this.H / 2))
            {
            //console.log("Teste", i);
                resMat = 0;
        
            }
            else resMat = 1; 
        }
        else{
           
            if (j < (this.H / 2))
                resMat = 2;   
            else 
                resMat = 3;  
        }
        //return {material:this.materials[resMat], p:[0,0,0], t:10, n:[0,0,0]}
    }
    temp(ray: Ray): vec3
    {
        
        var i = ray.origin[0]*this.W;
        var j = ray.origin[1]*this.H;
        if (i < (this.W / 2))
        {
        
            if (j < (this.H / 2))
            {
            //console.log("Teste", i);
                return [255,0,0];
        
            }
            else return [0,255,0];    
        }

        else
        {
            if (j < (this.H / 2))
                return [0,0, 255]      
            else return [255,255,255];     
        }
    }
    testCameraPixels(){
        
        for(var i=0;i<this.W;++i)
            for(var  j=0;j<this.H;++j)
            console.log("Pixel", i, j, this.camera.GenerateRay([i/this.W,j/this.H]))
    
    }
}
export abstract class Shape {
    abstract ComputeIntersection(ray:Ray):Hit|undefined;
}
export class Sphere implements Shape{
    type="Sphere";
    constructor(public center:vec3, public Radius:number){
        
        
    }

    //cache:{[number]}
    o_c: vec3 = [-12345,-1,-1];
    c=-12345
    ComputeIntersection(ray:Ray){
        //if(this.o_c[0]==-12345)
        {
            this.o_c = (sub2(ray.origin, this.center));
            this.c = dot(this.o_c,this.o_c) -(this.Radius*this.Radius);
        }
        //console.log("Ray o - c", o_c, ray.origin, ray.direction)
        var a = dot(ray.direction, ray.direction);
        var b = dot(ray.direction, this.o_c)*2;
        var c = this.c;
        //console.log("abc", a,b,c)
        var sols = sollution([a,b,c])
        if(verbose) console.log("Solutions", sols,a,b,c)
        var posSols =sols.filter(s=>s>0.00005);
        if(posSols.length<=0)
        {
            return ;
        }
        //console.log("Intersection", a,b,c)
        var t1 = Math.min(...posSols);
        //if(t < t1)return;
        var t = t1;
        var p = scale(ray.direction, t*0.999999);
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
        if(d2>= 0.000001 && d2<=0.000001)
        {
            //parallel
            return ;
        }
        var num = dot(sub2(this.point, ray.origin), this.normal)
        var t = num/d2;
        var p = scale(ray.direction, t*0.999999);
        var backface = false;
        var n= this.normal;
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