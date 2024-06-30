import { mat3, mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Area, Box, Shape, Sphere } from "./Shapes";
import { add2, add3, calculateHitCode, createMat4, cross, debugSample, debugSample2, distance, dot, getTranslation, identity, inverse, length, max, min, minus, mul, mulMat, normalize, reflect, sampleBetween, sampleBetween2, scaleMat, setPixel, setVerbose, sub2, toVec3, toVec4, transpose, verbose, verbose2, verbose3 } from "./utils";
import * as utils from "./utils";
import { DEBUG_CONTEXT, DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, DEFAULT_AREA_SAMPLE_COUNT, DEFAULT_LIGHT_SAMPLE_COUNT, DFIX, DMAX, FORCCE_HIT, FORCCE_HIT_MAT_CODE, FORCCE_HIT_ON_VERTEX, FORCCE_LIGHT_FACTOR, FORCCE_L_HIT, FORCCE_L_HIT_N, FORCCE_MISS_DIRECTION, FORCCE_NORMAL, FORCCE_RAY_HIT_MAT_CODE, FORCCE_WI_MAT, FORCE_END_COLORS, LIGHT_FACTOR, LIMITS, NO_BETA_DECAY, PATH_PIPE, PATH_TRACE, PONTUAL_LIGHT_RADIUS, RANDOM_SAMPLE, RENDER_BETA_LEN, RENDER_PDF, REPEAT_PX, SAMPLE_COUNT, TEST_BRUTE_FORCE, TRACE_RAY_RECURSION_MAX } from "./config";
import * as Config from "./config";
import { Material, PhongMaterial } from "./Material";
import { AreaLight, Light, LightSample, PontualLight } from "./Light";
import { Transform, scale } from "./Transform";
import { DEFAULTPROGRESS, Hit, EntityInstance, ProgressAction, Ray, createPrimitive, createTPrimitive, Interaction, EPSILON } from "./Primitive";
import { IntersectionTester } from "./Tester";
import { Camera, Film } from "./Film";
import { interval } from "rxjs";
import { GPU } from "gpu.js";
import { Semaphore } from "./Semaphore";
import { Sampler } from "./Sampler";


export class Scene {
    ReportComputations() {
        console.log("Shape Count  ", this.instances.length)
        //console.log("Instances  ", this.instances)
        for (var i of this.instances) {
            console.log("Computation Shape  ", i.shape.computationCount)
        }
    }

