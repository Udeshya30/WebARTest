import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer;
let reticle;
let controller;
let model = null;
let hitTestSource = null;
let hitTestSourceRequested = false;

function init() {
    const container = document.getElementById('model-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(ambientLight);

    const loader = new GLTFLoader();
    loader.load('models/earth.glb', function (gltf) {
        model = gltf.scene;
        model.visible = false;
        scene.add(model);
    });

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Reticle (tracking object)
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    document.body.appendChild(VRButton.createButton(renderer));

    animate();
}

function onSelect() {
    if (reticle.visible) {
        if (model) {
            model.position.setFromMatrixPosition(reticle.matrix);
            model.visible = true;
        }
    }
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((refSpace) => {
                session.requestHitTestSource({ space: refSpace }).then((source) => {
                    hitTestSource = source;
                });
            });

            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];

                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

                document.getElementById('prompt-message').style.display = 'none';
            } else {
                reticle.visible = false;
                document.getElementById('prompt-message').style.display = 'block';
            }
        }
    }

    renderer.render(scene, camera);
}

document.getElementById('ar-button').addEventListener('click', () => {
    document.getElementById('model-container').style.display = 'none';
    document.getElementById('ar-button').style.display = 'none';
    document.getElementById('prompt-message').style.display = 'block';
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    renderer.setAnimationLoop(render);
});

init();
