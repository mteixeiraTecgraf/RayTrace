import { mat3, mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Area, Box, Shape, Sphere } from "./Shapes";
import { add2, add3, calculateHitCode, createMat4, cross, debugSample, debugSample2, distance, dot, getTranslation, identity, inverse, length, max, min, minus, mul, mulMat, normalize, reflect, sampleBetween, sampleBetween2, scaleMat, setPixel, setVerbose, sub2, toVec3, toVec4, transpose, verbose, verbose2, verbose3 } from "./utils";
import * as utils from "./utils";
import { DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, DEFAULT_AREA_SAMPLE_COUNT, DEFAULT_LIGHT_SAMPLE_COUNT, DFIX, DMAX, FORCCE_HIT, FORCCE_HIT_MAT_CODE, FORCCE_HIT_OCL_MAT_CODE, FORCCE_HIT_ON_VERTEX, FORCCE_LIGHT_FACTOR, FORCCE_L_HIT, FORCCE_L_HIT_N, FORCCE_NORMAL, FORCCE_RAY_HIT_MAT_CODE, FORCCE_WI_MAT, LIGHT_FACTOR, LIMITS, PATH_TRACE, PONTUAL_LIGHT_RADIUS, RANDOM_SAMPLE, RENDER_BETA_LEN, RENDER_PDF, REPEAT_PX, SAMPLE_COUNT, TEST_BRUTE_FORCE, TRACE_RAY_RECURSION_MAX } from "./config";
import { Material, PhongMaterial } from "./Material";
import { AreaLight, Light, PontualLight } from "./Light";
import { Transform, scale } from "./Transform";
import { DEFAULTPROGRESS, Hit, EntityInstance, ProgressAction, Ray, createRay, LightInstance, EPSILON } from "./Primitive";
import { IntersectionTester } from "./Tester";
import { Camera, Film } from "./Film";
import { interval } from "rxjs";


export class Scene {
    ReportComputations() {
        console.log("Shape Count  ", this.instances.length)
        //console.log("Instances  ", this.instances)
        for (var i of this.instances) {
            console.log("Computation Shape  ", i.shape.computationCount)
        }
    }

    constructor(private Film: Film, public camera: Camera, public ambientLight: vec3) { }
    get W() { return this.Film.W }
    get H() { return this.Film.H }
    sample: vec2 = [0, 0,]
    get Sample() {
        return this.sample;
    }
    prepareScene() {
        this.tester.generateStructure();
    }
    Render(Context: CanvasRenderingContext2D, { progress }: { progress: ProgressAction } = { progress: DEFAULTPROGRESS }) {
        return this.RenderDefault(Context, { progress });
        //return this.RenderRandom(Context, {progress});
    }