    constructor(public Film: Film, public camera: Camera, public ambientLight: vec3) { }
    get W() { return this.Film.W }
    get H() { return this.Film.H }
    sample: vec2 = [0, 0,]
    get Sample() {
        return this.sample;
    }
    prepareScene() {
        this.tester.generateStructure();
    }
    Render({ progress }: { progress: ProgressAction } = { progress: DEFAULTPROGRESS }) {
        if(PATH_PIPE)
        {
            return this.pipelineRender({ progress });
        }
        else
        {
            return this.RenderDefault({ progress });
        }
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
        this.Film.RenderImageInContext(Context);

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
    RenderDefault({ progress }: { progress: ProgressAction } = { progress: DEFAULTPROGRESS }) {
        const film = this.Film
        const count = film.sampleCount;
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
       var rays = []
        for (let i = 0; i < this.W; i++) {
            //v = i;
            progress(i, this.W);

            //continue;
            for (let j = 0; j < this.H; j++) {
                let cs: vec3[] = Array(film.DataLength).fill([0,0,0]).map((_,idx)=>utils.scale(film.GetPixelValue(i,j,idx),film.currentCount));
                for (let s = film.currentCount; s < count; s++) {
                    //film.currentCount =
                    //if(film.currentCount>0)console.log("CS3", {i,j})
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
                    rays.push(ray);
                    (<any>ray)['sample'] = sample;
                    if (verbose2) console.log("Ray", i, j, ray)

                    //3
                    if(PATH_TRACE)
                    {
                        let testpx = false,ci=7*2,cj=15*2
                        if(testpx&&i==ci&&j==cj) setVerbose(true)
                        var pathRes = this.TracePath(ray, DMAX)
                        setVerbose(false)
                        //console.log(pathRes)
                        if(testpx&&i==ci&&j==cj)console.log("MARK2::CS",{cs:cs.map(v=>{return <vec3>{...v}}), count:film.currentCount, sc:film.sampleCount});
                        cs[0] = add2(cs[0], pathRes.L);
                        if(testpx&&i==ci&&j==cj)console.log("MARK2::CS2",{cs:cs.map(v=>{return <vec3>{...v}}), count:film.currentCount, sc:film.sampleCount, L:pathRes.L});
                        for(let q=1;q<cs.length;q++)
                        {
                            //cs[q]??=[0,0,0]
                            cs[q] = add2(cs[q], pathRes.Lp[q-1]??[0,0,0])
                        } 
                    }
                    else
                        cs[0] = add2(cs[0],this.TraceRay(ray));
                    if (verbose2) console.log("Pixel", i, j, cs[0])
                }
                //if(j==150)cs[0]=[0,0,1]
                cs.forEach((c,i2)=>{film.SetPixelValue(i, j, utils.scale(c, 1 / count),i2);})

            }
        }
        console.log("Rays", rays);
        progress(this.W, this.W);
        //v = this.W;
        //s.unsubscribe();
        
        
        this.Film.RenderImage();

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
        var interaction = hitA ? hitA[0] : undefined;
        var hit = interaction?.hit
        
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
                if (this.beforeMatEvalCheck(interaction)) return this.checkResult;

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

    sampler:Sampler = new Sampler();
    TracePath(ray: Ray, dMax: number) {
        //dMax = 2;
        let L = utils.VECS.ZERO;
        let Lp:vec3[] = [];
        let Hits:Interaction[] = [];
        let Rays:Ray[] = [];
        let beta = utils.VECS.ONE;

        let q = 0.5;
        let previousPDF = 0;
        let specular = false;
        for ( let i = 0; i<10;i++) {
            
            let L_Step = utils.VECS.ZERO;
            if(debugSample(this))console.log("TracePath",this.sample,i, dMax,FORCCE_RAY_HIT_MAT_CODE,i)
            Rays.push(ray);
            let interactions = this.ComputeIntersection(ray, true, !specular);
            setVerbose(false);
            //if(i==0)return L;
            var interaction = interactions ? interactions[0] : undefined;
            if (this.beforeMatEvalCheck(interaction, i)) return {L:this.checkResult,Lp};
            if (!interaction) {
                //Lp.push(utils.VecAbs(ray.origin));
                if(true)Lp.push(utils.COLOR.BLUE);
                if(FORCE_END_COLORS)Lp.push(utils.VecMap(ray.origin,[-2,-0,0],[2,2,3]));
                if(FORCE_END_COLORS)if(i==2&&ray.origin[0]>2)console.log("No Interaction", {ray,Lp, Hits,Rays})
                if(FORCE_END_COLORS)Lp.push(utils.VecMap(ray.direction, [-1,-1,-1],[1,1,1]));
                //{L:utils.VecMap(p,[-2,-0,0],[2,2,3]),Lp}
                //Lp.push(utils.scale(utils.VECS.ONE, ray.origin[0]/2));
                break;
            }
            let hit = interaction.hit;
            let light = interaction.hit.light;
            //if(hit&&i==0)Lp.push(utils.VecMap(hit.p,[-2,-0,0],[2,2,3]))
            Hits.push(interaction);
            if (light) {
                if (DFIX<=0 && (i == 0 || specular)) {
                    Lp.push(light.Potencia);
                    if(false)Lp.push(utils.COLOR.BLACK);
                    //if(i > 0) console.log("Luz")
                    return {L: light.Potencia, Lp};
                }
                else {
                    if(FORCE_END_COLORS)Lp.push(utils.COLOR.RED);

                    break;
                }
            }
            else {
                //return L;
                var c = false
                if (c)
                    return {L, Lp};
                let mat = interaction.primitive.material!;
                let p = interaction.p;
                let n = normalize(interaction.n)

                
                //L = [0,0,0];
                var N = 1;
                //for(var ns = 0 ; ns<N;ns++){

                    //let Le = this.getLightRadiance(hit, ray, mat)
                    var lightSamples = this.getLightSamples()
                    //console.log(lightSamples);
                    var Le = this.getLightRadianceFromSamples(lightSamples, interaction,ray, mat);
                    if(this.hasResult)
                    {
                        L= this.checkResult;
                        return {L, Lp}
                    }
                

                    var sp = interaction.ComputeScatteringFunctions(ray);

                    let wo = normalize(sub2(ray.origin,p))
                    var wol = normalize(this.GlobalToNormal(n,wo));
                    var sample = interaction.BSDF.sample(wol, [0,0,1])
                    var pdf = mat.GetPDF(sample)
                    previousPDF = pdf;
                    var wi = normalize(this.NormalToGlobal(n, sample.s))
                    //if(mat.name=="latRed")  console.log("wi,n",{wi,n, ref:reflect(wi,n), sample, wo, wol}) 

                    
                    specular = sp.specular;
                    let cosFact = interaction.BSDF.cosFact(wi);


                    //var calcBDRF = mat.BDRF(hit, ray.origin);
                    var calcBDRF = interaction.BSDF.BRDF(wi,wo, hit);
                    //if(hit.material?.name== "Sphere"&& hit.backface) console.log("HitSphere", {interaction,sp, calcBDRF, beta, Le, i})
                    if(!specular)
                    {
                        L_Step = add2(L_Step, mul(mul(Le, calcBDRF), beta))
                    }
                    if(false) L_Step = utils.VECS.ONE
                    if(false) L_Step = utils.VecAbs(normalize(wi))
                    if(false) L_Step = utils.VecAbs(utils.scale(utils.VECS.ONE,p[1]/4))
                    if(false) L_Step = utils.VecAbs(beta)
                    if(false) L_Step = hit.backface?[1,0,0]:[0,1,0]
                    if(false) L_Step = specular?[1,0,0]:[0,1,0]


                    
                    //TEMP TEST RETURNS
                    {
                      
                        if(RENDER_PDF && (i == DFIX))
                        {
                            if(previousPDF>0.6)
                            {
                                L= <vec3>[previousPDF,0,0];
                                return {L, Lp}
                            }
                            if(previousPDF>0.3)
                            {
                                L= <vec3>[0,previousPDF+0.3,0];
                                return {L, Lp}
                            }
                            L= <vec3>[0,0,previousPDF+0.6];
                            return {L, Lp}
                        }
                        if(RENDER_BETA_LEN && (i == DFIX))
                        {
                            const f = 1;
                            //return utils.scale(beta,1/f)
                            const subv = 1//3.5//1.9;
                            L= utils.sub2(beta,utils.scale(utils.VECS.ONE,subv))
                            return {L, Lp}
                        }
                        if(i==DFIX)
                        {
                            L= L_Step;
                            return {L, Lp}
                        }
                        
                    }

                    if(utils.sqrLen(this.ambientLight)>0) L_Step = add2(L_Step,mul(this.ambientLight, calcBDRF));
                    L = DFIX<0 ? add2(L,L_Step):[0,0,0];
                    {
                        if (i==DFIX && debugSample(this)) {
                            console.log("Trace", Le, L)
                            this.checkResult = [0, 0, 1];
                            L= <vec3>[0,0,1];
                            return {L, Lp}
                        }
                    
                        //return sub2(sample.s.map(Math.abs) as vec3, [0,0,0]);
                        //return utils.scale(utils.VECS.ONE,dot(sample.s,[0,0,1])>0.5?0:dot(sample.s,[0,0,1]))
                        if(debugSample(this))console.log("wi gen",wol, n,sample, wi,beta)//    , this.GlobalToNormal([-1,0,0],[0,1,0]))
                        //var r = sample.s.map(v=>Math.abs(v)) as vec3;
                        //return r;
                        
                    }
                    beta = mul(beta, utils.scale(calcBDRF, Math.max(0, cosFact / pdf)))

                    //Code for Russian Roulette Calculation
                    let prob1 = Math.max(...beta);
                    let prob =prob1
                    //if(hit.material?.name== "Sphere"&&i==1 && hit.backface) console.log("HitSphere2", {interaction,sp, calcBDRF, beta, Le})

                    if(false) L_Step = prob>0.5?[1,0,0]:[0,1,0];
                    //prob /= i>3?2:prob;
                    //prob = i>2?prob:1
                    if(!specular&& (this.sampler.get1D() < prob) && !NO_BETA_DECAY)
                    {

                        //Lp.push(utils.COLOR.RED);
                        if(false) Lp.push(Math.random()<0.4/(10-i)?utils.COLOR.RED:utils.COLOR.RED)
                        if(false) Lp.push(utils.VecAbs(beta))
                        if(false) Lp.push(utils.VecAbs(calcBDRF))
                        if(false) Lp.push(utils.VECS.create(pdf))
                        if(false) Lp.push(utils.VECS.create(cosFact))
                        break;
                    }
                    //if(i>7) break;
                    if(prob<EPSILON)
                    {
                        if(false) Lp.push(utils.COLOR.GREEN)
                        if(false) Lp.push(utils.VecAbs(beta))
                        if(false) Lp.push(utils.VecAbs(calcBDRF))
                        if(false) Lp.push(utils.VECS.create(pdf))
                        if(false) Lp.push(utils.VECS.create(cosFact))
                        //Lp.push(utils.COLOR.BLUE);
                        break;
                    }
                    beta = utils.scale(beta,1/prob);
                    if(NO_BETA_DECAY) beta = utils.VECS.ONE;
                    ray = interaction.SpawnRayToDirection(wi);
                    if(false) L_Step = utils.VecAbs(normalize(ray.direction))
                    if(false) L_Step = utils.COLOR.RED
                    Lp.push(L_Step)
                    //return {L:utils.scale(utils.VECS.ONE,p[0]+2), Lp}
                    //return {L:utils.VecMap(p,[-2,-0,0],[2,2,3]),Lp}

                //}
            }
        }
        return {L, Lp};
    }

    testKernel(){
        const gpu = new GPU();
        const F = false;
        var c = function(v:boolean){return v?1:0};
        const kernel = gpu.createKernel(function(v) {
            const i = Math.random()>0.5;
            if (i) return 1;
            return 0;
          }).setOutput([100]);

        const kernel2 = gpu.createKernel(c).setOutput([100]);

          
        var out = kernel2(true);
        console.log("Kernel", out)
    }
    async pipelineRender({ progress }: { progress: ProgressAction } = { progress: DEFAULTPROGRESS })
    {
        console.log("PreKernel")
        this.testKernel()
        console.log("PostKernel")
        
        const film = this.Film
        const count = film.sampleCount
        //return;
        this.initProm()
       const samples:vec2[] = []
        for (let i = 0; i < this.W; i++) {
            //v = i;

            //continue;
            for (let j = 0; j < this.H; j++) {
                var c: vec3 = [0, 0, 0]
                for (let s = 0; s < count; s++) {
                    //1
                    var sample: vec2 = film.GetSample(i, j);
                    samples.push(sample);
                }
            }
        }
        console.log("SamplesGenerated", samples.length)
        // var rays = samples.map(
        //     sample=>this.camera.GenerateRay(sample)
        // )
        //this.ComputeIntersectionList(rays);
        //return;
        var out = await this.pipelineRenderProcessor(samples,
            
            //Ray Generation Function
            (s:number, context:PipelineContext)=>{context.sample=samples[s];return this.camera.GenerateRay(context.sample)},
            
            //Intersection Callback
            async (ray:Ray, context:PipelineContext)=>{
                //console.log("Intersection");
                let cxt = Config.DEBUG_CONTEXT?{}:undefined;
                var hits = this.ComputeIntersection(ray,true,true, true, cxt);
                context.testContext =cxt
                //await this.Sync(samples.length);
                return hits;
            },

            //On Ray Hit
            (intr:Interaction, context:PipelineContext)=>{  
                let hit = intr.hit!
                let L_Step:vec3=[0,0,0]   
                //console.log("hit", context.i);   
                if(context.i%8000==0) console.log("Step Context", context.pathIndex, context.i)
                if (this.beforeMatEvalCheck(intr, context.pathIndex, context)) return context.checkResult;
                if(hit && hit.p[2]<-0 && hit.material && hit.material.name=='floor')
                {
                    console.log("Computing Hit Context", {hit, context})
                }                        
                let light = hit.light;
                if (light) {
                    if (DFIX<=0 && context.pathIndex == 0) {
                        context.stop = true;
                        return light.Potencia;
                    }
                    else {
                        context.stop = true;
                        return utils.VECS.ZERO;
                    }
                }
                else{
                    
                    let mat = hit.material!;
                    if(!mat)
                    {
                        console.log("Material Inconsistent", mat, hit, context);
                        return L_Step;
                    }
                    let interaction = intr;
                    let p = hit.p;
                    let n = normalize(hit.n)
                    let Le = this.getLightRadiance(hit, context.ray,mat)
                    if(this.hasResult)
                    {
                        return this.checkResult;
                    }
                    let calcBDRF = mat.BDRF(hit, context.ray.origin);
                    L_Step = add2(L_Step, mul(mul(Le, calcBDRF), context.beta))
                    if(utils.sqrLen(this.ambientLight)>0) L_Step = add2(L_Step,mul(this.ambientLight, calcBDRF));
                    if(RENDER_PDF && (context.pathIndex == DFIX))
                    {
                        if(context.previousPDF>0.6)
                        {
                            return <vec3>[context.previousPDF,0,0];
                        }
                        if(context.previousPDF>0.3)
                        {
                            return <vec3>[0,context.previousPDF+0.3,0];
                        }
                        return <vec3>[0,0,context.previousPDF+0.6];
                    }
                    if(RENDER_BETA_LEN && (context.pathIndex == DFIX))
                    {
                        const f = 1;
                        //return utils.scale(beta,1/f)
                        const subv = 1//3.5//1.9;
                        return utils.sub2(context.beta,utils.scale(utils.VECS.ONE,subv))
                    }
                    if(context.pathIndex==DFIX)
                    {
                        /*
                        if( utils.closeTo(context.sample[0],0.1,0.005)){
                            console.log("radiance", {context, Le, L_Step, DFIX, hit, sample:context.sample, result:this.hasResult});
                            return [0,0,1];
                        }
                        */
                        return L_Step;
                       if(false && length(L_Step)<0.2 && context.hits[0][0].instanceRef==5)
                       {
                        console.log("radiance", {context, Le, L_Step, DFIX, hit, sample:context.sample, result:this.hasResult});
                        return L_Step;
                       }
                       //return utils.VECS.ONE;
                    }
                    let L = DFIX<0 ? add2(context.L,L_Step):[0,0,0];
                    
                    if(true && utils.closeTo(context.sample[0],0.1,0.005) && context.hits[0][0].instanceRef==5)
                       {
                        //console.log("radiance", {context, Le, L_Step, DFIX, hit, sample:context.sample, result:this.hasResult});
                        //return L_Step;
                       }
                    if (context.pathIndex==DFIX && debugSample(context)) {
                        console.log("Trace", Le, context.L)
                        this.checkResult = [0, 0, 1];
                        return <vec3>[0,0,1];
                    }
                    //console.log("render",Le, mat.BDRF(), beta, L); 
                    //if(1==1)return L

                    let wig = normalize(this.GlobalToNormal(n,normalize(sub2(context.ray.origin,p))));
                    let sample = mat.getSample(wig, n)
                    let pdf = mat.GetPDF(sample)
                    context.previousPDF = pdf;
                    let wi = normalize(this.NormalToGlobal(n, sample.s))
                    //return sub2(sample.s.map(Math.abs) as vec3, [0,0,0]);
                    //return utils.scale(utils.VECS.ONE,dot(sample.s,[0,0,1])>0.5?0:dot(sample.s,[0,0,1]))
                    if(debugSample(context))console.log("wi gen",wig, n,sample, wi,context.beta)//    , this.GlobalToNormal([-1,0,0],[0,1,0]))
                    //var r = sample.s.map(v=>Math.abs(v)) as vec3;
                    context.beta = min(mul(context.beta, utils.scale(calcBDRF, Math.max(0, dot(n, wi) / pdf))),utils.scale(utils.VECS.ONE,0.7))
                    
                    context.ray = interaction.SpawnRayToDirection(wi);
                    return L;
                }
            },
            
            //On Ray Miss
            (context:PipelineContext)=>{
                console.log("Miss", context);
                if(FORCCE_MISS_DIRECTION) 
                {
                    var ray = context.ray
                    var r = <vec3>[...ray.direction.map(v=>Math.abs(v))]
                    context.L = r;
                }
                context.stop=true
                return context.L
            }
            )

            
        console.log("Rays Processed", out)
        for (let i = 0; i < this.W; i++) {
            progress(i, this.W);
            for (let j = 0; j < this.H; j++) {
                var c: vec3 = [0, 0, 0]
                for (let s = 0; s < count; s++) {
                    //console.log("Add", i, j, s);
                    c = add2(c,out[((i*this.H*count)+(j*count) + s)]);
                }
                film.SetPixelValue(i, j, utils.scale(c, 1 / count));
            }
        }
        console.log("Pixels Filled")
        progress(this.W, this.W);
        this.Film.RenderImage();
        console.log("Image Rendered")
    }
    count = 0;
    prom:Promise<void>;
    ready:()=>void
    initProm(){
        this.count = 0;
        this.prom = new Promise((resolve,reject)=>{
            this.ready = ()=>{
                resolve();
            };
            return ;
        });
    }
    incCount(){
        //console.log("inc", this.count)
        this.count+=1;
        return this.count;

    }
    Sync(max:number) {
        var self = this;
        return new Promise<void>((resolve, reject) => {
            call();

           async function call(){
                let v = await self.semaphore.callFunction(async ()=>self.incCount());
                self.prom.then(resolve)
                //console.log("Sync", v, max)
                if(v==max) 
                {
                    self.ready();
                    self.initProm();
                }
           }
        });
    }
    
    async pipelineRenderProcessor(samples:vec2[], generateRay:Function,
        ComputeIntersection:Function,
       onRayHit:Function, onRayMiss:Function,
       //getLightRadiance:Function
       )
    {
    
        var out=Array<vec3>(samples.length).fill([0,0,0]);
        var promises  = []
        for(let i = 0;i<samples.length;++i)
        {
            //console.log("Sample", i)
            var p = this.pipelineRenderBase(i, 
                generateRay,
                ComputeIntersection,
                onRayHit,
                onRayMiss,
                out
            )
            promises.push(p);
        };
        await Promise.all(promises);
        return out;
    }
    semaphore = new Semaphore(1);
    async pipelineRenderBase(sampleNumber:number, generateRay:Function,
         ComputeIntersection:Function,
        onRayHit:Function, onRayMiss:Function,
        //getLightRadiance:Function
         output:any[],
        )
    {
        let L = utils.VECS.ZERO;
        let beta = utils.VECS.ONE;
        let context = <PipelineContext>{
            i:sampleNumber,
            beta:beta,
            rays:<Ray[]>[],
            hits:<Hit[][]>[],
            L:utils.VECS.ZERO,
            previousPDF:0,
            pathIndex:0,
            testContext :{}
        }     
        let ray = await generateRay(sampleNumber, context);
        context.ray = ray;
        //console.log("Sample", context.sample)
        
        var countMiss = 0;
        for(let i = 0; i<DMAX;++i){
            context.pathIndex=i;
            context.rays.push(context.ray);
            var hits:Hit[]=await ComputeIntersection(context.ray, context);
            context.hits.push(hits);
            var hit = hits ? hits[0] : undefined;
            if (!hit) {
                context.L = onRayMiss(context);
                countMiss++;
            }
            else{
                context.L = onRayHit(hit, context);
                //console.log("Hit", i, context.L);
            }
            if(context.stop) break;
            if(i==DFIX)break;
        }
        if(FORCCE_MISS_DIRECTION)context.L = countMiss>0?context.L:utils.VECS.ZERO;
        output[sampleNumber] = context.L;
    }
    NormalToGlobal(n: vec3, sample: vec3): vec3 {
        var M = this.GenerateTransform(n);
        return utils.transform(M, sample)
    }
    GlobalToNormal(n: vec3, sample: vec3): vec3 {
        
        var M = this.GenerateTransform(n);
        var M2 = inverse(M);
        if(debugSample(this)) console.log("GlobalNormal",n, M, M2, sample);
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
    getLightSamples(): LightSample[]  {
        let nsamples = DEFAULT_LIGHT_SAMPLE_COUNT;
        return Array(nsamples).fill({}).map((_,i)=>this.getLightSample())
    }
    getLightRadianceFromSamples(samples:LightSample[], interaction:Interaction, rayOrigin:Ray, mat:Material): vec3 {
        let nsamples = samples.length;
        var c = utils.VECS.ZERO
        for(let sampleI=0;sampleI<nsamples;sampleI++){
            let lp = samples[sampleI]
            if(!lp) continue;
            
            let ray = interaction.SpawnRayToPoint(lp.s, true);
            //let {ns,s,pdf} = lp;
            let ns = normalize(lp.light.light.getN(lp.point, interaction));
            //var rad = sample.Radiance(this, p, n);
           // let ds = sub2(lp.s, hitOrigin.p)
           // let wi = normalize(ds);
            let factorNumerator = max0(dot(interaction.n, ray.direction)) * max0(dot(ns, minus(ray.direction)))

            mat.GetPDF(lp)
            if(this.lightCheck(ns, ray.direction, factorNumerator)){
                return this.checkResult;
            }
            //let ray = createRay(add2(hitOrigin.p, utils.scale(hitOrigin.n,EPSILON)), ray.direction);
            let hitA = this.ComputeIntersection(ray, true, true, true);
            let hit = hitA ? hitA[0]?.hit : undefined;
            if (hit?.t??1 > 0.0001)
            {
                //hit = hitA[1];
            }
            if (!hit  || (hit.t > 0.0001 &&(!hit!.light || (hit!.light != lp.light.light)))) {
                //add2(c,[0, 0, 0])
                if (debugSample(this)) {
                    console.log("LightRadiance hit", lp, c, ray.direction, ray, hit, interaction.p, interaction.n, )
                    this.checkResult = [0, 0, 1];
                    return <vec3>[0,0,1];
                }
            }
            else {
                let d2 = interaction.SqrDistance(lp.s)
                let I = lp.light.light.Intensidade;
                let factor =  factorNumerator/ (d2 * lp.pdf)
                c = add2(c,utils.scale(I, factor))
                
                if (debugSample(this)) {
                    console.log("LightRadiance", lp, c, ray.direction, ray, hit, interaction.p, interaction.n, d2, I, factor, dot(interaction.n,ray.direction), dot(ns,minus(ray.direction)))
                    this.checkResult = [0, 0, 1];
                    return <vec3>[0,0,1];
                }
            }   
            
        }
        return utils.scale(c,1/nsamples);

        function max0(v: number) {
            return Math.max(0, v);
        }
    }
    getLightRadiance(hitOrigin:Hit, rayOrigin:Ray, mat:Material): vec3 {
        let nsamples = DEFAULT_LIGHT_SAMPLE_COUNT;
        let c:vec3 = [0,0,0]
        if(false)
        {

            c = [0,0,0]
            this.lights.forEach(lp=>{
                //var light = l.light!
                var s = (lp.light as PontualLight).Position;
                var lpdf = 1;
                var pdf = 1;
                var ns = sub2(hitOrigin.p, s)
                var ds = sub2(s, hitOrigin.p)
                var d2 = utils.sqrLen(ds)
                var I = lp.light!.Intensidade;
                
                var wi = normalize(ds);
                
                var factor = max0(dot(hitOrigin.n, wi)) * max0(dot(ns, minus(wi))) / (d2 * lpdf * pdf)
                c = add2(c,utils.scale(I, factor))
                
            })
        }
        else{

            //sorteia um sample de luz
            c = [0,0,0]
            //nsamples = 1;
            for(let sample=0;sample<nsamples;sample++)
            {
                
                let lp = this.getLightSample();
                if (lp) {
                    var interaction = Interaction.fromHit(hitOrigin)
                    //let {ns,s,pdf} = lp;
                    let ns = normalize(lp.light.light.getN(lp.point, interaction) );
                    //let ns = normalize(lp.point.ns);
                    //var rad = sample.Radiance(this, p, n);
                    
                    let ray = interaction.SpawnRayToPoint(lp.s, true);
                    //let ds = sub2(lp.s, hitOrigin.p)
                    //let wi = normalize(ds);
                    let factorNumerator = max0(dot(hitOrigin.n, ray.direction)) * max0(dot(ns, minus(ray.direction)))

                    mat.GetPDF(lp)
                    
                    /*
                    if(FORCCE_L_HIT)
                    {
                        var r2 = l.map(v=>Math.abs(v));
                        this.checkResult = add2(c1, <vec3>r2);
                        return true;
                    }*/
                    if(this.lightCheck(ns, ray.direction, factorNumerator)){
                        return this.checkResult;
                    }
                    //let ray = createRay(add2(hitOrigin.p, utils.scale(hitOrigin.n,EPSILON)), wi);
                    let hitA = this.ComputeIntersection(ray, true, true, true);
                    let hit = hitA ? hitA[0].hit : undefined;
                    if (hit?.t??1 > 0.0001)
                    {
                        //hit = hitA[1];
                    }
                    if (!hit  || (hit.t > 0.0001 &&(!hit!.light || (hit!.light != lp.light.light)))) {
                        //add2(c,[0, 0, 0])
                        if (debugSample(this)) {
                            console.log("LightRadiance hit", lp, c, ray.direction, ray, hit, hitOrigin.p, hitOrigin.n, )
                            this.checkResult = [0, 0, 1];
                            return <vec3>[0,0,1];
                        }
                    }
                    else {
                        let d2 = interaction.SqrDistance(lp.s)
                        let I = lp.light.light.Intensidade;
                        let factor =  factorNumerator/ (d2 * lp.pdf)
                        c = add2(c,utils.scale(I, factor))
                        
                        if (debugSample(this)) {
                            console.log("LightRadiance", lp, c, ray.direction, ray, hit, hitOrigin.p, hitOrigin.n, d2, I, factor, dot(hitOrigin.n,ray.direction), dot(ns,minus(ray.direction)))
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
        return light.getSamplePoint();
    }
    getLightSample(): LightSample {
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
        let lightEntity = this.lights[idx]
        let light = lightEntity.light!
        let ls = light.getSamplePoint();
        return <LightSample>{pdf:ls.pdf*pdfs[idx],s:ls.s,  
            light:{light,pdf:pdfs[idx]},
            entity:lightEntity,
            n:normalize(utils.VECS.ONE),
            point:ls,
            wi:utils.VECS.ZERO,
           // light: pointPdf:ls.pdf, light: light, pdfLight: pdfs[idx] 
        };
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
    beforeMatEvalCheck(hit: Interaction|undefined, code = 0, cxt:{checkResult:vec3}=this) {
        if (hit?.hit?.uv) {
            //return min([1,1,1],add2(scale([1,0,0],hit.uv[0]), scale([0,1,0],hit.uv[1])));
        }
        if(false)
        {            
            cxt.checkResult = [hit!.p[1]/4, (hit!.p[1]<4)?0:1, 0];
            return true;
        }
        if (FORCCE_HIT) {
            cxt.checkResult = [1, 0, 0];
            return true;
        }
        
        if(FORCCE_NORMAL)
        {
            //console.log("ForceNormal", cxt, hit)
            if(hit?.hit)
            {

                cxt.checkResult =  hit?.hit.n.map(v=>Math.abs(v)) as vec3;
                return true;
            }
            cxt.checkResult = utils.VECS.ZERO
            return true;
        }
        if (FORCCE_HIT_ON_VERTEX && hit?.hit?.forceOnVertex) {

            cxt.checkResult = [1, 0, 0];
            return true
        }
        
        if (FORCCE_HIT_MAT_CODE && hit && hit?.hit!.instanceRef > 0) {
            //return <vec3>[0,0,1]
            cxt.checkResult = calculateHitCode(hit?.hit!.instanceRef)
            return true
        }
        if ((FORCCE_RAY_HIT_MAT_CODE==code) ) {
            if(hit?.hit && hit?.hit!.instanceRef > 0)
                //this.checkResult = <vec3>[0,0,1]
                cxt.checkResult = calculateHitCode(hit.hit!.instanceRef)
            else
            cxt.checkResult = <vec3>[0,0,0]
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
        this.AddEntity(createTPrimitive({ name: "Luz de Area", light, shape: new Area(light.Position, light.ArestaI, light.Arestaj), transform }));
    }

    AddPonctualLight(light: PontualLight) {
        //this.lightSources.push(light);
        light.Potencia = sub2(light.Potencia, this.ambientLight);
        const scale = PONTUAL_LIGHT_RADIUS;
        const position = light.Position;
        //const position:vec3 = [0,2,1]
        var transform = Transform.fromScaleAndTranslation(position, scale, scale, scale);
        //console.log("Light",transform.toGlobal([1,0,0]),transform.toLocal([1,0,0]))
        this.AddEntity(createTPrimitive({ name: "Luz Pontual", light, shape: new Sphere(), transform }));


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
        //console.log("Addentity", arg0)
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
    ComputeIntersectionList(rays: Ray[], ignoreNegative:boolean=true,ignoreBackface:boolean=true,ignoreEpslon:boolean = true): Interaction[][]  {
        console.log("Compute")
        this.tester.ignoreBackface = ignoreBackface;
        this.tester.ignoreNegativeValues=ignoreNegative;
        this.tester.ignoreEpslon=ignoreEpslon;
        var bestHit = this.tester.TestRays(rays);
        console.log("Post Compute", bestHit)
        return bestHit;
    }

    ComputeIntersection(ray: Ray, ignoreNegative:boolean=true,ignoreBackface:boolean=true,ignoreEpslon:boolean = true, context:any={}): Interaction[]  {
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
        //setVerbose(debugSample(this));
        context = {}
        var bestHit = this.tester.Test(ray, context);
        if (verbose) console.log("bestHit", ray, bestHit);
        
        //setVerbose(false);
        //console.groupEnd()
        //this.tester.Test()
        if (verbose3) console.log("MARK2::Hit Object Final", bestHit, context);

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

type PipelineContext = {
    ray:Ray, 
    rays:Ray[],
    hits:Hit[][],
    beta:vec3, 
    i:number, 
    previousPDF:number, 
    L:vec3, 
    pathIndex:number, 
    stop:boolean,
    sample:vec2, 
    testContext:any,
    checkResult:vec3
}