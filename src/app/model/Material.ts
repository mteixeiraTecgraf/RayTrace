import { vec3 } from "gl-matrix";
import { BSDF, EPSILON, Hit, Interaction, createRay } from "./Primitive";
import { Scene } from "./Scene";
import { COLOR, VECS, abs, add2, calculateHitCode, debugSample, distance, dot, getColorIndicesForCoord, length, minus, mul, normalize, reflect, sampleBetween2, scale, setVerbose, sub2, verbose2, verbose3 } from "./utils";
import { Config } from "./config";
import { BehaviorSubject, Subject, filter } from "rxjs";
import { Sample, Sampler } from "./Sampler";

var { DEBUG_SAMPLE, DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, FORCCE_HIT_OCL_MAT_CODE, FORCCE_LI_HIT, FORCCE_LI_MAT, FORCCE_L_HIT, FORCCE_L_HIT_N, FORCE_HIDE_REFLECTION, FORCE_MIRROR_BDRF, IGNORE_MIRROR_BDRF, LIMITS, SHINESS } = Config;

export interface MaterialSample extends Sample{type:"Material"}
function createSample(s:vec3,pdf:number, n:vec3, wi:vec3):MaterialSample{return {s,pdf, n, wi, type:"Material"}}

function isMaterialSample(sample:{s: vec3,pdf:number}):sample is MaterialSample
{
    return Boolean(sample as MaterialSample)
}
export abstract class Material{
    sampler = new Sampler()
    constructor(public name:string = ""){}
    getSample(wi:vec3, n:vec3):MaterialSample {
        //var r = Math.sqrt(Math.random())
        //var theta = 2*Math.PI*Math.random();
        //return [r,theta, 1];
        var sample = this.sampler.getUnitaryHemisphere()
        //console.log(sample)
        //return {s:<vec3>[0,0,1],pdf:sample[2]/Math.PI}
        //return {s:sample,pdf:sample[2]/Math.PI}
        return createSample(sample, 1/(2*Math.PI), n, wi)
    }
    GetPDF(sample:Sample):number {
        if(isMaterialSample(sample))
        {
            return sample.pdf;
        }
        return sample.pdf;
    }
    abstract Eval(scene: Scene, hit: Hit, origin: vec3):vec3;
    IsTransparent(){
        return false;
    }
    BDRF(hit: Hit, origin: vec3):vec3
    {
        return VECS.ONE;
    }
    BRDF(wi:vec3, wo:vec3, hit:Hit):vec3
    {
        return VECS.ONE;
    }
    ComputeScatteringFunctions(interaction:Interaction):{specular:boolean}{
        var self=this;
        interaction.BSDF = new BasicBSDF(interaction);
        
        return {specular:false};        
    }
}
class BasicBSDF implements BSDF{
    sampler = new Sampler()
    constructor(protected interaction:Interaction){}
    cosFact(wi: vec3): number {
        return dot(this.interaction.n, wi)
    }
    sample(wi: vec3, n: vec3): MaterialSample {
        //var r = Math.sqrt(Math.random())
        //var theta = 2*Math.PI*Math.random();
        //return [r,theta, 1];
        var sample = this.sampler.getUnitaryHemisphere()
        //console.log(sample)
        //return {s:<vec3>[0,0,1],pdf:sample[2]/Math.PI}
        //return {s:sample,pdf:sample[2]/Math.PI}
        return createSample(sample, 1/(2*Math.PI), n, wi)
    }
    BRDF(wi: vec3, wo: vec3, hit: Hit): vec3 {
        return VECS.ONE;
    }
    
}
class DiffuseBasicBSDF extends BasicBSDF{
    constructor(interaction:Interaction, private color:vec3){super(interaction)}
    