    RenderRandom(Context: CanvasRenderingContext2D, { progress }: { progress: ProgressAction } = { progress: DEFAULTPROGRESS }) {
        var film = this.Film;
        for (let k = 0; k < 2000; k++) {
            //console.log(k);
            var [i, j] = film.GetPixelRadial(Math.random(), Math.random());
            //var [i,j] = film.GetPixelOne(Math.random(),Math.random());
            //console.log([i,j])
            var c: vec3 = [1, 0.5, 0.5]
            printPoint(i, j, c);

        }
        progress(this.W, this.W);
        //v = this.W;
        //s.unsubscribe();
        this.Film.RenderImage(Context);

        function printPoint(i: number, j: number, c: vec3) {
            var n = 2;
            if (i == 0) i = 1;
            if (j == 0) j = 1;
            if (i == film.W - 1) i = film.W - 2
            if (j == film.H - 1) j = film.H - 2
            for (let i1 = 0; i1 < n; i1++) {
                for (let j1 = 0; j1 < n; j1++) {
                    film.SetPixelValue(i + 1 - i1, j + 1 - j1, utils.scale(c, 1));
                }
            }
        }
    }
    RenderDefault(Context: CanvasRenderingContext2D, { progress }: { progress: ProgressAction } = { progress: DEFAULTPROGRESS }) {
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
        for (let i = 0; i < this.W; i++) {
            //v = i;
            progress(i, this.W);

            //continue;
            for (let j = 0; j < this.H; j++) {
                var c: vec3 = [0, 0, 0]
                for (let s = 0; s < count; s++) {
                    //1
                    var sample: vec2 = film.GetSample(i, j);
                    /*
                    var sample:vec2 = film.GetSampleOne(i,j);
                    if(Math.abs(Math.pow(sample[0],2)+Math.pow(sample[1],2)-1) < 0.005)
                        c = add2(c,[1,1,1]);
                    else if(Math.abs(Math.pow(sample[0],2)+Math.pow(sample[1],2)-0) < 0.0001)
                        c = add2(c,[1,1,1]);
                    else
                        c = add2(c,[1,0,0]);
                    continue;
                    */

                    this.sample = sample;

                    //2
                    var ray: Ray = this.camera.GenerateRay(sample);
                    (<any>ray)['sample'] = sample;
                    if (verbose2) console.log("Ray", i, j, ray)

                    //3
                    if(PATH_TRACE)
                        c = add2(c, this.TracePath(ray, DMAX));
                    else
                        c = add2(c,this.TraceRay(ray));
                    if (verbose2) console.log("Pixel", i, j, c)
                }
                film.SetPixelValue(i, j, utils.scale(c, 1 / count));

            }
        }
        progress(this.W, this.W);
        //v = this.W;
        //s.unsubscribe();
        this.Film.RenderImage(Context);

    }
    recursionCount = 0;
    TraceRay(ray: Ray): vec3 {
        if (this.recursionCount >= TRACE_RAY_RECURSION_MAX) return [0, 0, 0];
        this.recursionCount++;

        setVerbose(debugSample(this));
        let c = this._TraceRay(ray);

        setVerbose(false);
        this.recursionCount--;
        return c;
    }
    _TraceRay(ray: Ray): vec3 {
        //setVerbose(debugSample(this));
        var hitA = this.ComputeIntersection(ray);
        var hit = hitA ? hitA[0] : undefined;
        
        //setVerbose(false);
        if (hit) {
            if (DEBUG_TRACE_POINT && distance(hit?.p ?? [0, 0, 0], DEBUG_TRACE_POINT_COORDS) < 0.04) {
                console.log("Hit trace", ray, hit);
                return [0, 0, 1]
                //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
            }
            //console.log("Hit Some", hit);
            if (hit.light) {
                if (FORCCE_HIT_MAT_CODE && hit.instanceRef > 0) {
                    return <vec3>[0, 1, 1]
                    //return [(hit.instanceRef/4)%2,(hit.instanceRef/2)%2,hit.instanceRef%2]
                }
                var c: vec3 = [0, 0, 0];
                var r: number = hit.t;
                c = add2(this.ambientLight, utils.scale(hit.light.Potencia, 1 / r * r));
                //c = hit.light.Potencia;
                //c = scale(c,255)

                return c;
            }
            else if (hit.material) {
                if (this.beforeMatEvalCheck(hit)) return this.checkResult;

                if (verbose3) console.log("Hit Material", hit);
                var c = hit.material.Eval(this, hit, ray.origin);
                if (verbose3) console.log("Evaluated to ", c);

                if (this.afterMatEvalCheck(hit, ray)) return this.checkResult;
                //console.log("Hit Some ", c, hit);
                return c;
            }

        }

        if (false && sampleBetween(ray, LIMITS[0], LIMITS[1], LIMITS[2], LIMITS[3]))
            return [0, 0, 1];

        //console.log("Hit None");
        return [0, 0, 0];
        //return this.temp(ray);
    }

