function createScene(canvas, G)
{
  const b = BABYLON; const v3 = BABYLON.Vector3;

  const Engine = new b.Engine(canvas);
  const S = new b.Scene(Engine);
  S.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  S.camera = new b.FreeCamera("camera", new v3(0, 15, 8), S);
  S.ground = b.MeshBuilder.CreateGround("ground",
    {width: G.width, height: G.height}, S);
  S.sphere = b.MeshBuilder.CreateSphere("sphere", {diameter: G.ball.diameter}, S);

  S.camera.setTarget(v3.Zero());
  S.ground.position = new v3(0,-1,0);

  S.light3 = new b.PointLight("light3", new v3(0, 2, 0), S);
  S.light3.intensity = 0.1;

  Object.assign(S, {
    lpaddle: b.MeshBuilder.CreateCapsule("lpaddle", {
      height: G.p1.height, radius: G.p1.width,
      orientation: new v3(0, 0, 1)
    }, S),
    rpaddle: b.MeshBuilder.CreateCapsule("rpaddle", {
      height: G.p2.height, radius: G.p2.width,
      orientation: new v3(0, 0, 1)
    }, S)
  });

  const paddleColor = new b.Color3(1,1,1);
  [S.lpaddle, S.rpaddle, S.sphere].forEach(mesh => {
    mesh.material = new b.StandardMaterial(`${mesh.name}_mat`, S);
    mesh.material.emissiveColor = paddleColor;
  });
  return (S);
}

export function createRenderer(canvas, G, playingFieldHeight) {
  const S = createScene(canvas, G, playingFieldHeight);

  return function render(G) {
    S.lpaddle.position.set(G.p1.x,   0, G.p1.z);
    S.rpaddle.position.set(G.p2.x,   0, G.p2.z);
    S.sphere.position.set (G.ball.x, 0, G.ball.z);
    S.light3.position.set (G.ball.x, 1, G.ball.z);
    S.render();
  };
}
