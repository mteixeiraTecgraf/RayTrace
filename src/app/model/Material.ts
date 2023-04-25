import { vec3 } from "gl-matrix";
import { EPSILON, Hit, Ray, Scene, createRay } from "./Film";
import { abs, add2, calculateHitCode, debugSample, distance, dot, getColorIndicesForCoord, length, minus, mul, normalize, reflect, sampleBetween2, scale, sub2, verbose2, verbose3 } from "./utils";
import { DEBUG_SAMPLE, DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, FORCCE_HIT_OCL_MAT_CODE, FORCCE_LI_HIT, FORCCE_LI_MAT, FORCCE_L_HIT, FORCCE_L_HIT_N, FORCCE_NORMAL, FORCE_HIDE_REFLECTION, LIMITS, SHINESS } from "./config";
import { BehaviorSubject, Subject, filter } from "rxjs";



export abstract class Material{
    abstract Eval(scene: Scene, hit: Hit, origin: vec3):vec3;
}
export class PhongMaterial extends Material{
    constructor(private matColorDiff:vec3, private matColorSpec:vec3 = [0,0,0], private shiness:number = SHINESS){ super()}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3 {
        var v2 = sampleBetween2(scene.Sample, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3])
        if( verbose2) 
            console.log("MARK2::Evaluating material", scene.sample,v2);
        let c:vec3 = mul(scene.ambientLight, this.matColorDiff);
        let v:vec3 = normalize(sub2(origin, hit!.p))
        var n = normalize(hit!.n??[0,1,0]);
        
        if(FORCCE_NORMAL) {
            var r = n.map(v=>Math.abs(v));
            //var r = n.map(v=>-(v));
            return <vec3>r;
        }
        //return c;
        //return mul(add2([1,-1,1],n), [1/2,-1/2,1/2]);
        //vec3.normalize(v,)
        scene.lights.forEach(instance=>{
            var ls = instance.light!;
            if(verbose2) console.log("@MARK2::Checking light", instance);
            if(debugSample(scene))
            {
                console.log("Sample ", DEBUG_SAMPLE, hit, origin)
            }
            var {li,l, hitCode} = ls.Radiance(scene, hit!.p, n)
            var ml = minus(l);
            var contrib = scale(mul(this.matColorDiff, li), Math.max(0, dot(l,n)));
            
            
            if(verbose2) console.log("@MARK2::Radiance Calculated", li, l, hitCode);

            if(FORCCE_HIT_OCL_MAT_CODE)
            {
                if(hitCode && (hitCode>0) && (length(c)<1))
                {
                    //if(hitCode<0)
                    //    c = [0,1,0];
                    //c = add2(c, [(hitCode/4)%2,(hitCode/2)%2,hitCode%2]);
                    //else
                        c = calculateHitCode(hitCode)
                }
                return;
            }
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
        if(FORCE_HIDE_REFLECTION) return c;
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
//TODO Revisar Refracao
export class PhongDieletrics extends Material{
    constructor(private n:number){super()}
    override Eval(scene: Scene, hit: Hit, origin: vec3): vec3 {
        let p = hit.p;
        let n = normalize(hit.n);
        let v = normalize(sub2(origin, p));
        let R0 = Math.pow((this.n -1)/(this.n+1),2)
        let R = R0 + (1-R0)*Math.pow((1-dot(v,n)),5);

        let r = normalize(reflect(minus(v),n));
        let ray = createRay(p, r);

        let c = scale(scene.TraceRay(ray),R);

        let I = vec3.fromValues(1,1,1);
        let ratio = this.n/1;
        if(hit.backface){
            //I = 
            //TODO ver o que fazer com o a^(o-p)
            ratio = 1/this.n;
        }
        //r = scale(normalize(minus(v),n),ratio)
        throw Error("Metodo de Refracao incompleto");
        
    }

}
export class TextureMaterial extends Material{
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    loaded=new BehaviorSubject<boolean>(false);
    loaded$ = this.loaded.asObservable();
    res = 500;
    data: Uint8ClampedArray;
    constructor(imagePath:string){ 
        super()
        this.image = new Image(this.res,this.res);
        this.image.onload = (()=>{
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this.canvas.getContext('2d')!.drawImage(this.image, 0, 0, this.image.width, this.image.height);
            this.data = this.canvas.getContext('2d')!.getImageData(0, 0, this.image.width, this.image.height).data;
            console.log("Load",this.data, this.canvas.getContext('2d')!.getImageData(1, 0, 2, 2).data);
            this.loaded.next(true);
        })
        this.image.src = imagePath;
    }
    async waitLoad()
    {
        return new Promise<boolean>(resolve=>{
            this.loaded$.pipe(filter(v=>v)).subscribe(()=>{
                resolve(true);
            })
        })
    }
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3
    {
        var colorIndices = getColorIndicesForCoord(Math.floor(hit.uv[0]*this.res), Math.floor(hit.uv[1]*this.res), this.canvas.width, true)
        const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;
        var [x,y,z] = [this.data[redIndex],this.data[greenIndex], this.data[blueIndex]];
        //var [x,y,z] = this.canvas.getContext('2d')!.getImageData(hit.uv[0]*this.res, hit.uv[1]*this.res, 1, 1).data;
        //console.log("Mark", colorIndices, x,y,z, hit.uv[0]*this.res, hit.uv[1]*this.res, this.canvas.width*this.canvas.height);
        //return [x,0,0];
        return scale([x,y,z],1/256)
        //return [pixelData.data];

    }
}