    TracePath(ray: Ray, dMax: number) {
        //dMax = 2;
        let L = utils.VECS.ZERO;
        let beta = utils.VECS.ONE;

        var previousPDF = 0;
        for (let i = 0; i < dMax; ++i) {
            let L_Step = utils.VECS.ZERO;
            if(debugSample(this))console.log("@MARK2::",this.sample,i, dMax,FORCCE_RAY_HIT_MAT_CODE,i)
            let hitA = this.ComputeIntersection(ray);
            var hit = hitA ? hitA[0] : undefined;
            if (this.beforeMatEvalCheck(hit, i)) return this.checkResult;
            if (!hit) {
                break;
            }

            let light = hit.light;
            if (light) {
                if (DFIX<=0 && i == 0) {
                    return light.Potencia;
                }
                else {
                    break;
                }
            }
            else {
                //return L;
                var c = false
                if (c)
                    return L;
                let mat = hit.material!;
                let p = hit.p;
                let n = normalize(hit.n)
                
                if(FORCCE_NORMAL)
                {
                    var r = n.map(v=>Math.abs(v)) as vec3;
                    return r;
                }
                //L = [0,0,0];
                var N = 1;
                for(var ns = 0 ; ns<N;ns++){

                    let Le = this.getLightRadiance(p, n)
                    if(this.hasResult)
                    {
                        return this.checkResult;
                    }
                    var calcBDRF = mat.BDRF(hit, ray.origin);
                    L_Step = add2(L_Step, mul(mul(Le, calcBDRF), beta))
                    if(utils.sqrLen(this.ambientLight)>0) L_Step = add2(L_Step,mul(this.ambientLight, calcBDRF));
                    if(RENDER_PDF && (i == DFIX))
                    {
                        if(previousPDF>0.6)
                        {
                            return <vec3>[previousPDF,0,0];
                        }
                        if(previousPDF>0.3)
                        {
                            return <vec3>[0,previousPDF+0.3,0];
                        }
                        return <vec3>[0,0,previousPDF+0.6];
                    }
                    if(RENDER_BETA_LEN && (i == DFIX))
                    {
                        const f = 1;
                        //return utils.scale(beta,1/f)
                        const subv = 1//3.5//1.9;
                        return utils.sub2(beta,utils.scale(utils.VECS.ONE,subv))
                    }
                    if(i==DFIX)
                    {
                        return L_Step;
                    }
                    L = DFIX<0 ? add2(L,L_Step):[0,0,0];
                    
                    if (i==DFIX && debugSample(this)) {
                        console.log("Trace", Le, L)
                        this.checkResult = [0, 0, 1];
                        return <vec3>[0,0,1];
                    }
                    //console.log("render",Le, mat.BDRF(), beta, L); 
                    //return L

                    var wig = normalize(this.GlobalToNormal(n,normalize(sub2(ray.origin,p))));
                    var sample = mat.getSample(wig)
                    var pdf = mat.GetPDF(sample)
                    previousPDF = pdf;
                    var wi = normalize(this.NormalToGlobal(n, sample.s))
                    //return sub2(sample.s.map(Math.abs) as vec3, [0,0,0]);
                    //return utils.scale(utils.VECS.ONE,dot(sample.s,[0,0,1])>0.5?0:dot(sample.s,[0,0,1]))
                    if(debugSample(this))console.log("@MARK2::wi gen",wig, n,sample, wi,beta)//    , this.GlobalToNormal([-1,0,0],[0,1,0]))
                    //var r = sample.s.map(v=>Math.abs(v)) as vec3;
                    //return r;
                
                    
                    beta = mul(beta, utils.scale(calcBDRF, Math.max(0, dot(n, wi) / pdf)))

                    ray = createRay(p, wi);

                }
            }
        }
        return L;
    }
    NormalToGlobal(n: vec3, sample: vec3): vec3 {
        var M = this.GenerateTransform(n);
        return utils.transform(M, sample)
    }
    GlobalToNormal(n: vec3, sample: vec3): vec3 {
        
        var M = this.GenerateTransform(n);
        var M2 = inverse(M);
        if(debugSample(this)) console.log("@MARK2::GlobalNormal",n, M, M2, sample);
        return utils.transform(M2, sample)
    }
    GenerateTransform(n: vec3)
    {
        n=normalize(n);
        var t: vec3 = [1, 0, 0]
        if (Math.abs(dot(t, n)) > 0.9) {
            t = [0, 1, 0]
        }
        var b = normalize(cross(n, t));
        t = cross(b, n)
        var M = createMat4(t, b, n, [0, 0, 0])
        if(debugSample(this)) console.log("@MARK2::GenerateTransform",t,b, n, M)
        return M;
    }
    getLightRadiance(p: vec3, n: vec3): vec3 {
        var nsamples = DEFAULT_LIGHT_SAMPLE_COUNT;
        if(false)
        {

            var c:vec3 = [0,0,0]
            this.lights.forEach(lp=>{
                //var light = l.light!
                var s = (lp.light as PontualLight).Position;
                var lpdf = 1;
                var pdf = 1;
                var ns = sub2(p, s)
                var ds = sub2(s, p)
                var d2 = utils.sqrLen(ds)
                var I = lp.light!.Intensidade;
                
                var wi = normalize(ds);
                
                var factor = max0(dot(n, wi)) * max0(dot(ns, minus(wi))) / (d2 * lpdf * pdf)
                c = add2(c,utils.scale(I, factor))
                
            })
        }
        else{

            //sorteia um sample de luz
            var c:vec3 = [0,0,0]
            //nsamples = 1;
            for(var sample=0;sample<nsamples;sample++)
            {
                
                var lp = this.getLightSample();
                if (lp) {
                    var { s, ns, pdf } = this.getSamplePoint(p, lp.light);
                    ns = normalize(ns);
                    //var rad = sample.Radiance(this, p, n);
                    var ds = sub2(s, p)
                    var wi = normalize(ds);
                    var factorNumerator = max0(dot(n, wi)) * max0(dot(ns, minus(wi)))
                    
                    /*
                    if(FORCCE_L_HIT)
                    {
                        var r2 = l.map(v=>Math.abs(v));
                        this.checkResult = add2(c1, <vec3>r2);
                        return true;
                    }*/
                    if(this.lightCheck(ns, wi, factorNumerator)){
                        return this.checkResult;
                    }
                    var ray = createRay(add2(p, utils.scale(n,EPSILON)), wi);
                    var hitA = this.ComputeIntersection(ray, true, true, true);
                    var hit = hitA ? hitA[0] : undefined;
                    if (hit?.t??1 > 0.0001)
                    {
                        //hit = hitA[1];
                    }
                    if (!hit  || (hit.t > 0.0001 &&(!hit!.light || (hit!.light != lp.light)))) {
                        //add2(c,[0, 0, 0])
                    if (debugSample(this)) {
                        console.log("LightRadiance hit", lp, c, ds, ray, hit, p, n, )
                        this.checkResult = [0, 0, 1];
                        return <vec3>[0,0,1];
                    }
                    }
                    else {
                        var d2 = utils.sqrLen(ds)
                        var I = lp.light.Intensidade;
                        var factor =  factorNumerator/ (d2 * lp.pdf * pdf)
                        c = add2(c,utils.scale(I, factor))
                        
                        if (debugSample(this)) {
                            console.log("LightRadiance", lp, c, ds, ray, hit, p, n, d2, I, factor, dot(n,wi), dot(ns,minus(wi)))
                            this.checkResult = [0, 0, 1];
                            return <vec3>[0,0,1];
                        }
                    }   
                    
                }
            }
            
        }
       return utils.scale(c,1/nsamples);
       
        function max0(v: number) {
            return Math.max(0, v);
        }
    }
        
