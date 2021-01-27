let controls, camera, scene, renderer;
let textureEquirec;
let sphereMesh, sphereMaterial;
var lights = [];
var tableModel = [];
var cakeModels = [];
var textures = [];

init();
animate();

function init() {

	// CAMERAS

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / (2*window.innerHeight), 1, 100000 );
	camera.position.set( 0, 200, 300 );
	//TODO set limits on camera rotation

	// SCENE

	scene = new THREE.Scene();

	//setup lighting
	hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.35);
	scene.add(hemiLight);

	// Textures
	const textureLoader = new THREE.TextureLoader();

	//environment texture
	textureEquirec = textureLoader.load( '../images/Classic-Kitchen-03.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
	textureEquirec.encoding = THREE.sRGBEncoding;
	scene.background = textureEquirec;


	//setup renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth/2, window.innerHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	$('#editor-3d').append(renderer.domElement);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default

	//startup models loading
	loader = new THREE.GLTFLoader();
	loader.load( '../assets/base_02.gltf', function ( gltf ) {
		gltf.scene.children.forEach(element => {
			if (element.name == "Lights") {
				var load = true;
				lightsGroup = element.children;

				lightsGroup.forEach( light => {
					if (load) {
						//TODO update lighting to have intensity and color from other attributes
						newLight = new THREE.SpotLight("#" + light.name.split("_")[0], 0.15);
						newLight.position.set(light.position.x, light.position.y , light.position.z);
						newLight.castShadow = true;
						newLight.penumbra  = 1;
						// newLight.decay = 0;
						newLight.angle = Math.PI/6;
						newLight.shadow.bias = -0.000001;
						newLight.shadow.mapSize.width = 512;
						newLight.shadow.mapSize.height = 512;
						newLight.shadow.camera.near = 0.5; // default
						newLight.shadow.camera.far = 3000; // default
						newLight.shadow.focus = 1; // default

						lights.push(newLight);
						// const spotLightHelper = new THREE.SpotLightHelper( newLight );
						// scene.add( spotLightHelper );
						// const helper = new THREE.CameraHelper( newLight.shadow.camera );
						// scene.add( helper );
						// load=false;
					}
				});
			}
			if(element.name.startsWith("Cake")) {
				cakeName = element.name;
				cakeModels[cakeName] = [];
				cakeModels[cakeName] = element;
				cakeModels[cakeName].name = cakeName;
				cakeModels[cakeName].material = new THREE.MeshStandardMaterial( {
					color: 0xffffff,
					envMapIntensity : 1,
					refractionRatio : 2,
					metalness: 0,
					roughness: 0.9,
					envMap : textureEquirec,
				} );

				if ( cakeModels[cakeName].isMesh ) {
					cakeModels[cakeName].castShadow = true;
					cakeModels[cakeName].receiveShadow = true;
					// if(cakeModels[cakeName].material.map) cakeModels[cakeName].material.map.anisotropy = 1;
				}

			}
			if(element.name == "Table") {
				tableModel = element;
				textures['concrete'] = textureLoader.load( '../images/concrete.jpg' );

				tableModel.material = new THREE.MeshStandardMaterial( {
					map:textures['concrete'],
					envMapIntensity : 1.5,
					metalness: 0,
					roughness: 0.3,
					envMap : textureEquirec,
				} );


				if ( tableModel.isMesh ) {
					tableModel.castShadow = false;
					tableModel.receiveShadow = true;
					// if(tableModel.material.map) tableModel.material.map.anisotropy = 1;
				}
			}
		});
		updateEditor({
			'initialSetup' : true,
			'baseCake' : 'Cake_round'
		});
	}, undefined, function ( error ) {
		console.error( error );
	} );


	//setup controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.minDistance = 150;
	controls.maxDistance = 800;
	// controls.autoRotate = true;
	scene.add( new THREE.AxesHelper(500));

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
	camera.aspect = window.innerWidth / ( 2* window.innerHeight);
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth/2, window.innerHeight );
}


function animate() {
	requestAnimationFrame( animate );
	controls.update();
	render();
}

function render() {
	camera.lookAt( scene.position );
	renderer.render( scene, camera );
}

function updateEditor(settings) {
	//removing all cakes
	for (const cake in cakeModels) {
		scene.remove(cakeModels[cake])
	}
	// adding lights and table
	if (settings.initialSetup) {
		scene.add(tableModel);
		lights.forEach(light => scene.add(light));
	}
	//adding base cake
	if (settings.baseCake) {
		if (settings.baseCake in cakeModels) {
			scene.add(cakeModels[settings.baseCake]);
		}

	}

}





// let scene, camera, renderer, controls, light, model;

// function init() {

//   scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xdddddd);
//  /* scene.background = new THREE.CubeTextureLoader()
// 	.setPath( 'skybox/' )
// 	.load( [
// 	  'posx.jpg',
// 	  'negx.jpg',
// 	  'posy.jpg',
// 	  'negy.jpg',
// 	  'posz.jpg',
// 	  'negz.jpg'
// 	] );*/

//   camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,1,5000);
//   camera.position.set(0,25,25);
//   controls = new THREE.OrbitControls(camera);

//  // scene.add( new THREE.AxesHelper(500));

//   light = new THREE.SpotLight(0xffa95c,4);
//   light.position.set(-50,50,50);
//   light.castShadow = true;
//   light.shadow.bias = -0.0001;
//   light.shadow.mapSize.width = 1024*4;
//   light.shadow.mapSize.height = 1024*4;
//   scene.add( light );

//   hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
//   scene.add(hemiLight);

//   renderer = new THREE.WebGLRenderer();
//   renderer.toneMapping = THREE.ReinhardToneMapping;
//   renderer.toneMappingExposure = 2.3;
//   renderer.setSize(window.innerWidth,window.innerHeight);
//   renderer.shadowMap.enabled = true;
//   document.body.appendChild(renderer.domElement);


//   new THREE.GLTFLoader().load('model/scene.gltf', result => {
// 	model = result.scene.children[0];
// 	model.position.set(0,-5,-25);
// 	model.traverse(n => { if ( n.isMesh ) {
// 	  n.castShadow = true;
// 	  n.receiveShadow = true;
// 	  if(n.material.map) n.material.map.anisotropy = 1;
// 	}});
// 	scene.add(model);

// 	animate();
//   });
// }
// function animate() {
//   renderer.render(scene,camera);
//   light.position.set(
// 	camera.position.x + 10,
// 	camera.position.y + 10,
// 	camera.position.z + 10,
//   );
//   requestAnimationFrame(animate);
// }
// init();
