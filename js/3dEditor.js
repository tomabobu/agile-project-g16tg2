let controls, camera, scene, renderer;
let textureLoader, textureEquirec;
var lights = [];
var tableModel = [];
var cakeModels = [];
var instances = [];
var textures = [];
var materials = [];

var sizes = {
	'small' : [0.65, 0.75, 0.65],
	'medium':[0.85, 0.85, 0.85],
	'big':[1.1, 0.9, 1.1]
};

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
	'materialsUsed' : [],
	'baseColor' : 0xFFFFFF,
	'topBorder' : null,
	'bottomBorder' : null,
	'cakeSize' : 'medium',
};


init();
animate();

function init() {

	// CAMERAS

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / (2*window.innerHeight), 1, 100000 );
	camera.position.set( 0, 200, 300 );


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
				cakeModels[cakeName].topBorder = createCurve(cakeName, 'top');
				cakeModels[cakeName].bottomBorder = createCurve(cakeName, 'bottom');

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

function addBorderInstances(position) {
	if (position == 'top') {
		curve = cakeModels[options.baseCake].topBorder;
	} else {
		curve = cakeModels[options.baseCake].bottomBorder;
	}
	numPoints = 0;
	if (options.cakeSize == 'small') {
		numPoints = 10;
	}
	if (options.cakeSize == 'medium') {
		numPoints = 20;
	}
	if (options.cakeSize == 'big') {
		numPoints = 30;
	}
	const points = curve.getPoints(numPoints);
	const geometry = new THREE.BufferGeometry().setFromPoints( points );
	const material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

	// Create the final object to add to the scene
	const curveObject = new THREE.Line( geometry, material );
	curveObject.rotateOnWorldAxis( new THREE.Vector3(1,0,0), Math.PI/2);
	if (position == 'top') {
		translateMatrix =  new THREE.Matrix4().makeTranslation(0, 50, 0 );
	} else {
		translateMatrix =  new THREE.Matrix4().makeTranslation(0, 1, 0 );
	}

	baseScale = options.baseMatrix.clone();
	baseScale.multiply(translateMatrix);
	curveObject.applyMatrix4(baseScale);

	//don't add curve to the scene, add the instances
	scene.add(curveObject);
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
			if (options.topBorder) {
				//add top border for base cake
				addBorderInstances('top');
			}
			if (options.bottomBorder) {
				addBorderInstances('bottom');
				//add bottom border for base cake
			}
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

function setBaseScale(size) {
	options.cakeSize = size;
	options.baseMatrix =  new THREE.Matrix4().makeScale(sizes[size][0], sizes[size][1], sizes[size][2]);
	options.step = 4;
	updateEditor();
}
function loadTexture(name, suffix,  scaleUV) {
	fullName = name + suffix;
	textures[fullName] = textureLoader.load( './images/materials/'+name+'/'+ fullName + '.jpg',
	// onLoad callback
	function ( texture ) {
		// in this example we create the material when the texture is loaded
	},
	// onProgress callback currently not supported
	undefined,

	// onError callback
	function ( err ) {
		console.log( name+'/'+ fullName+'.jpg - texture not found.' );
		return false;
	});

	textures[fullName].wrapS = THREE.RepeatWrapping;
	textures[fullName].wrapT = THREE.RepeatWrapping;
	textures[fullName].repeat.set(scaleUV,scaleUV );
	return true;
}

function loadMaterial(name, scaleUV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	let diffuse = glossiness = normal = true;
	diffuse = loadTexture(name, '_diffuse', scaleUV);
	glossiness =  loadTexture(name, '_glossiness', scaleUV);
	normal =  loadTexture(name, '_normal', scaleUV);


	materials[name+scaleUV] = new THREE.MeshStandardMaterial( {
		color: options['baseColor'],
		map:diffuse ? textures[name+'_diffuse'] : null,
		normalMap: normal ? textures[name+'_normal'] : null,
		normalScale: new THREE.Vector2( 1, 1 ),
		roughnessMap : glossiness ? textures[name+'_gloss'] : null,
		roughness: roughness,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity,
		side: THREE.DoubleSide
	} );
}


function setColorToUsedMaterials(newColor) {
	options['materialsUsed'].forEach(material => {
		materials[material].color.setHex(newColor);
	});
	options['baseColor'] = newColor;

}

function resetBaseColorAndSetBaseMaterial(firstMaterialName, secondMaterialName, scaleUVFirst= 1, scaleUVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	options['baseColor'] = 0xffffff;
	setBaseMaterial(firstMaterialName, secondMaterialName, scaleUVFirst, scaleUVSecond,  roughness, envMapIntensity);
}

function setBaseMaterial(firstMaterialName, secondMaterialName, scaleUVFirst= 1, scaleUVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	if (!(firstMaterialName in materials)) {
		loadMaterial(firstMaterialName, scaleUVFirst, roughness, envMapIntensity);
	}
	if (secondMaterialName) {
		if (!(secondMaterialName in materials)) {
			loadMaterial(secondMaterialName, scaleUVSecond,  roughness, envMapIntensity);
		}
		setMaterialToAllBaseGeoms(firstMaterialName + scaleUVFirst, secondMaterialName + scaleUVSecond);
	} else{
		setMaterialToAllBaseGeoms(firstMaterialName + scaleUVFirst);
	}

	updateEditor();
}

function setMaterialToAllBaseGeoms(firstMaterialName, secondMaterialName= false) {
	for( cake in cakeModels) {
		options['materialsUsed'] = [firstMaterialName];
		cakeModels[cake].material = materials[firstMaterialName];
		if (cakeModels[cake].children.length) {
			cakeModels[cake].children.forEach(child => {
				child.material = materials[firstMaterialName];
			})
		}
		if (secondMaterialName) {
			if (cakeModels[cake].children.length) {
				cakeModels[cake].children[1].material = materials[secondMaterialName];
				options['materialsUsed'].push(secondMaterialName);
			}
		}
	}
}


function roundedRect( ctx, x, y, width, height, radius ) {
	ctx.moveTo( x, y + radius );
	ctx.lineTo( x, y + height - radius );
	ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
	ctx.lineTo( x + width - radius, y + height );
	ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
	ctx.lineTo( x + width, y + radius );
	ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
	ctx.lineTo( x + radius, y );
	ctx.quadraticCurveTo( x, y, x, y + radius );
}

function createCurve(type, position) {
	if (type == 'Cake_round') {
		l1 = 111;
		l2 = 111;
	}
	if (type == 'Cake_square') {
		l1 = 200;
		l2 = 200;
	}
	if (type == 'Cake_sheet') {
		l1 = 240;
		l2 = 160;
	}
	if (position == 'top') {
		l1 = l1 * 0.95;
		l2 = l2 * 0.95;
	}
	if (type == 'Cake_round') {
		curve = new THREE.EllipseCurve(
			0,  0,            // ax, aY
			l1, l2,           // xRadius, yRadius
			0,  2 * Math.PI,  // aStartAngle, aEndAngle
			false,            // aClockwise
			90                 // aRotation
		);
		console.log(curve);
	} else if (type == 'Cake_square' || type == 'Cake_sheet') {
		curve = new THREE.Shape();
		roundedRect(curve, -l1/2, -l2/2, l1, l2, 10 );
	}

	// const points = curve.getPoints( 50 );
	// const geometry = new THREE.BufferGeometry().setFromPoints( points );
	// const material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

	// // Create the final object to add to the scene
	// const curveObject = new THREE.Line( geometry, material );
	// curveObject.rotateOnWorldAxis( new THREE.Vector3(1,0,0), Math.PI/2);
	// curveObject.applyMatrix4(options.baseMatrix.clone());
	// if (position == 'bottom') {
	// 	curveObject.translateZ(-1);
	// }
	// if (position == 'top') {
	// 	curveObject.translateZ(-43);
	// }
	return curve;
}

function setBorder(type, position) {
	if (position == 'top') {
		options.topBorder = type;
	}
	if (position == 'bottom') {
		options.bottomBorder = type;
	}
	updateEditor();
}





//TODO set limits on camera rotation
//use geom instead of instances for base geoms to apply UV offsets for tier variation
//preload materials before switching it (chrome material shown while loading model)
//add stereo option
//show a cm as reference on the table (or plates);