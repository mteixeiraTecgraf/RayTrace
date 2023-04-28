import { AreaLight, Camera, Film, PontualLight, Scene } from ".";
import { Hit, Ray } from "./Primitive";
import { Box, Plane } from "./Shapes";
import { normalize } from "./utils";
import { LIGHT_FACTOR } from "./config";
import { Material, PhongMaterial } from "./Material";


function closeTo(n:number){
    return new DoubleMatcher(n)
}
/*
function arrayCloseTo(n:ArrayLike<number>){
    return new DoubleMatcher(n);
}
*/
class DoubleMatcher extends Number implements jasmine.AsymmetricMatcher<number> {
    constructor(public value:number){
        super(value);
    }
    asymmetricMatch(other: number, matchersUtil?: jasmine.MatchersUtil): boolean
    {
        if(matchersUtil){
            //return matchersUtil.equals(this.value,other);
        }
        return Math.abs(this.value-other)< 0.0001; 
    }
    /*
    jasmineToString(prettyPrint: (value: any) => string): string
    {
        return `${prettyPrint(this.value)}`;
    }
    */
}

describe('Film', () => {
    
    let film = Film.Make([10,10], 0);
    let camera = new Camera([0,0,0],[0,1,0],[0,0,1],[0,-1,0],60, 5, 1);
    let scene :Scene
    beforeEach(()=>{
        scene = new Scene(film, camera, [0,0,0]);
    })
    describe('AreaLight', () => {
        
        it('should create the app', () => {
            expect(true).toBeTruthy();
        });
        let area = new AreaLight([0,0,0], [1,0,0], [0,1,0]);
        area.SAMPLE_COUNT = 1;
        area.random = ()=>0.5;

        describe('getSample', ()=>{
            beforeEach(()=>{        
                console.log("AddArea", area)
                scene.AddAreaLight(area);
            })
            it('1 Sample', ()=>{
                area.SAMPLE_COUNT = 1;
                expect(area.getSample(0,0)).toEqual(jasmine.objectContaining({
                    pos: jasmine.arrayWithExactContents([0.5,0.5,0]),
                    normal: jasmine.arrayWithExactContents([0,0,1])
                }))
            })
            it('4 Sample', ()=>{
                area.SAMPLE_COUNT = 4
                expect(area.getSample(0,0)).toEqual(jasmine.objectContaining({
                    pos: jasmine.arrayWithExactContents([0.25,0.25,0]),
                    normal: jasmine.arrayWithExactContents([0,0,1])
                }))
                expect(area.getSample(0,1)).toEqual(jasmine.objectContaining({
                    pos: jasmine.arrayWithExactContents([0.25,0.75,0]),
                    normal: jasmine.arrayWithExactContents([0,0,1])
                }))
                expect(area.getSample(1,0)).toEqual(jasmine.objectContaining({
                    pos: jasmine.arrayWithExactContents([0.75,0.25,0]),
                    normal: jasmine.arrayWithExactContents([0,0,1])
                }))
                expect(area.getSample(1,1)).toEqual(jasmine.objectContaining({
                    pos: jasmine.arrayWithExactContents([0.75,0.75,0]),
                    normal: jasmine.arrayWithExactContents([0,0,1])
                }))
            })
        })
        describe('Radiance', ()=>{
            beforeEach(()=>{        
                console.log("AddArea", area)
                scene.AddAreaLight(area);
            })
            it('1 Sample dist 1', ()=>{
                area.SAMPLE_COUNT = 1;

                
                expect(area.Radiance(scene, [0.5,0.5,1], [0,0,-1])).toEqual(jasmine.objectContaining({
                    l:[0,0,-1],
                    li:[1/LIGHT_FACTOR,1/LIGHT_FACTOR,1/LIGHT_FACTOR]
                }))
            })
            it('i sample dist 2', ()=>{
                
                expect(area.Radiance(scene, [0.5,0.5,2], [0,0,-1])).toEqual(jasmine.objectContaining({
                    l:[0,0,-1],
                    li:[0.25/LIGHT_FACTOR,0.25/LIGHT_FACTOR,0.25/LIGHT_FACTOR]
                }))
            })
        })
        describe('SampleRadiance', ()=>{
            beforeEach(()=>{        
                console.log("AddArea", area)
                scene.AddAreaLight(area);
            })
            it('4 Sample', ()=>{
                area.SAMPLE_COUNT = 4
                
                expect(area.SampleRadiance(scene, [0.5,0.5,2], [0,0,-1], 0)).toEqual(jasmine.objectContaining({
                    l:[-0.12309149097933272, -0.12309149097933272, -0.9847319278346618],
                    //li:[0.25/LIGHT_FACTOR,0.25/LIGHT_FACTOR,0.25/LIGHT_FACTOR]
                }))

                /*
                area.SAMPLE_COUNT = 4;
                expect(area.Radiance(scene, [0.5,0.5,1], [0,0,-1])).toEqual(jasmine.objectContaining({
                    l:[0,0,-1],
                    li:[1/LIGHT_FACTOR,1/LIGHT_FACTOR,1/LIGHT_FACTOR]
                }))
                */
            })
        })

    });
    describe("FreeTest", ()=>{
        it('PlaneIntersection', ()=>{
            let plane = new Plane([0,0,1], [0,0,-1]);
            expect(plane.ComputeIntersection(<Ray>{
                camera:false,
                direction:[0,1,-0.1],
                origin:[0,0,0]
            })).toBeDefined();
            
            expect(plane.ComputeIntersection(<Ray>{
                camera:false,
                direction:[0,1,-0.1],
                origin:[0,0,0]
            })).toEqual(jasmine.objectContaining({
                p:[0,10,-1]
            }));
        })
        describe("Box Intersection", ()=>{
            let box:Box;
            let ray:Ray
            beforeEach(()=>{
                box = new Box([1,1,1], [3,3,3]);
                ray = <Ray>{
                    camera:false,
                    direction:[1,0,0],
                    origin:[0,0,2]
                }
            })
            describe(" y before", ()=>{
                beforeEach(()=>{
                    ray.origin = [0,0,2]
                })
                it('y before ', ()=>{
                    ray.origin[1] = 0
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
                it('y border ', ()=>{
                    ray.origin[1] = 1
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
                
                it('y between', ()=>{
                    ray.origin[1] = 2
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeDefined();
                    expect(hit).toEqual(jasmine.objectContaining({
                        p:[1,2,2],
                        t: 1,
                        backface:false,
                        n: [-1,0,0],
                    }));
                })
                it('y border ', ()=>{
                    ray.origin[1] = 3
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
                
                it('y after', ()=>{
                    ray.origin[1] = 4
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
            })
            describe("x between y Par", ()=>{
                beforeEach(()=>{
                    ray.origin = [2,0,2]
                })
            
                it('y before', ()=>{
                    ray.origin[1] = 0
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
                
                it('y between', ()=>{
                    ray.origin[1] = 2
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeDefined();
                    expect(hit).toEqual(jasmine.objectContaining({
                        p:[3,2,2],
                        t:1,
                        backface:true,
                        n: [1,0,0],
                    }));
                })
                
                it('y after', ()=>{
                    ray.origin[1] = 4
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
            })
            describe("x or", ()=>{
                beforeEach(()=>{
                    ray.origin = [0,0,0],
                    ray.direction=normalize([1,1,1])
                })
            
                it('y before', ()=>{
                    ray.origin[1] = 0
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeDefined();
                    //jasmine.addCustomEqualityTester((v1:number,v2:number)=>(v2-v1) < 0.0001);
                    expect(hit).toEqual(jasmine.objectContaining({
                        p:jasmine.arrayContaining([closeTo(1),closeTo(1),closeTo(1)]),
                        t:closeTo(Math.sqrt(3)),
                        backface:false,
                        n: [0,-1,0],
                    }));
                })
                /*
                
                it('y between', ()=>{
                    ray.origin[1] = 2
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeDefined();
                    expect(hit).toEqual(jasmine.objectContaining({
                        p:[3,2,2],
                        t:1,
                        backface:true,
                        n: [1,0,0],
                    }));
                })
                
                it('y after', ()=>{
                    ray.origin[1] = 4
                    var hit = box.ComputeIntersection(ray)
                    expect(hit).toBeUndefined();
                    expect(hit).toEqual(undefined);
                })
                */
            })
        })
        fdescribe("Box Ilumination", ()=>{
            let box:Box;
            let ray:Ray
            let light:PontualLight
            beforeEach(()=>{
                box = new Box([1,1,1], [3,3,3]);
                light = new PontualLight([0,2,2]);
                scene.AddPonctualLight(light);
                //scene.AddEntity(box);
            })
            it('radiance 1', ()=>{
                let v = light.Radiance(scene, [1,2,2], [1,0,0] )
                let factor = 2*Math.PI;
                expect(v).toBeDefined();
                expect(v).toEqual(jasmine.objectContaining({
                    li:[factor, factor, factor],
                    l:[-1,0,0]
                }));
            })
            it('radiance 2', ()=>{
                let v = light.Radiance(scene, [1,1,2], [1,0,0] )
                
                let factor = 2*Math.PI/2;
                expect(v).toBeDefined();
                expect(v).toEqual(jasmine.objectContaining({
                    li:[closeTo(factor), closeTo(factor), closeTo(factor)],
                    l:normalize([-1,1,0])
                }));
            })
            it('radiance 2 Mat', ()=>{
                //let v = light.Radiance(scene, [1,1,2], [1,0,0] )
                let m = new PhongMaterial([1,0,0],[0,0,0],1);
                let hit = <Hit>{p:[1,1,2], n:[-1,0,0],backface:false,t:Math.sqrt(2),material:m, forceOnVertex:false,instanceRef:-1,uv:[0,0]};
                var c = m.Eval(scene, hit, [1,0,2]);
                
                //let factor = 2*Math.PI/2;
                expect(c).toBeDefined();
                expect(c).toEqual(jasmine.arrayContaining([closeTo(1), closeTo(0), closeTo(0)]));
            })
            it('radiance 2', ()=>{
                let v = light.Radiance(scene, [1,1,2], [1,0,0] )
                
                let factor = 2*Math.PI/2;
                expect(v).toBeDefined();
                expect(v).toEqual(jasmine.objectContaining({
                    li:[closeTo(factor), closeTo(factor), closeTo(factor)],
                    l:normalize([-1,1,0])
                }));
            })
            xit('radiance 2', ()=>{
                let v = light.Radiance(scene, [1,2,2], [1,0,0] )
                
                expect(v).toBeDefined();
                expect(v).toEqual(jasmine.objectContaining({
                    li:[2*Math.PI, 2*Math.PI, 2*Math.PI],
                    l:[-1,0,0]
                }));
            })
        });
    })
})