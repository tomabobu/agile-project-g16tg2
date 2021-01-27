let controls, camera, scene, renderer;
let textureEquirec;
var lights = [];
var tableModel = [];
var cakeModels = [];
var instances;
var textures = [];

var options = {
	'initialSetup' : true,
	'baseCake' : 'Cake_round',
	'baseHeight' : 50,
	'baseMatrix' : new THREE.Matrix4().makeScale(0.85,0.85,0.85),
	'tierHeight' : 40,
	'tierScaling' : 0.22,
	'orbitPoint' : new THREE.Vector3( 0, 50 / 2, 0 ),

};


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
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	//startup models loading
	loader = new THREE.GLTFLoader();
	loader.load( '../assets/base_02.gltf', function ( gltf ) {
		gltf.scene.children.forEach(element => {
			if (element.name == "Lights") {
				var load = true;
				lightsGroup = element.children;

				lightsGroup.forEach( light => {
					if (load) {
						newLight = new THREE.SpotLight("#" + light.name.split("_")[0], 0.15);
						newLight.position.set(light.position.x, light.position.y , light.position.z);
						newLight.castShadow = true;
						newLight.penumbra  = 1;
						newLight.angle = Math.PI/6;
						newLight.shadow.bias = -0.000001;
						newLight.shadow.mapSize.width = 512;
						newLight.shadow.mapSize.height = 512;
						newLight.shadow.camera.near = 0.5;
						newLight.shadow.camera.far = 3000;
						newLight.shadow.focus = 1;

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
				// console.log(element);
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
				// cakeModels[cakeName].applyMatrix4(cakeModels[cakeName].matrixWorld.invert())
				// cakeModels[cakeName].applyMatrix4(options.baseMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(0,options.baseHeight*0.5, 0 )));

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
		updateEditor();
		// setBaseScale(1);
	}, undefined, function ( error ) {
		console.error( error );
	} );


	//setup controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.minDistance = 150;
	controls.maxDistance = 800;
	controls.enableDamping = true;
	controls.dampingFactor = 0.1;
	controls.target = options.orbitPoint;
	// controls.autoRotate = true;
	// scene.add( new THREE.AxesHelper(500));

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
	camera.lookAt( options.orbitPoint );
	renderer.render( scene, camera );
}

function updateEditor() {
	//removing all cakes
	for (const cake in cakeModels) {
		scene.remove(cakeModels[cake])
	}
	//removing instances
	if (instances) {
		scene.remove(instances);
	}

	// adding lights and table
	if (options.initialSetup) {
		scene.add(tableModel);
		lights.forEach(light => scene.add(light));
	}

	//adding base cake
	if (options.baseCake) {
		if (options.baseCake in cakeModels) {

			// console.log(cakeModels[options.baseCake].matrix);
			cakeModels[options.baseCake].applyMatrix4(cakeModels[options.baseCake].matrixWorld.invert())
			cakeModels[options.baseCake].applyMatrix4(options.baseMatrix.clone());
			// cakeModels[options.baseCake].updateMatrix();
			scene.add(cakeModels[options.baseCake]);
		}
		// console.log(cakeModels[options.baseCake]);
		if (options.numberOfTiers > 1) {
			source = cakeModels[options.baseCake];
			material = Object.create(cakeModels[options.baseCake].material);
			instances = new THREE.InstancedMesh(source.geometry, material, options.numberOfTiers-1);
			instances.instanceMatrix.setUsage( THREE.DynamicDrawUsage );

			for (i=1; i<options.numberOfTiers; i++) {
				transform = options.baseMatrix.clone();
				translateMatrix =  new THREE.Matrix4().makeTranslation(0, i*options.tierHeight, 0 );
				scaleMatrix =  new THREE.Matrix4().makeScale(1- i* options.tierScaling, 1, 1 - i*options.tierScaling);
				transform.multiply(translateMatrix);
				transform.multiply(scaleMatrix);
				instances.setMatrixAt( i-1, transform );
			}
			instances.instanceMatrix.needsUpdate = true;
			scene.add( instances );

			//set orbit point
			options.orbitPoint.y = (options.baseHeight + (options.numberOfTiers -1 )* options.tierHeight) /2;
		}
	}

}

function setBaseModel(type) {
	options.baseCake = type;
	updateEditor();
}

function setNumberOfTiers(number) {
	options.numberOfTiers = number;
	updateEditor();
}

function setBaseScale(number) {
	options.baseMatrix =  new THREE.Matrix4().makeScale(number, number, number);
	updateEditor();
	// console.log(options.baseMatrix);
}

//check if base model is used...and then remove
//instantiate model
//add stereo option
//show a cm as reference on the table (or plates);