import { vec2, vec3 } from "gl-matrix";
import * as GLMat from  "gl-matrix";
import { TitleStrategy } from "@angular/router";

function sollution([a,b,c]:vec3)
{
    var delta = b*b -4*a*c;
    var sol1 = (-b + Math.sqrt(delta))/(2*a)
    var sol2 = (-b - Math.sqrt(delta))/(2*a);
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
function inverse(v:GLMat.mat3)
{
    return GLMat.mat3.invert([0,0,0,0,0,0,0,0,0], v);
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
                    setPixel(myImageData, idx,jdx,this.W, this.H, c[0], c[1],c[2],255 );
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
    toWorldMatric:GLMat.mat3 = [0,0,0,0,0,0,0,0,0]
    constructor(public u:vec3, public v: vec3, public w: vec3, public angle:number, public distance:number, public ratio:number)
    {
        this.lookAt(u,v,w);   
    }
    lookAt(u:vec3, v: vec3, w: vec3)
    {
        this.toWorldMatric = [
            u[0],u[1],u[2],
            v[0],v[1],v[2],
            w[0],w[1],w[2],
        ]
    }
    ToCameraPosition(v:vec3){

        return GLMat.vec3.transformMat3([0,0,0],v, inverse(this.toWorldMatric))
    }
    ToWorldPosition(v:vec3){
        return GLMat.vec3.transformMat3([0,0,0],v, this.toWorldMatric)

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
        var Li = scale(this.Potencia,1/(r*r))
        
        //console.log("Radiance", this.Potencia, l, r,Li, r, 1/(r*r*0.5));
        return {li:Li, l:l}
    }
    constructor(public Position: vec3 = [0,0,0], public Potencia: vec3 = [1,1,1]){}

}
export class Material{
    constructor(private matColorDiff:vec3){}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3 {
        let c:vec3 = [0,0,0];
        let v:vec3 = normalize(vec3.sub([0,0,0], origin, hit!.p))
        //vec3.normalize(v,)
        scene.lightSources.forEach(ls=>{
            var n = hit!.n;
            var {li,l} = ls.Radiance(scene, hit!.p, n)
            var contrib = scale(mul(this.matColorDiff, li), Math.max(0, dot(l,n)));
            //console.log(li,l, contrib, hit, dot(l,n))
            add(contrib);
            var r = reflect(scale(l,-1), n);
            //console.log(li,l, contrib, hit, r, n, dot(r,v))
            var c2 = scale([1,1,1],Math.pow(Math.max(0,dot(r,v)), 30)*255);
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

    constructor(private Film:Film, private camera:Camera){}
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
                GLMat.vec3.scale(c, hit.light.Potencia,1/r*r);
                
                return  c;
            }
            else if(hit.material)
            {
                var c = hit.material.Eval(this, hit, ray.origin);
                
                console.log("Hit Some ", c);
                return c;
            }

        }
        //console.log("Hit None");
        return [0,0,0];
            //return this.temp(ray);
    }
    lightSources:Light[]=[
        new Light([-0.5,1,-3]), 
        new Light([-0.5,1,1]), 
        new Light([2.5,0,1])
    ]
    materials:Material[] = [
        new Material([255,0,0]), 
        new Material([0,255,0]),
        new Material([0,0, 255]),
        new Material([255,255,255]),
    ]
    obj:Sphere = new Sphere([0,3,0], 1);
    ComputeIntersection(ray: Ray):Hit|undefined {
        
        var o_c = (sub2(ray.origin, this.obj.center));
        //console.log("Ray o - c", o_c, ray.origin, ray.direction)
        var a = dot(ray.direction, ray.direction);
        var b = dot(ray.direction, o_c)*2;
        var c = dot(o_c,o_c) -(this.obj.Radius*this.obj.Radius);
        //console.log("abc", a,b,c)
        var sols = sollution([a,b,c])
        var posSols =sols.filter(s=>s>0);
        if(posSols.length<=0)
        {
            return ;
        }
        var t = Math.min(...posSols);
        var p = scale(ray.direction, t);

        return <Hit>{
            material:this.materials[0],
            t: t,
            p: p,
            n: normalize(sub2(p,this.obj.center)),
            backface:(posSols.length == 1)
        }

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
export class Shape{

}
export class Sphere{
    constructor(public center:vec3, public Radius:number){}
}