        //verifica 
    //    throw new Error("Could not determine sample.");
    //}
    getSamplePoint(p: vec3, light: Light) {
        return light.getSamplePoint(p);
    }
    getLightSample(): { light: Light, pdf: number } {
        var n = Math.random()
        var pdfs: number[] = [];
        //console.log("some",this.lights.some(l=>(l.light instanceof PontualLight)))
        if (true || this.lights.some(l => (l.light instanceof PontualLight))) {
            var potencias = this.lights.map(l => utils.length(l.light?.Potencia!));
            var potenciaTotal = potencias.reduce((p, c) => p + c, 0);
            pdfs = potencias.map(p => p / potenciaTotal);
            //console.log("potencias",potencias)

            /*
            var cdf = 0;
            var lightE:EntityInstance|undefined;
            for(let i=0;i<this.lights.length; ++i)
            {
                lightE = this.lights[i];
                cdf+=utils.length(lightE.light?.Potencia!);
                if(cdf/potenciaTotal > n)
                {
                    return lightE.light;
                }
                //this.lights.map(l=>cdf+=utils.length(l.light?.Potencia!));
            }
            return lightE?.light;
            */
        }
        else {

            var areas = this.lights.map(l => l.light as AreaLight).map(l => l.Area);
            var areaTotal = areas.reduce((p, c) => p + c, 0);
            pdfs = areas.map(p => p / areaTotal);
            //console.log("areas",areas)


        }
        var cdf = 0;
        var cdfs = pdfs.map(v => { cdf += v; return cdf });
        var gts = cdfs.filter(v => v > n);
        var idx = cdfs.findIndex(v => v == gts[0]);
        //idx = 0;
        //console.log("Index",gts, idx, cdfs, this.lights, probs)
        return { light: this.lights[idx].light!, pdf: pdfs[idx] };
    }
    checkResult: vec3 = utils.VECS.ZERO
    hasResult = false;
    afterMatEvalCheck(hit: Hit, ray: Ray) {

        if (debugSample(this)) {
            console.log("Trace", ray, hit)
            this.checkResult = [0, 0, 1];
            return true;
        }

        if (true && sampleBetween(ray, LIMITS[0], LIMITS[1], LIMITS[2], LIMITS[3])) {

            this.checkResult = [0, 1, 0];
            return true;
        }
        return false;
    }
    beforeMatEvalCheck(hit: Hit|undefined, code = 0) {
        if (hit?.uv) {
            //return min([1,1,1],add2(scale([1,0,0],hit.uv[0]), scale([0,1,0],hit.uv[1])));
        }

        if (FORCCE_HIT) {
            this.checkResult = [1, 0, 0];
            return true;
        }
        if (FORCCE_HIT_ON_VERTEX && hit?.forceOnVertex) {

            this.checkResult = [1, 0, 0];
            return true
        }
        if (FORCCE_HIT_MAT_CODE && hit && hit.instanceRef > 0) {
            //return <vec3>[0,0,1]
            this.checkResult = calculateHitCode(hit.instanceRef)
            return true
        }
        if ((FORCCE_RAY_HIT_MAT_CODE==code) ) {
            if(hit && hit.instanceRef > 0)
                //this.checkResult = <vec3>[0,0,1]
                this.checkResult = calculateHitCode(hit.instanceRef)
            else
                this.checkResult = <vec3>[0,0,0]
            //return <vec3>[0,0,1]
            return true
        }
        return false;
    }
    lightCheck(ns:vec3, wi:vec3, factorNumerator:number){
        if(FORCCE_L_HIT_N)
        {
            this.hasResult = true;
            this.checkResult = utils.scale([1,0,0],dot(ns, minus(wi)))//.map(v=>Math.abs(v));
            return true;
        }
        if(FORCCE_LIGHT_FACTOR)
        {
            this.hasResult = true;
            wi = [1,0,0]
            
            this.checkResult =  utils.scale(wi,factorNumerator);
            return true;
        }
        if(FORCCE_WI_MAT)
        {
            this.hasResult = true;
            var r = wi.map(v=>Math.abs(v)) as vec3;
            this.checkResult =  r;
            return true;
        }
        return false;
    }
    AddAreaLight(light: AreaLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = 1;
        const position = light.Position;
        //const position:vec3 = [0,2,1]
        //var transform = Transform.fromVec(position,light.ArestaI,light.Arestaj);
        var transform = new Transform;
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({ name: "Luz de Area", light, shape: new Area(light.Position, light.ArestaI, light.Arestaj), transform });
    }

