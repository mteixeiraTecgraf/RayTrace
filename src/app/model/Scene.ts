import { vec2, vec3, vec4 } from "gl-matrix";
import { Area, Box, Shape, Sphere } from "./Shapes";
import { add2, add3, calculateHitCode, createMat4, cross, debugSample, distance, dot, getTranslation, identity, inverse, length, max, min, minus, mul, mulMat, normalize, reflect, sampleBetween, sampleBetween2, scaleMat, setPixel, setVerbose, sub2, toVec3, toVec4, transpose, verbose, verbose2, verbose3 } from "./utils";
import * as utils from "./utils";
import { DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, DEFAULT_AREA_SAMPLE_COUNT, FORCCE_HIT, FORCCE_HIT_MAT_CODE, FORCCE_HIT_OCL_MAT_CODE, FORCCE_HIT_ON_VERTEX, LIGHT_FACTOR, LIMITS, PONTUAL_LIGHT_RADIUS, RANDOM_SAMPLE, REPEAT_PX, SAMPLE_COUNT, TEST_BRUTE_FORCE, TRACE_RAY_RECURSION_MAX } from "./config";
import { Material, PhongMaterial } from "./Material";
import { AreaLight, Light, PontualLight } from "./Light";
import { Transform } from "./Transform";
import { DEFAULTPROGRESS, Hit, EntityInstance, ProgressAction, Ray } from "./Primitive";
import { IntersectionTester } from "./Tester";
import { Camera, Film } from "./Film";
import { interval } from "rxjs";


export class Scene{
    ReportComputations() {
        console.log("Shape Count  ", this.instances.length)
        //console.log("Instances  ", this.instances)
        for(var i of this.instances)
        {
            console.log("Computation Shape  ", i.shape.computationCount)
        }
    }

    constructor(private Film:Film, public camera:Camera, public ambientLight:vec3){}
    get W(){return this.Film.W}
    get H(){return this.Film.H}
    sample:vec2 = [0,0,]
    get Sample(){
        return this.sample;
    }
    prepareScene(){
        this.tester.generateStructure();
    }
    Render(Context:CanvasRenderingContext2D, {progress}:{progress:ProgressAction} = {progress:DEFAULTPROGRESS}){
        const film = this.Film
        const count = film.GetSampleCount();
        //return;
        

        /*
        let v = 0;
        var s =interval(10).subscribe(i=>{
            let c = v;
            console.log("interval", c);
            progress(c,this.W);
        })
        //return;
        */
        for(let i = 0; i<this.W;i++ )
        {
            //v = i;
            progress(i,this.W);

            //continue;
            for(let j = 0; j<this.H;j++ )
            {
                var c:vec3 = [0,0,0]
                for(let s = 0; s<count; s++)
                {
                    //1
                    var sample:vec2 = film.GetSample(i,j);
                    
                    this.sample = sample;
                    
                    //2
                    var ray:Ray = this.camera.GenerateRay(sample);
                    (<any>ray)['sample']=sample;
                    if(verbose2) console.log("Ray",i,j, ray)
                    
                    //3
                    c = add2(c,this.TraceRay(ray));
                    if(verbose2) console.log("Pixel", i,j,c)
                }
                film.SetPixelValue(i,j,utils.scale(c, 1/count));
                
            }
        }
        progress(this.W,this.W);
        //v = this.W;
        //s.unsubscribe();
        this.Film.RenderImage(Context);
        
    }
    recursionCount = 0;
    TraceRay(ray: Ray): vec3 {
        if(this.recursionCount>=TRACE_RAY_RECURSION_MAX)return [0,0,0];
        this.recursionCount++;
        
        setVerbose(debugSample(this));
        let c = this._TraceRay(ray);
        
        setVerbose(false);
        this.recursionCount--;
        return c;
    }
    _TraceRay(ray: Ray): vec3 {
        //setVerbose(debugSample(this));
        var hit = this.ComputeIntersection(ray);
        
        //setVerbose(false);
        if (hit)
        {
            if(DEBUG_TRACE_POINT && distance(hit?.p??[0,0,0], DEBUG_TRACE_POINT_COORDS)<0.04)
            {
                console.log("Hit trace", ray, hit);
                return [0,0,1]
                //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
            }
            //console.log("Hit Some", hit);
            if(hit.light)
            {
                if(FORCCE_HIT_MAT_CODE&& hit.instanceRef>0)
                {
                    return <vec3>[0,1,1]
                    //return [(hit.instanceRef/4)%2,(hit.instanceRef/2)%2,hit.instanceRef%2]
                }
                var c:vec3 = [0,0,0];
                var r:number = hit.t;
                c = add2(this.ambientLight, utils.scale(hit.light.Potencia,1/r*r));
                //c = hit.light.Potencia;
                //c = scale(c,255)
                
                return  c;
            }
            else if(hit.material)
            {
                if(this.beforeMatEvalCheck(hit))return this.checkResult;
                
                if(verbose3)console.log("Hit Material", hit);
                var c = hit.material.Eval(this, hit, ray.origin);
                if(verbose3)console.log("Evaluated to ", c);
                
                if(this.afterMatEvalCheck(hit, ray))return this.checkResult;
                //console.log("Hit Some ", c, hit);
                return c;
            }

        }
        
        if(false && sampleBetween(ray, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]))
        return [0,0,1];
        
