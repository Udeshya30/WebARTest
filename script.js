import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, model;
let reticle, controller, hitTestSource = null, hitTestSourceRequested = false;

function init() {
    // Initialize Three.js scene
    const container = document.getElementById('model-container');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Load 3D model
    const loader = new GLTFLoader();
    loader.load('models/earth.glb', (gltf) => {
        model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, -2);
    });
    
    // Add lights
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(ambientLight);

    // Add controls for rotating and zooming the model
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;

    camera.position.z = 2;

    // Animation loop
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });

    // AR Button event
    document.getElementById('ar-button').addEventListener('click', startAR);
}

function startAR() {
    navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test']
    }).then(onSessionStarted);
}

function onSessionStarted(session) {
    renderer.xr.setSession(session);

    const refSpace = renderer.xr.getReferenceSpace();
    session.requestReferenceSpace('viewer').then(viewerSpace => {
        session.requestHitTestSource({ space: viewerSpace }).then(source => {
            hitTestSource = source;
        });
    });

    session.addEventListener('select', onSelect);

    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.15, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
    });

    renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
    if (frame) {
        const refSpace = renderer.xr.getReferenceSpace();
        const viewerSpace = renderer.xr.getViewerPose(refSpace);

        if (hitTestSource && viewerSpace) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];

                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(refSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }

    renderer.render(scene, camera);
}

function onSelect() {
    if (reticle.visible) {
        model.position.setFromMatrixPosition(reticle.matrix);
        model.visible = true;
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