    AddPonctualLight(light: PontualLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = PONTUAL_LIGHT_RADIUS;
        const position = light.Position;
        //const position:vec3 = [0,2,1]
        var transform = Transform.fromScaleAndTranslation(position, scale, scale, scale);
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity({ name: "Luz Pontual", light, shape: new Sphere(), transform });


    }
    //lightSources:Light[]=[    ]
    materials: Material[] = [
        new PhongMaterial([1, 0, 0]),
        new PhongMaterial([0, 1, 0]),
        new PhongMaterial([0, 0, 1]),
        new PhongMaterial([1, 1, 1]),
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
    instances: EntityInstance[] = []
    get lights(): EntityInstance[] {
        return this.instances.filter(i => Boolean(i.light) == true)
    }

    //obj:{material:Material,shape:Shape}[] =[]
    ComputeIntersection(ray: Ray, ignoreNegative:boolean=true,ignoreBackface:boolean=true,ignoreEpslon:boolean = true): Hit[]  {
        if (verbose) console.log("Compute Intersections in Scene and ray", ray);
        const v2 = sampleBetween2(this.Sample, LIMITS[0], LIMITS[1], LIMITS[2], LIMITS[3]);
        //var t = Infinity;
        //var p: vec3 = [0, 0, 0];
        //var n: vec3 = [0, 0, 0];
        //var backface = false;
        //var material: Material = new PhongMaterial([0, 0, 0]);
        //var bestHit: Hit | undefined = undefined;
        var res = <Hit[]>[];
        /*
        var hit = this.root.box?.ComputeIntersection(ray);
        if(this.root.box && !hit)
        {
            return ;
        }
        */
        //console.group("Test")
        this.tester.ignoreBackface = ignoreBackface;
        this.tester.ignoreNegativeValues=ignoreNegative;
        this.tester.ignoreEpslon=ignoreEpslon;
        setVerbose(debugSample(this));
        var bestHit = this.tester.Test(ray);
        if (verbose) console.log("MARK2::bestHit", ray, bestHit);
        setVerbose(false);
        //console.groupEnd()
        //this.tester.Test()
        if (verbose3) console.log("Hit Object Final", bestHit);

        //if(bestHit)res.push(bestHit);
        return bestHit;
    }
    temp(ray: Ray): vec3 {

        var i = ray.origin[0] * this.W;
        var j = ray.origin[1] * this.H;
        if (i < (this.W / 2)) {

            if (j < (this.H / 2)) {
                //console.log("Teste", i);
                return [255, 0, 0];

            }
            else return [0, 255, 0];
        }

        else {
            if (j < (this.H / 2))
                return [0, 0, 255]
            else return [255, 255, 255];
        }
    }
    testCameraPixels() {

        for (var i = 0; i < this.W; ++i)
            for (var j = 0; j < this.H; ++j)
                console.log("Pixel", i, j, this.camera.GenerateRay([i / this.W, j / this.H]))

    }
}