        //console.log("Hit None");
        return [0,0,0];
            //return this.temp(ray);
    }
    checkResult:vec3 = [0,0,0]
    afterMatEvalCheck(hit:Hit, ray:Ray){
        
        if(debugSample(this))
        {
            console.log("Trace", ray, hit)
            this.checkResult =  [0,0,1];
            return true;
        }

        if(true && sampleBetween(ray, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]))
        {

            this.checkResult =  [0,1,0];
            return true;
        }
        return false;
    }
    beforeMatEvalCheck(hit:Hit){
        if(hit.uv){
            //return min([1,1,1],add2(scale([1,0,0],hit.uv[0]), scale([0,1,0],hit.uv[1])));
        }

        if(FORCCE_HIT) {
            this.checkResult = [1,0,0];
            return true;
        }
        if(FORCCE_HIT_ON_VERTEX  && hit.forceOnVertex){

            this.checkResult =  [1,0,0];
            return true
        } 
        if(FORCCE_HIT_MAT_CODE&& hit.instanceRef>0)
        {
            //return <vec3>[0,0,1]
            this.checkResult = calculateHitCode(hit.instanceRef)
            return true
        }
        return false;
    }
    AddAreaLight(light:AreaLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = 1;
        const position =light.Position;
        //const position:vec3 = [0,2,1]
        //var transform = Transform.fromVec(position,light.ArestaI,light.Arestaj);
        var transform = new Transform;
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({name:"Luz de Area",light, shape:new Area(light.Position, light.ArestaI, light.Arestaj), transform});
    }

    AddPonctualLight(light:PontualLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = PONTUAL_LIGHT_RADIUS;
        const position =light.Position;
        //const position:vec3 = [0,2,1]
        var transform = Transform.fromScaleAndTranslation(position,scale,scale,scale);
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({name:"Luz Pontual",light, shape:new Sphere(), transform});
        

    }
    //lightSources:Light[]=[    ]
    materials:Material[] = [
        new PhongMaterial([1,0,0]), 
        new PhongMaterial([0,1,0]),
        new PhongMaterial([0,0, 1]),
        new PhongMaterial([1,1,1]),
    ]
    
    tester = new IntersectionTester()
    AddEntity(arg0: EntityInstance) {
        //this.obj.push(arg0);
        //console.log("AreaAddEntity", arg0)
        this.instances.push(arg0)
        this.tester.Add(arg0);

        return;
    }
    //root:AccNode = {}
    instances:EntityInstance[] =[]
    get lights():EntityInstance[]{
        return this.instances.filter(i=>Boolean(i.light)==true)
    }
    
    //obj:{material:Material,shape:Shape}[] =[]
    ComputeIntersection(ray: Ray):Hit|undefined {
        if(verbose)console.log("MARK2::Compute Intersections in Scene and ray", ray);
        const v2 = sampleBetween2(this.Sample, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3]);
        var t = Infinity;
        var p:vec3 = [0,0,0];
        var n:vec3 = [0,0,0];
        var backface=false;
        var material:Material = new PhongMaterial([0,0,0]);
        var bestHit:Hit|undefined = undefined; 

        /*
        var hit = this.root.box?.ComputeIntersection(ray);
        if(this.root.box && !hit)
        {
            return ;
        }
        */
       var bestHit = this.tester.Test(ray);
        //this.tester.Test()
        if(verbose3)console.log("MARK2::Hit Object Final", bestHit);
        return bestHit;
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