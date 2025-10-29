/*jslint browser */
/*global BABYLON */

const createGround = BABYLON.MeshBuilder.CreateGround;
const createSphere = BABYLON.MeshBuilder.CreateSphere;
const createCapsule = BABYLON.MeshBuilder.CreateCapsule;
const zeroVector = BABYLON.Vector3.Zero;

function createScene(canvas, G) {
    const B = BABYLON;
    const V3 = BABYLON.Vector3;

    const Engine = new B.Engine(canvas);
    const S = new B.Scene(Engine);
    S.clearColor = new BABYLON.Color4(0, 0, 0, 0);

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

    S.light3 = new B.PointLight("light3", new V3(0, 2, 0), S);
    S.light3.intensity = 0.1;

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

    const paddleColor = new B.Color3(1, 1, 1);
    [S.lpaddle, S.rpaddle, S.sphere].forEach(function (mesh) {
        mesh.material = new B.StandardMaterial(`${mesh.name}_mat`, S);
        mesh.material.emissiveColor = paddleColor;
    });
    return (S);
}

const createRenderer = Object.freeze(
    function (canvas, G) {
        const S = createScene(canvas, G);

        return function render(G) {
            S.lpaddle.position.set(G.p1.x, 0, G.p1.z);
            S.rpaddle.position.set(G.p2.x, 0, G.p2.z);
            S.sphere.position.set(G.ball.x, 0, G.ball.z);
            S.light3.position.set(G.ball.x, 1, G.ball.z);
            S.render();
        };
    }
);

export {createRenderer};
