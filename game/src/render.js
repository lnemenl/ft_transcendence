/*jslint browser */
/*global BABYLON */

const B = BABYLON;
const V3 = BABYLON.Vector3;
const createGround = B.MeshBuilder.CreateGround;
const createSphere = B.MeshBuilder.CreateSphere;
const createCapsule = B.MeshBuilder.CreateCapsule;
const zeroVector = BABYLON.Vector3.Zero;
const blue = new B.Color3(186/255, 187/255, 241/255);
const pink = new B.Color3(244/255, 184/255, 228/255);
const black = new B.Color3(1, 1, 1);

function createScene(canvas, G) {
    const Engine = new B.Engine(canvas);
    const S = new B.Scene(Engine);
    S.glow = new BABYLON.GlowLayer("glow", S);
    S.clearColor = new B.Color4(0, 0, 0, 0);
    S.ambientColor = new B.Color4(1, 1, 1, 1);

    S.camera = new B.FreeCamera("camera", new V3(0, 15, 8), S);
    S.ground = createGround("ground", {
        height: G.height,
        width: G.width
    }, S);
    S.sphere = createSphere("sphere", {
        diameter: G.ball.diameter
    }, S);

    S.camera.setTarget(zeroVector());
    S.ground.position = new V3(0, -1, 0);
    S.ground.material = new B.StandardMaterial(`ground_mat`, S);

    S.ballLight = new B.PointLight("ballLight", new V3(0, 2, 0), S);

    Object.assign(S, {
        lpaddle: createCapsule("lpaddle", {
            height: G.p1.height,
            orientation: new V3(0, 0, 1),
            radius: G.p1.width
        }, S),
        rpaddle: createCapsule("rpaddle", {
            height: G.p2.height,
            orientation: new V3(0, 0, 1),
            radius: G.p2.width
        }, S)
    });

    [S.lpaddle, S.rpaddle, S.sphere].forEach(function (mesh) {
        mesh.material = new B.StandardMaterial(`${mesh.name}_mat`, S);
    });
    S.lpaddle.material.emissiveColor = blue;
    S.rpaddle.material.emissiveColor = pink;
    S.sphere.material.emissiveColor = black;
    S.scoreSpheres = Array.from({length: 4}, function (ignore, i) {
        return createSphere(`scoreSphere${i + 1}`, {
            diameter: G.ball.diameter
        }, S);
    });
    S.scoreSpheres.forEach(function (mesh) {
        mesh.material = new B.StandardMaterial(`${mesh.name}_mat`, S);
    });
    return (S);
}

const createRenderer = Object.freeze(
    function (canvas, G) {
        const S = createScene(canvas, G);
        S.scoreSpheres.forEach(function (sphere) {
            sphere.ratio = 0;
        });

        return function render(G) {
            let dark = document.documentElement.className === "dark";
            if (dark) {
                S.glow.intensity = 0.5;
                S.ballLight.intensity = 0.03;
                S.ground.material.ambientColor = new B.Color3(0.08, 0.1, 0.15);
            } else {
                S.ground.material.ambientColor = new B.Color3(35/255, 38/255, 52/255);
                S.glow.intensity = 0.3;
                S.ballLight.intensity = 0.0;
            }
            let now = Date.now();
            S.lpaddle.position.set(G.p1.x, Math.sin(now / 500) / 8, G.p1.z);
            S.rpaddle.position.set(G.p2.x, Math.cos(now / 500) / 8, G.p2.z);
            S.sphere.position.set(G.ball.x, 0, G.ball.z);
            S.ballLight.position.set(G.ball.x, 1, G.ball.z);
            let r1 = G.p1.score / G.winningScore;
            let r2 = G.p2.score / G.winningScore;
            if (G.p1.roundsWon < 1) {
                S.scoreSpheres[0].material.emissiveColor = blue.scale(r1);
            } else if (G.p1.roundsWon < 2) {
                S.scoreSpheres[1].material.emissiveColor = blue.scale(r1);
            } else {
                S.scoreSpheres[1].material.emissiveColor = blue.scale(1);
            }
            if (G.p2.roundsWon < 1) {
                S.scoreSpheres[2].material.emissiveColor = pink.scale(r2);
            } else if (G.p2.roundsWon < 2) {
                S.scoreSpheres[3].material.emissiveColor = pink.scale(r2);
            } else {
                S.scoreSpheres[3].material.emissiveColor = pink.scale(1);
            }
            S.scoreSpheres[0].position.set(10.5, Math.sin(now / 800) / 4, 0);
            S.scoreSpheres[1].position.set(10.5, Math.cos(now / 800) / 4, 1);
            S.scoreSpheres[2].position.set(-10.5, Math.cos(now / 800) / 4, 0);
            S.scoreSpheres[3].position.set(-10.5, Math.sin(now / 800) / 4, 1);
            S.render();
        };
    }
);

export {createRenderer};
