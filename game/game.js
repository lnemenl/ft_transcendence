b = BABYLON;
v3 = BABYLON.Vector3;
PADDLE_HEIGHT = 2.5;
BALL_DIAMETER = 1;

function intersect(ball, box) {
  const x = Math.max(box.minX, Math.min(ball.x, box.maxX));
  const z = Math.max(box.minZ, Math.min(ball.z, box.maxZ));

  const distance = Math.sqrt((x - ball.x)**2 + (z - ball.z)**2);
  return distance < BALL_DIAMETER / 2;
}

leftPoints  = 0;
rightPoints = 0;
canvas = document.getElementById("canvas");
engine = new b.Engine(canvas, true);
S = new b.Scene(engine);

camera = new b.FreeCamera("camera", new v3(0, 10, 8), S);
camera.setTarget(v3.Zero());


// ground = b.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, S);
// ground.position = new v3(0,-1,0);

sphere = b.MeshBuilder.CreateSphere("sphere", {diameter: BALL_DIAMETER}, S);

light3 = new b.PointLight("light3", new v3(0, 2, 0), S);
light3.intensity = 0.1;

PADDLE_RADIUS = 0.2;
lpaddle = b.MeshBuilder.CreateCapsule("lpaddle", {
  height: PADDLE_HEIGHT,
  radius: PADDLE_RADIUS,
  orientation: new v3(0, 0, 1)
},
  S);
rpaddle = b.MeshBuilder.CreateCapsule("rpaddle", {
  height: PADDLE_HEIGHT,
  radius: PADDLE_RADIUS,
  orientation: new v3(0, 0, 1)
},
  S);
lpaddle.material = new b.StandardMaterial("lpaddle_mat", S);
rpaddle.material = new b.StandardMaterial("lpaddle_mat", S);
sphere.material = new b.StandardMaterial("sphere_mat", S);
paddleColor = new b.Color3(1,0,0);
lpaddle.material.emissiveColor = paddleColor;
rpaddle.material.emissiveColor = paddleColor;
sphere.material.emissiveColor = paddleColor;
// ground.material = new BABYLON.StandardMaterial("mirrorMaterial", S);
// ground.material.reflectionTexture = new BABYLON.MirrorTexture("mirrorTexture", 512, S, true);

p1 = new v3(5,0,0);
p2 = new v3(-5,0,0);

keys_down = new Set();
document.addEventListener('keydown', (e) => keys_down.add(e.code));
document.addEventListener('keyup', (e) => keys_down.delete(e.code));

last_time_ms = 0;
ball_pos = new v3(0, 0, 0);
ball_dir = 1;
perturbation = 0;

function update(current_time_ms) {
  const delta_ms = (current_time_ms - last_time_ms) / 1000;
  const speed = 12;
  if (keys_down.has('KeyW')) p1.z -= delta_ms * speed;
  if (keys_down.has('KeyS')) p1.z += delta_ms * speed;
  if (keys_down.has('KeyI')) p2.z -= delta_ms * speed;
  if (keys_down.has('KeyK')) p2.z += delta_ms * speed;
  last_time_ms = current_time_ms;
  box1 = {
    minX: p1.x - PADDLE_RADIUS,
    maxX: p1.x + PADDLE_RADIUS,
    minZ: p1.z - PADDLE_HEIGHT/2,
    maxZ: p1.z + PADDLE_HEIGHT/2,
  };
  box2 = {
    minX: p2.x - PADDLE_RADIUS,
    maxX: p2.x + PADDLE_RADIUS,
    minZ: p2.z - PADDLE_HEIGHT/2,
    maxZ: p2.z + PADDLE_HEIGHT/2,
  };
  if (ball_dir > 0 && intersect(ball_pos, box1)) {
    ball_dir *= -1;
    perturbation = 0.5 - Math.random();
  }
  if (ball_dir < 0 && intersect(ball_pos, box2)) {
    ball_dir *= -1;
    perturbation = 0.5 - Math.random();
  }
  ballSpeed = document.getElementById("speed").value / 100;
  ball_pos.x += ballSpeed * ball_dir;
  ball_pos.z += ballSpeed * perturbation;
  if (Math.abs(ball_pos.z) > 5)
    perturbation *= -1;
  if (Math.abs(ball_pos.x) > 6)
  {
    if (ball_pos.x < 0) leftPoints   += 1;
    if (ball_pos.x > 0) rightPoints  += 1;
    ball_pos.set(0,0,0);
    perturbation = 0;
  }
}

scoreCard = document.getElementById("score-card");

function loop(current_time_ms) {
  update(current_time_ms);

  r = document.getElementById("red")  .value / 100;
  g = document.getElementById("green").value / 100;
  b = document.getElementById("blue") .value / 100;

  paddleColor.set(r,g,b);
  lpaddle.setPositionWithLocalVector(p1);
  rpaddle.setPositionWithLocalVector(p2);
  sphere.setPositionWithLocalVector(ball_pos);
  light3.position.set(ball_pos.x,ball_pos.y+1,ball_pos.z);
  scoreCard.innerHTML = `
  ${leftPoints} | ${rightPoints}
  `;
  S.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