    readonly factor = 1/Math.PI
    override BRDF(wi: vec3, wo: vec3, hit: Hit): vec3 {
        return scale(this.color, this.factor);
    }
}
export class PhongMaterial extends Material{
    constructor(private matColorDiff:vec3, private matColorSpec:vec3 = [0,0,0], private shiness:number = SHINESS, name:string=""){ super(name)}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3 {
        var v2 = sampleBetween2(scene.Sample, LIMITS[0],LIMITS[1],LIMITS[2],LIMITS[3])
        if( verbose2) 
            console.log("Evaluating material", scene.sample,v2);
        let c:vec3 = mul(scene.ambientLight, this.matColorDiff);
        let v:vec3 = normalize(sub2(origin, hit!.p))
        var n = normalize(hit!.n??[0,1,0]);
        
        if(Config.FORCCE_NORMAL) {
            var r = n.map(v=>Math.abs(v));
            //var r = n.map(v=>-(v));
            return <vec3>r;
        }
        
        scene.lights.forEach(instance=>{
            var ls = instance.light!;
            if(verbose2) console.log("Checking light", instance);
            if(debugSample(scene))
            {
                console.log("Sample ", DEBUG_SAMPLE, hit, origin)
            }
            var {li,l, hitCode} = ls.Radiance(scene, hit!.p, n)
            var ml = minus(l);
            var contrib = scale(mul(this.matColorDiff, li), Math.max(0, dot(l,n)));
            
            hitCode ??=0;
            
            if(verbose2) console.log("Radiance Calculated", li, l, hitCode);

            if(this.afterRadianceCalcCheck(hitCode,c,l,n,li)){
                c = this.checkResult;
                return;
            }
            
            add(contrib);

            var r = reflect(l, n);
            
            var c2 = scale(this.matColorSpec,Math.pow(Math.max(0,Math.min(dot(r,v), 1)), this.shiness));
            if(verbose3)console.log("shine", c2, c, r, v, dot(r,v), "L",l,ml, ls, n,hit);
            add(c2);
        }
        )
        return c;
        function add(color:vec3)
        {
            c = vec3.min([1,1,1], [1,1,1], add2(c, color));
        }
    }
    P: vec3;
    override ComputeScatteringFunctions(interaction: Interaction): { specular: boolean; } {
        var s = super.ComputeScatteringFunctions(interaction);
        
        interaction.BSDF = new DiffuseBasicBSDF(interaction, this.matColorDiff);
        return s;
    }

    
    readonly factor = 1/Math.PI
    override BDRF(hit: Hit, origin: vec3):vec3
    {
        return scale(this.matColorDiff, this.factor);
    }
    
    override BRDF(wi:vec3, wo:vec3, hit:Hit):vec3
    {
        let f = 1;
        return scale(this.BDRF(hit,add2(hit.p, wo)), f);
    }
    
    checkResult:vec3;
    afterRadianceCalcCheck(hitCode:number, c1:vec3, l:vec3, n:vec3, li:vec3){
        if(FORCCE_HIT_OCL_MAT_CODE)
        {
            if(hitCode && (hitCode>0) && (length(c1)<1))
            {
                this.checkResult = calculateHitCode(hitCode);
                return true;
            }
            return true;
        }
        if(FORCCE_L_HIT)
        {
            var r2 = l.map(v=>Math.abs(v));
            this.checkResult = add2(c1, <vec3>r2);
            return true;
        }
        if(FORCCE_L_HIT_N)
        {
            var r2 = scale([1,0,0],dot(l,n)).map(v=>Math.abs(v));
            this.checkResult = add2(c1, <vec3>r2);
            return true;
        }
        if(FORCCE_LI_HIT)
        {
            //console.log("Force Hit Mart C", c1, li);
            var r2 = li.map(v=>Math.abs(v));
            this.checkResult = add2(c1, <vec3>r2);
            return true;
        }
        if(FORCCE_LI_MAT)
        {
            var r2 = mul(this.matColorDiff, li).map(v=>Math.abs(v));
            this.checkResult = add2(c1, <vec3>r2);
            return true;
        }
        return false;
    }
}
class ReflectBSDF extends BasicBSDF{
    constructor(interaction:Interaction, private r0:number){super(interaction)}
    
