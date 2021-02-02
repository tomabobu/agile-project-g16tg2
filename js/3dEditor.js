let controls, camera, scene, renderer;
let textureLoader, textureEquirec;
var lights = [];
var tableModel = [];
var cakeModels = [];
var instances = [];
var textures = [];
var materials = [];

var options = {
	'step': 1,
	'initialSetup' : true,
	'baseCake' : 'Cake_round',
	'baseHeight' : 50,
	'baseMatrix' : new THREE.Matrix4().makeScale(0.85,0.85,0.85),
	'tierHeight' : 40,
	'tierScaling' : 0.22,
	'numberOfTiers' : 1,
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
	textureLoader = new THREE.TextureLoader();

	//environment texture
	textureEquirec = textureLoader.load( './images/Classic-Kitchen-03.jpg' );
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

	//setting default materials
	materials['dafaultLambert'] = new THREE.MeshStandardMaterial( {
		color: 0xffffff,
		envMapIntensity : 1,
		refractionRatio : 2,
		metalness: 0,
		roughness: 0.9,
		envMap : textureEquirec,
		side: THREE.DoubleSide
	});

	textures['concrete'] = textureLoader.load( './images/concrete.jpg' );

	materials['defaultTable'] = new THREE.MeshStandardMaterial( {
		map:textures['concrete'],
		envMapIntensity : 1.5,
		metalness: 0,
		roughness: 0.3,
		envMap : textureEquirec,
	} );

	//startup models loading
	loader = new THREE.GLTFLoader();
	loader.load( './assets/base.gltf', function ( gltf ) {
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
				cakeName = element.name;
				cakeModels[cakeName] = [];
				cakeModels[cakeName] = element;
				cakeModels[cakeName].name = cakeName;

				cakeModels[cakeName].material = materials['dafaultLambert'];
				if (cakeModels[cakeName].children.length) {
					cakeModels[cakeName].children.forEach(child => {
						child.material = materials['dafaultLambert'];
					})
				}

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
				tableModel.material = materials['defaultTable']
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
	for (instance in instances) {
		scene.remove(instances[instance]);
	}

	// adding lights and table
	if (options.initialSetup) {
		scene.add(tableModel);
		lights.forEach(light => scene.add(light));
	}

	//adding base cake
	if (options.baseCake) {
		if (options.baseCake in cakeModels) {
			cakeModels[options.baseCake].applyMatrix4(cakeModels[options.baseCake].matrixWorld.invert())
			cakeModels[options.baseCake].applyMatrix4(options.baseMatrix.clone());
			scene.add(cakeModels[options.baseCake]);
		}

		if (options.numberOfTiers > 1) {
			source = cakeModels[options.baseCake];
			material = Object.create(cakeModels[options.baseCake].material);

			if (cakeModels[options.baseCake].children.length) {
				if (cakeModels[options.baseCake].children[0]) {
					instanceCakeTier(cakeModels[options.baseCake].children[0].geometry, Object.create(cakeModels[options.baseCake].children[0].material));
				}

				if (cakeModels[options.baseCake].children[1]) {
					instanceCakeTier(cakeModels[options.baseCake].children[1].geometry, Object.create(cakeModels[options.baseCake].children[1].material));
				}
			} else {
				instanceCakeTier(source.geometry, material);
			}

		}
		options.orbitPoint.y = (options.baseHeight + (options.numberOfTiers -1 )* options.tierHeight) /2;
	}

}
function instanceCakeTier(geometry, material) {
	instance = new THREE.InstancedMesh(geometry, material, options.numberOfTiers-1);
	instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
	tierRotation = 360/options.numberOfTiers;
	for (i=1; i<options.numberOfTiers; i++) {
		transform = options.baseMatrix.clone();
		translateMatrix =  new THREE.Matrix4().makeTranslation(0, i*options.tierHeight, 0 );
		// rotationMatrix =  new THREE.Matrix4().makeRotationY((i*tierRotation)*Math.PI/180);
		scaleMatrix =  new THREE.Matrix4().makeScale(1- i* options.tierScaling, 1, 1 - i*options.tierScaling);
		transform.multiply(translateMatrix);
		// transform.multiply(rotationMatrix);
		transform.multiply(scaleMatrix);
		instance.setMatrixAt( i-1, transform );
	}
	instance.instanceMatrix.needsUpdate = true;
	scene.add( instance );
	instances.push(instance);
}

function setBaseModel(type) {
	options.baseCake = type;
	options.step = 2;
	updateEditor();

}

function setNumberOfTiers(number) {
	options.numberOfTiers = number;
	options.step = 3;
	updateEditor();
}

function setBaseScale(x,y,z) {
	options.baseMatrix =  new THREE.Matrix4().makeScale(x, y, z);
	options.step = 4;
	updateEditor();
}


function loadMaterial(name) {
	textures[name+'_diffuse'] = textureLoader.load( './images/materials/'+name+'/'+ name+'_diffuse.jpg' );
	textures[name+'_diffuse'].wrapS = THREE.RepeatWrapping;
	textures[name+'_diffuse'].wrapT = THREE.RepeatWrapping;
	textures[name+'_diffuse'].repeat.set( 1, 1 );

	textures[name+'_gloss'] = textureLoader.load( './images/materials/'+name+'/'+ name+'_glossiness.jpg' );
	textures[name+'_gloss'].wrapS = THREE.RepeatWrapping;
	textures[name+'_gloss'].wrapT = THREE.RepeatWrapping;
	textures[name+'_gloss'].repeat.set( 1, 1 );
	// textures[name+'_height'] = textureLoader.load( './images/materials/'+name+'/'+ name+'_height.jpg' );

	textures[name+'_normal'] = textureLoader.load( './images/materials/'+name+'/'+ name+'_normal.jpg' );
	textures[name+'_normal'].wrapS = THREE.RepeatWrapping;
	textures[name+'_normal'].wrapT = THREE.RepeatWrapping;
	textures[name+'_normal'].repeat.set( 1, 1 );

	materials[name] = new THREE.MeshStandardMaterial( {
		// color: 0x0066ff,
		map:textures[name+'_diffuse'],
		normalMap: textures[name+'_normal'],
		roughnessMap : textures[name+'_gloss'],
		// displacementMap: textures[name+'_height'],
		// displacementScale: 10,
		roughness: 1.3,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : 1.5,
		side: THREE.DoubleSide
	} );
}

function setBaseMaterial(name, hasSecondMaterial) {
	if (!(name in materials)) {
		loadMaterial(name);
	}
	if (hasSecondMaterial) {
		if (!(name+"_second" in materials)) {
			loadMaterial(name+"_second");
		}
		setMaterialToAllBaseGeoms(name, hasSecondMaterial);
	} else{
		setMaterialToAllBaseGeoms(name);
	}

	updateEditor();
}

function setMaterialToAllBaseGeoms(name, hasSecondMaterial= false) {
	for( cake in cakeModels) {
		cakeModels[cake].material = materials[name];
		if (cakeModels[cake].children.length) {
			cakeModels[cake].children.forEach(child => {
				child.material = materials[name];
			})
		}
		if (hasSecondMaterial) {
			if (cakeModels[cake].children.length) {
				cakeModels[cake].children[1].material = materials[name+"_second"];
			}
		}
	}
}


//use geom instead of instances for base geoms to apply UV offsets for tier variation
//preload materials before switching it (chrome material shown while loading model)
//add stereo option
//show a cm as reference on the table (or plates);