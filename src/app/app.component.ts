import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { glMatrix, mat2, vec3 } from 'gl-matrix';
import { AreaLight, Camera, Film, Light, Material, Plane, PontualLight, Scene, Sphere, Transform } from './model/Film';


const setPixel = (myImageData:any, x:number, y:number, width:number, height:number, r:number, g:number, b:number, a:number = 255) => {

  const colorIndices = getColorIndicesForCoord(x, height-y-1, width);
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
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'raytrace';
  @ViewChild('canvas', { static: true }) 
  canvas: ElementRef<HTMLCanvasElement>;
  ctx :CanvasRenderingContext2D;
  
  ngOnInit(): void {
    
    this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    //this.drawRect();
    this.initScene();
  }
  scene:Scene;
  W = 400;
  H = 300;
  angle = 90;
  initScene(){
    this.testScene1();
  }
  
  testScene1(){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    this.ctx.canvas.width = this.W
    this.ctx.canvas.height = this.H
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W,this.H], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.7;
    var dz = 1;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,-2,1+dz,],u,v,w,this.angle, 1, this.W/this.H );

    //camera.RotateX(-25.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    //var scene = new Scene(film, );
    
      //console.log("mfyImageData", myImageData)
    //this.ctx.putImageData(myImageData,0,0);
    //scene.testCameraPixels();
    var material = new Material([1,0,0], [0.2,0.2,0.2], 2);
    var material2 = new Material([1,1,1], [0.8,0.8,0.8],1);
    var material3 = new Material([1,0,0], [0,0,0],0.1);
    var material4 = new Material([0.4,1,0.4], [0,0,0],1);
    var material5 = new Material([0.3,0.3,0.3], [0.8,0.8,0.8],1);
    
    //scene.AddPonctualLight(new PontualLight([-0.5,0.3,0.8+dz]))
    scene.AddPonctualLight(new PontualLight([0,1,4]))
    
    /*
    scene.AddPonctualLight(new PontualLight([-0.5,1,2.4],[0.25,0.25,0.25]))
    scene.AddPonctualLight(new PontualLight([0.5,1,2.4],[0.25,0.25,0.25]))
    scene.AddPonctualLight(new PontualLight([-0.5,0,2.4],[0.25,0.25,0.25]))
    scene.AddPonctualLight(new PontualLight([0.5,0,2.4],[0.25,0.25,0.25]))
    */
   //scene.AddAreaLight(new AreaLight([-0.5,1,2.4],[1,0,0],[0,-1,0]))

    //scene.AddPonctualLight(new PontualLight([0,1,1]))
    //scene.AddPonctualLight(new PontualLight([1,1,1], [1,0,0]))
    //scene.AddPonctualLight(new PontualLight([0,1,2],[0,1,0]))
    //return;
      //new Light([0,5,0]), 
    //scene.AddLight(new Light([2.5,0,10]),)

    /*
    scene.AddEntity({material: material, shape:new Sphere(), 
      //[0,2,-1+dz], 1
      transform:Transform.fromScaleAndTranslation([0,2,0.2+dz],1,1,1.2)
      //transform:new Transform()
    })
    */
    
    //scene.AddEntity({material: material, shape:new Sphere([-2,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([0,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([2,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([-2,7,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([0,7,0], 1)})
    ////scene.AddEntity({material: material, shape:new Sphere([-1,2,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([3,5,0], 1)})
    
    scene.AddEntity({material: material2, shape:new Plane([0,0,1], [0,0,-1+dz]), transform:new Transform()})
    scene.AddEntity({material: material3, shape:new Plane([-1,0,0], [2,0,0]), transform:new Transform()})
    scene.AddEntity({material: material4, shape:new Plane([1,0,0], [-2,0,0]), transform:new Transform()})
    scene.AddEntity({material: material2, shape:new Plane([0,-1,0], [0,3,0]), transform:new Transform()})
    scene.AddEntity({material: material5, shape:new Plane([0,0,-1], [0,0,4]), transform:new Transform()})
    //scene.AddEntity({material: material2, shape:new Plane([0,-1,0], [0,10,0])})
    scene.Render(this.ctx);
  }
  testScene2(){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    this.ctx.canvas.width = this.W
    this.ctx.canvas.height = this.H
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W,this.H], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.2;
    var dz = 1;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,0,dz,],u,v,w,this.angle, 5, this.W/this.H );

    //camera.RotateX(-25.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    
    scene.AddPonctualLight(new PontualLight([0,2,dz]))
    scene.Render(this.ctx);
  }

  testScene3(){
    //const W = this.ctx.canvas.width;
    //const H = this.ctx.canvas.height;
      this.angle = 100;
    if(false)
    {
      this.W=10;
      this.H=10;
      this.angle = 10;
      
    }
    this.ctx.canvas.width = this.W
    this.ctx.canvas.height = this.H
    console.log("testImage", this.W, this.H);
    //return;

    var film = Film.Make([this.W,this.H], 0);
    //var camera = new Camera([0,0,0,],[1,0,0],[0,0,1], [0,-1,0],90, 800, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    var ambLightPot = 0.2;
    var dz = 0;
    var u:vec3 = [1,0,0],v:vec3=[0,0,1], w:vec3=[0,-1,0]
    var camera = new Camera([0,0,dz,],u,v,w,this.angle, 5, this.W/this.H );

    camera.RotateX(-49.3);
    var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);
    this.scene = scene;
    //var scene = new Scene(film, );
    
      //console.log("mfyImageData", myImageData)
    //this.ctx.putImageData(myImageData,0,0);
    //scene.testCameraPixels();
    var material = new Material([1,0,0]);
    var material2 = new Material([1,1,1]);
    //scene.AddLight({material: material, shape:new Sphere([0,3,0], 1)})
    //scene.AddLight(new Light([-0.5,1,-3]))
    //scene.AddLight(new Light([-0.5,2,1.5+dz]))
    //scene.AddLight(new Light([-0.6,0.8,-0.3+dz]))
    scene.AddPonctualLight(new PontualLight([0,1,-0+dz]))
    //return;
      //new Light([0,5,0]), 
    //scene.AddLight(new Light([2.5,0,10]),)
    
    scene.AddEntity({material: material, shape:new Sphere(), 
      //[0,2,-1+dz], 1
      transform:Transform.fromScaleAndTranslation([0,2,10+-1+dz],)
      //transform:new Transform()
    })
    
    
    //scene.AddEntity({material: material, shape:new Sphere([-2,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([0,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([2,5,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([-2,7,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([0,7,0], 1)})
    ////scene.AddEntity({material: material, shape:new Sphere([-1,2,0], 1)})
    //scene.AddEntity({material: material, shape:new Sphere([3,5,0], 1)})
    scene.AddEntity({material: material2, shape:new Plane([0,0,1], [0,0,-1+dz]), transform:new Transform()})
    //scene.AddEntity({material: material2, shape:new Plane([0,-1,0], [0,10,0])})
    scene.Render(this.ctx);
  }
  animate(){
    this.scene.camera.RotateX(15*Math.random()-7)
    this.scene.Render(this.ctx)
    /*
     this.ctx.fillStyle = 'red';
     const square = new Square(this.ctx);
     square.draw(0, 0, 10);
     const myImageData = this.ctx.getImageData(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
     console.log("myImageData", myImageData)
     //square.move(1,21)
     */
  }

  drawCircle(){
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(0, 0, 5, 5);
  }
}

export class Square {
  constructor(private ctx: CanvasRenderingContext2D) {}


  move(y: number, z: number) {
    const max = this.ctx.canvas.width / z;
    const canvas = this.ctx.canvas;
    let x = 0;
    const i = setInterval(() => {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);      
      this.draw(x, y, z);
      x++;
      if (x >= max) {
        clearInterval(i);
      }
    }, 200);    
  }
  draw(x: number, y: number, z: number) {
    this.ctx.fillRect(z * x, z * y, z, z);
  }
}