    readonly factor = 1/Math.PI
    override cosFact(wi: vec3): number {
        return 1;
    }
    override sample(wi: vec3, n: vec3): MaterialSample {
        return createSample(normalize(reflect(wi,n)),this.r0, n, wi)
    }
    override BRDF(wi: vec3, wo: vec3, hit: Hit): vec3 {
        return VECS.ONE;
    }
}
export class PhongMetal extends Material{
    constructor(private phongMaterial:PhongMaterial, private r0:number, name:string=""){ super(name)}
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3
    {
        let p = hit.p;
        let n = normalize(hit.n);
        let v = normalize(sub2(origin, p));
        let R = this.r0 + (1-this.r0)*Math.pow((1-dot(v,n)),5);
        
        let c = scale(this.phongMaterial.Eval(scene, hit, origin), (1-R));
        let r = normalize(reflect((v), n));
        
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
    override BRDF(wi:vec3, wo:vec3, hit:Hit):vec3
    {
        if(IGNORE_MIRROR_BDRF)return this.phongMaterial.BRDF(wi,wo,hit)
        if(FORCE_MIRROR_BDRF) return this.BRDFMirror(wi,wo,hit)
        //if(FORCE_MIRROR_BDRF) return VECS.ZERO;
        return this.BRDFMaterial(wi, wo, hit)
    }
    override ComputeScatteringFunctions(interaction:Interaction):{specular:boolean}{

        var self = this;
        if(this.isSpecular2())
        {
            interaction.BSDF = new ReflectBSDF(interaction, this.r0);
            return {specular:true}
        }
        return this.phongMaterial.ComputeScatteringFunctions(interaction);        
    }

    override GetPDF(sample: { s: vec3; pdf: number; n:vec3, wi:vec3 }): number {
        if(isMaterialSample(sample))
        {
            return sample.pdf
        }
        else{
            return sample.pdf;
        }
    }
    
    isSpecular(wi:vec3,n:vec3){
        let R = this.r0 + (1-this.r0)*Math.pow((1-dot(wi,n)),5);
        var eps = this.sampler.get1D()
        return eps<R
    }
    isSpecular2(){
        if(IGNORE_MIRROR_BDRF) return false;
        if(FORCE_MIRROR_BDRF) return true;
        //let R = this.r0 + (1-this.r0)*Math.pow((1-dot(wi,n)),5);
        var eps = this.sampler.get1D()
        return eps<this.r0
    }
    
    getReflectSample(wi:vec3, n:vec3) {
        return createSample(normalize(reflect(wi,n)),this.r0, n, wi)
    }
    getMaterialSample(wi:vec3,n:vec3){
        
        let R = this.r0 + (1-this.r0)*Math.pow((1-dot(wi,n)),5);
        var eps = this.sampler.get1D()
        let ret = this.phongMaterial.getSample(wi,n)
        return createSample(ret.s,(1-this.r0)*ret.pdf,n,wi)
    }
    override getSample(wi:vec3, n:vec3) {
        if(IGNORE_MIRROR_BDRF) return this.phongMaterial.getSample(wi, n);
        
        let R = this.r0 + (1-this.r0)*Math.pow((1-dot(wi,n)),5);
        var eps = this.sampler.get1D()
        if(FORCE_MIRROR_BDRF)eps = 0;
        if(eps>R)
        {
            let ret = this.phongMaterial.getSample(wi,n)
            return createSample(ret.s,(1-R)*ret.pdf,n,wi)
        }
        else{
            //if(this.name=="latRed") console.log("wi,n",{wi,n, ref:reflect(wi,n)})
            return createSample(normalize(reflect(wi,n)),1, n, wi)
        }
        //return{s:normalize(reflect(wi,n)),pdf:1}
        return super.getSample(wi, n);
    }
    override BDRF(hit: Hit, origin: vec3):vec3
    {
        throw Error("Invalid Method")
        if(IGNORE_MIRROR_BDRF)return this.phongMaterial.BDRF(hit, origin)
        if(FORCE_MIRROR_BDRF) return VECS.ONE;
        //if(FORCE_MIRROR_BDRF) return VECS.ZERO;
        //return this.BRDFMaterial(hit, origin)
    }
    
    BRDFMirror(wi:vec3, wo:vec3, hit:Hit):vec3
    {
        return VECS.ONE
    }
    BRDFMaterial(wi:vec3, wo:vec3, hit:Hit):vec3
    {
        //if(FORCE_MIRROR_BDRF) return VECS.ZERO;
        //let p = hit.p;
        let n = normalize(hit.n);
        //let o = add2(p, wo);
        //let v = normalize(sub2(o, p));
        let v = wo;
        let R = this.r0 + (1-this.r0)*Math.pow((1-dot(v,n)),5);
        //r0 quanto eh refletido minimo
        //r0=1 espelho perfeito
        //paralelo v e n geram dot 1 fator 0 pow 0 (1-r0) 0 e sobra R=r0(reflete menos)
        //perpend  v e n geram dot 0 fotor 1 pow 1a5(1-r0)1 e sobra R=1(reflete tudo)
        //R=1 remove totalmente a parte difusa, somente reflexo
        //R=r0 remove parcialmente a parte difusa
        //paralelo      R=r0 menos reflexo
        //perpendicular R=1 somente reflexo
        //return scale(this.phongMaterial.BDRF(hit, origin), (1-R)) ;
        return scale(this.phongMaterial.BRDF(wi,wo,hit), (1-R)) ;
    }
}


class RefractBSDF extends BasicBSDF{
    constructor(interaction:Interaction, private n:number, private a:vec3 = [1,0.7,0.7]){super(interaction)}
    
