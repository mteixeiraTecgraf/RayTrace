import { vec3 } from "gl-matrix";
import { AreaLight, Camera, Film, LIGHT_FACTOR, Plane, Ray, Scene } from "./Film";

describe('Film', () => {
    
    describe('AreaLight', () => {
        
        it('should create the app', () => {
            expect(true).toBeTruthy();
        });
        let film = Film.Make([10,10], 0);
        let camera = new Camera([0,0,0],[0,1,0],[0,0,1],[0,-1,0],60, 5, 1);
        let scene = new Scene(film, camera, [0,0,0]);
        let area = new AreaLight([0,0,0], [1,0,0], [0,1,0]);
        area.SAMPLE_COUNT = 1;
        area.random = ()=>0.5;
        console.log("AddArea", area)
        scene.AddAreaLight(area);

        describe('getSample', ()=>{
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

        describe("FreeTest", ()=>{
            let plane = new Plane([0,0,1], [0,0,-1]);
            it('PlaneIntersection', ()=>{
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
        })
    });
})