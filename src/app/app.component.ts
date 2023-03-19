import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Camera, Film, Scene } from './model/Film';


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
  }

  testImage(){
    const W = this.ctx.canvas.width;
    const H = this.ctx.canvas.height;
    console.log("testImage", W, H);
    //return;

    var film = Film.Make([W,H], 0);
    var camera = new Camera([1,0,0],[0,0,1], [0,-1,0],60, 39, W/H )

    //console.log("Pixel", camera.ToCameraPosition([0,2,0]))
    
    var scene = new Scene(film, new Camera([1,0,0],[0,0,1], [0,-1,0],60, 1, W/H ));
    //var scene = new Scene(film, );
    
      //console.log("mfyImageData", myImageData)
    //this.ctx.putImageData(myImageData,0,0);
    //scene.testCameraPixels();
    scene.Render(this.ctx);
  }

  animate(){
    this.testImage();
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