    readonly factor = 1/Math.PI
    override cosFact(wi: vec3): number {
        return 1;
    }
    get index(){
        return Math.pow((this.n-1)/(this.n+1),2)
    }
    get R(){
        return 
    }
    entering(wi: vec3, n: vec3){
        //let cosTheta = dot(wi,n);
        //return cosTheta>0;
        return !this.interaction.hit.backface;
    }
    ratio(wi: vec3, n: vec3){
        if(this.entering(wi,n))
        {
            
            //console.log("Not", {wi, n, bs:this});
            return 1/this.n
        }
        //console.log("Not Entering", wi, n);
        return this.n/1
    }
    override sample(wi: vec3, n: vec3): MaterialSample {
        let t = this.refract(wi,n, this.ratio(wi,n));
        if(length(t)<EPSILON) {
            console.log("Error", {wi, n})
            t=[0,0,1]
        }
        return createSample(normalize(t),1-this.index, n, wi)
    }
    refract(wi:vec3,n:vec3, ratio:number)
    {
        let d = minus(wi);
        let cosTheta = dot(d,n);
        let cosTheta2 = Math.pow(cosTheta,2);
        let radixB = 1-Math.pow(ratio,2)*(1-cosTheta2)
        if(radixB<0) return VECS.ZERO;
        let cosPhi = Math.sqrt(radixB)
        let t1a = add2(d, scale(n,cosTheta))
        let t1 = scale(t1a,ratio)
        let t2 = scale(n, cosPhi)
        let t = sub2(t1,t2);
        //console.log("Refract", {wi, n, ratio})
        return t;
    }
    temp(){
        
        let I = vec3.fromValues(1,1,1);
        let ratio = this.n/1;

        //var entering = wi[2]>0 ;
        var entering = !this.interaction.hit.backface;
        if(entering){
        }
        else{
            ratio = 1/this.n;
            I = [0.5,0.5,0.5]
        }
    }
    override BRDF(wi: vec3, wo: vec3, hit: Hit): vec3 {
        //console.log("BRDF", {wi, wo,hit, bs:this});
        return hit.backface?this.a:scale(VECS.ONE, 0.1);
    }
}
//TODO Revisar Refracao
export class PhongDieletrics extends Material{
    constructor(private n:number, name:string){ 
        super(name); 
        //this.n = 1
        
        console.log("Dieletrics", {n,name})
    }
    override Eval(scene: Scene, hit: Hit, origin: vec3): vec3 {
        let p = hit.p;
        let n = normalize(hit.n);
        let v = normalize(sub2(origin, p));
        let R0 = Math.pow((this.n -1)/(this.n+1),2)
        let R = R0 + (1-R0)*Math.pow((1-dot(v,n)),5);
        let r = normalize(reflect(minus(v),n));
        let ray = createRay(p, r);
        
        //console.log("Calculate Reflext Part ");
        let oldv = verbose3
        let c = COLOR.BLACK//scale(scene.TraceRay(ray),R);
        setVerbose(oldv);


        let I = vec3.fromValues(1,1,1);
        let ratio = this.n/1;
        if(hit.backface){
            console.log("Hit Back face");
            //I = 
            //TODO ver o que fazer com o a^(o-p)
        }
        else{
            //console.log("Hit Front face");
            ratio = 1/this.n;
            //do nothing
        }
        let ref = this.refract(minus(v),n!, ratio);
        if(verbose3)console.log("Refract Factor ", ref);
        //return COLOR.RED;
        if(ref)
        {

            r = normalize(ref!)
            //return r;
            ray = createRay(p, r)
            let rf = 1-R;
            console.group("Reflect")
            if(verbose3)console.log("Trace Ray Scene ", ray);
            let cR = scene.TraceRay(ray)
            if(verbose3)console.log("Refract cR ", cR);
            console.groupEnd()
            return cR;
            c = add2(c,scale(cR, rf))
        }
        return mul(I, c)
        
    }
    override IsTransparent(){
        return true
    }
    override BDRF(hit: Hit, origin: vec3):vec3
    {
        return VECS.ONE;
    }

