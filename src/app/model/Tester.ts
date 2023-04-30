import { DEFAULTPROGRESS, EPSILON, Hit, EntityInstance, ProgressAction, Ray, getT } from "./Primitive";
import { Box } from "./Shapes";
import { DEBUG_TRACE_POINT, DEBUG_TRACE_POINT_COORDS, TEST_BRUTE_FORCE } from "./config";
import { distance, max, min, verbose, verbose3 } from "./utils";

export type AccNode = {box?:Box, child1?:AccNode, child2?:AccNode, instance?:EntityInstance}

export class IntersectionTester{
    
    instances :EntityInstance[] = [];
    Add(instance:EntityInstance)
    {
        this.instances.push(instance);
        return;
        
        var boxAdj = instance.shape.BondingBox().Borders().map(instance.transform.toGlobal,instance.transform);
        var vmax = max(...boxAdj);
        var vmin = min(...boxAdj);
        var node:AccNode = {instance:instance, box: 
            new Box(vmin,vmax)
            //arg0.shape.BondingBox()
        };
        if(!this.root.instance)
        {
            this.root = node;
        }
        else
        {
            node.child2 = this.root;
            this.root = node
            var bmin = this.root.child2!.box!.bMin;
            var bmin = min(this.root.box!.bMin, this.root.child2!.box!.bMin);;
            var bmax = max(this.root.box!.bMax, this.root.child2!.box!.bMax);
            this.root.box = new Box(bmin, bmax)
            console.log("Box", this.root.box)

        }
    }
    generateStructure(progress:ProgressAction = DEFAULTPROGRESS){
        var centroids = this.instances.map(i=>i.transform.toGlobal(i.shape.BondingBox().Centroid()));
        var bmax = max(...centroids);
        var bmin = min(...centroids);
        var bbox = new Box(bmin, bmax);

        var res = this.divideInstances(this.instances, 0,this.instances.length, progress)
        if(res) this.root = res;
        console.log("Structure", this.root)

    }
    getBoundingBox(instance:EntityInstance)
    {
        var bbox = instance.shape.BondingBox();

        var globalsborders = bbox.Borders().map(instance.transform.toGlobal, instance.transform);
        var newBBox =  new Box(min(...globalsborders), max(...globalsborders));
        //console.log("BoundBox Transf", instance, globalsborders, newBBox);
        return newBBox;
    }
    divideInstances(instances:EntityInstance[], init: number = 0, end: number = 0, progress:ProgressAction = DEFAULTPROGRESS):AccNode|undefined{
        
        if(instances.length==0){
            return;
        }
        if(instances.length==1){
            return {box: this.getBoundingBox(instances[0]), instance: instances[0],};
        }

        //progress(end+init/2)
        var centroids = instances.map(i=>i.transform.toGlobal(i.shape.BondingBox().Centroid()));
        var bmax = max(...centroids);
        var bmin = min(...centroids);
        var bbox = new Box(bmin, bmax);
        
        var best = 0;
        var dx = bmax[0] - bmin[0]
        var dbest = dx;
        var dy = bmax[1] - bmin[1]
        if(dy>dbest)
        {
            best = 1;
            dbest = dy
        }
        var dz = bmax[2] - bmin[2]
        if(dz>dbest)
        {
            best = 2;
            dbest = dz
        }
        var sorted = instances.sort(sortBy);
        var half = Math.ceil(instances.length/2);
        var h1 = sorted.slice(0,half);
        var h2 = sorted.slice(half);

        //progress(end,end);
        //console.log("Init", init,end)
        //progress(0,end);
        progress(0,100);
        var n1 = this.divideInstances(h1, init, (init+end)/2, (i,n)=>progress((i*50/n),100));
        //progress(end,end);
        //console.log("Init mid", init,end)
        //progress((init+end)/2,end);
        progress(50,100);
        var n2 = this.divideInstances(h2, (init+end)/2, end, (i,n)=>progress(50+(i*50/n),100));
        
        //console.log("Init end", init,end)
        //progress(end,end);
        progress(100,100);

        
        //console.log("BoundBox Transf Join", n1, n2);
        
        return {box: new Box(
            min(n1!.box!.bMin, n2!.box!.bMin), 
            max(n1!.box!.bMax, n2!.box!.bMax), 
            ), 
            child1:n1, child2:n2};

        function sortBy(ia:EntityInstance,ib:EntityInstance){
            var v1 = (ia.shape.BondingBox().Centroid()[best]);
            var v2 = (ib.shape.BondingBox().Centroid()[best]);
            return v1-v2
        }
    }
    root:AccNode = {}
    Test(ray:Ray){

        if(TEST_BRUTE_FORCE) return this.TestForce(ray);
        /*
        var hit = this.root.box?.ComputeIntersection(ray);
        if(this.root.box && !hit)
        {
            //Not Hit
            return ;
        }
        */
        return this.TestNode(ray, this.root)
        
    }
    TestNode(ray:Ray, node?:AccNode, v = 0):Hit|undefined
    {        
        if(!node) return;
        
        if(verbose) console.log("MARK2::Computing Box intersections", ray, node);
        var hit = node.box?.ComputeIntersection(ray);
        
            

        if(this.root.box && !hit)
        {
            //Not Hit
            return ;
        }

        //console.log("Hit some 1")

        if((!node.child1) && (!node.child2))
        {
            if(!node.instance) {
                console.warn("No Child nor instance", node);
                return;
            }

            if(verbose) console.log("Computing intersections", ray, node);
            var tRay = node.instance!.transform.toLocalRay(ray);
            var tHit = node.instance!.shape.ComputeIntersection(tRay);
            //console.log("ComputeIntersection", thit);
            var hit = node.instance!.transform.toGlobalHit(tHit);
            if(hit) {
                if(verbose) console.log("MARK2::Computing Hit", ray, node, tRay, tHit, hit);
                hit.material = node.instance.material;
                hit.light = node.instance.light;
                hit.instanceRef = v;
                //if(node.instance.light) console.log("Node Light", ray, hit);
                //console.log("Hit some")
            }
            else{
                //console.log("Hit None", node.instance)
            }
            return hit;
        }

        var testRight = this.TestNode(ray, node.child1,v*2);
        var testLeft = this.TestNode(ray, node.child2,(v*2)+1);

        //testLeft = <Hit>{...testLeft, instanceRef:v};
        //testRight = <Hit>{...testRight, instanceRef:v};
        return this.CompareHits(this.SafeHit(testRight), this.SafeHit(testLeft));

    }

