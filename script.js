import * as THREE from 'three';

let camera, scene, renderer;
let controller;

function init() {
    const container = document.getElementById('model-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    document.body.appendChild(VRButton.createButton(renderer));

    animate();
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
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