    refract(d:vec3, n:vec3, ratio:number){
        let minDN = dot(minus(d),n);
        let b = scale(add2(d, scale(n,minDN)),ratio)
        let r1 = (Math.pow(ratio,2) * (1-Math.pow(minDN,2)))
        let radic = 1-r1
        if(verbose3)console.log("Refract ", d,n, ratio, minDN,(ratio^2),  (1-Math.pow(minDN,2)), b, radic);
        if(verbose3)console.log("refract:minD ", minDN);
        if(verbose3)console.log("refract:minD2 ", minDN*minDN);
        if(verbose3)console.log("refract:3 ", 1-Math.pow(minDN,2));
        if(verbose3)console.log("refract:4 ", r1);
        if(radic<0)
            return //vec3.fromValues(0,0,0) 
        let nctheta = scale(minus(n),Math.sqrt(radic))
        let t = sub2(b,nctheta)
        return t;

        /*
        t =
η(dˆ + nˆ cos θ)
ηt
− nˆ cos φ =
η(dˆ + nˆ (−dˆ · nˆ))
ηt
− nˆ
s
1 −
η
2(1 − (−dˆ · nˆ)
2)
η
2
t
        */
    }

    get index(){
        return Math.pow((this.n-1)/(this.n+1),2)
    }
    isRefract(){
        if(IGNORE_MIRROR_BDRF) return false;
        if(FORCE_MIRROR_BDRF) return true;
        //let R = this.r0 + (1-this.r0)*Math.pow((1-dot(wi,n)),5);
        let R = this.index;
        var eps = this.sampler.get1D()
        //return eps>R;
        return true;
    }
    override ComputeScatteringFunctions(interaction:Interaction):{specular:boolean}{

        var self = this;
        
        //console.log("Dieletrics", {interaction})
        if(this.isRefract())
        {   
            interaction.BSDF = new RefractBSDF(interaction, this.n);
            //console.log("Dieletrics", {interaction})
            return {specular:!interaction.hit.backface}
        }
        else
        {
            interaction.BSDF = new ReflectBSDF(interaction, this.index);
        }
        //return this.phongMaterial.ComputeScatteringFunctions(interaction);        

        return {specular:true}
    }

}
export class TextureMaterial extends Material{
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    loaded=new BehaviorSubject<boolean>(false);
    loaded$ = this.loaded.asObservable();
    res = 500;
    data: Uint8ClampedArray;
    constructor(imagePath:string, name:string){ 
        super(name)
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
    
    override BDRF(hit: Hit, origin: vec3):vec3
    {
        let colorIndices = getColorIndicesForCoord(Math.floor(hit.uv[0]*this.res), Math.floor(hit.uv[1]*this.res), this.canvas.width, true)
        const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;
        let [x,y,z] = [this.data[redIndex],this.data[greenIndex], this.data[blueIndex]];
        return scale([x,y,z],1/256);
    }
    Eval(scene: Scene, hit: Hit, origin: vec3):vec3
    {
        let colorIndices = getColorIndicesForCoord(Math.floor(hit.uv[0]*this.res), Math.floor(hit.uv[1]*this.res), this.canvas.width, true)
        const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;
        let [x,y,z] = [this.data[redIndex],this.data[greenIndex], this.data[blueIndex]];
        //var [x,y,z] = this.canvas.getContext('2d')!.getImageData(hit.uv[0]*this.res, hit.uv[1]*this.res, 1, 1).data;
        //console.log("Mark", colorIndices, x,y,z, hit.uv[0]*this.res, hit.uv[1]*this.res, this.canvas.width*this.canvas.height);
        //return [x,0,0];
        return scale([x,y,z],1/256)
        //return [pixelData.data];

    }
}