    TestForce(ray:Ray, v2:boolean =false){
        
        var bestHit:Hit|undefined = undefined; 
        this.instances.forEach(obj => {
            
            if(verbose) console.log("Computing intersections", ray, obj);
            var tRay = obj.transform.toLocalRay(ray);
            var thit = obj.shape.ComputeIntersection(tRay);
            //console.log("ComputeIntersection", thit);
            var hit = obj.transform.toGlobalHit(thit);
            
            if(hit) hit.t = getT(ray, hit!.p);
            if(v2)
                console.log("ComputeIntersection",ray, tRay, thit, hit, bestHit)
            if(verbose)console.log("Hit Object", hit, obj);

            
            //if(distance(hit?.p??[0,0,0], [2,1.5,2.9])<0.2)
            if(distance(hit?.p??[0,0,0], [2,1.5,2.9])<0.2)
            {
                //console.log("Hit", n, hit?.p, l,ml, distance(hit.p, [3,1.5,2.9]));
                //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
            }
            if(hit && !hit.backface &&(hit?.t > EPSILON) && (hit.t < (bestHit?.t??Infinity)))
            {
                hit.material = obj.material;
                hit.light = obj.light;
            
                bestHit = hit;
                if(verbose3)
                if(!ray.camera)
                    console.log("Hit Object", bestHit, obj);
                //console.log("Hit", bestHit);

            }
            
        });
        return bestHit;
    }

    CompareHits(h1?:Hit, h2?:Hit){
        if(DEBUG_TRACE_POINT && distance(h2?.p??[0,0,0], DEBUG_TRACE_POINT_COORDS)<0.04)
        {
            console.log("Hit CompareHits", h1, h2);
            //return [0,0,1]
            //console.log("Hit int", hit, thit, distance(hit?.p??[0,0,0], [2,1.5,2.9]),obj);
        }
        if(!h1 && !h2) return;
        if(!h1) return h2;
        if(!h2) return h1;
        if(!h1.backface &&(h1.t > EPSILON) && (h1.t < (h2.t??Infinity)))
        {
            //console.log("Compare Hit 1")
            return h1;
        }
        return h2;
    }
    SafeHit(hit:Hit|undefined)
    {
        if(!hit || hit.t < EPSILON) return;
        return hit;
    }
}