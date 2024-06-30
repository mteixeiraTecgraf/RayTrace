var film = Film.Make([this.W ,this.H ], 0,ctx);
var camera = new Camera([0,0,0,],u,v,w,this.angle, 1, this.W/this.H );
var scene = new Scene(film, camera, [ambLightPot,ambLightPot,ambLightPot]);

// Mount scene...

scene.prepareScene()
scene.Render()
