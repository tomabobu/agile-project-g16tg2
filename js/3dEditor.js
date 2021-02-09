
let controls, camera, scene, renderer;
let textureLoader, textureEquirec;
var lights = [];
var tableModel = [];
var cakeModels = [];
var borderModels = [];
var instances = [];
var textures = [];
var materials = [];
var topBorderPoints = [];
var bottomBorderPoints = [];



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
	'tierHeight' : 50,
	'tierScaling' : 0.22,
	'tierBorderScaling' : 0.04,
	'numberOfTiers' : 1,
	'orbitPoint' : new THREE.Vector3( 0, 50 / 2, 0 ),
	'materialsUsed' : [],
	'baseColor' : 0xFFFFFF,
	'topBorderColor' : 0xFFFFFF,
	'bottomBorderColor' : 0xFFFFFF,
	'topBorder' : null,
	'bottomBorder' : null,
	'cakeSize' : 'medium',
	'borderInstancesReductionRate' : 0.2, //upper tiers need fewer instances
	'bottomBorderInstancesIncreaseRate' : 0.2, // bottom border needs more instances than the top
	'smallNrInst' : 65,
	'mediumNrInst' : 80,
	'bigNrInst' : 95,
	'topBorderRadiusScale' : 0.95,
	'bottomBorderRadiusScale' : 1,
	'baseMaterial' : {},

};


init();
animate();

function init() {

	// const frame = new Nodes.NodeFrame();

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

	renderer.gammaFactor = 2.2;
	renderer.outputEncoding = THREE.sRGBEncoding;

	//setting default materials
	materials['dafaultLambert'] = new THREE.MeshStandardMaterial( {
		color: 0xffffff,
		envMapIntensity : 1,
		refractionRatio : 2,
		metalness: 0,
		roughness: 0.9,
		envMap : textureEquirec,
		side: THREE.FrontSide
	});
	materials['defaultTopBorder'] = new THREE.MeshStandardMaterial( {
		color: 0xffffff,
		envMapIntensity : 1,
		refractionRatio : 2,
		metalness: 0,
		roughness: 0.2,
		envMapIntensity : 1.7,
		envMap : textureEquirec,
		side: THREE.FrontSide
	});
	materials['defaultBottomBorder'] = new THREE.MeshStandardMaterial( {
		color: 0xffffff,
		envMapIntensity : 1,
		refractionRatio : 2,
		metalness: 0,
		roughness: 0.2,
		envMapIntensity : 1.7,
		envMap : textureEquirec,
		side: THREE.FrontSide
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
				// var load = true;
				lightsGroup = element.children;

				lightsGroup.forEach( light => {
					// if (load) {
						newLight = new THREE.SpotLight("#" + light.name.split("_")[0], 0.15);
						newLight.position.set(light.position.x, light.position.y , light.position.z);
						newLight.castShadow = true;
						newLight.penumbra  = 1;
						newLight.angle = Math.PI/6;
						newLight.shadow.bias = -0.0001;
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
					// }
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
						if ( child.isMesh ) {
							child.castShadow = true;
							child.receiveShadow = true;
						}
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
							}
			if(element.name.startsWith("Borders")) {


				element.children.forEach( border => {
					borderName = border.name;
					borderModels[borderName+"top"] = [];
					borderModels[borderName+"top"] = border;
					borderModels[borderName+"top"].name = borderName;

					borderModels[borderName+"top"].material = materials['defaultTopBorder'];
					if ( borderModels[borderName+"top"].isMesh ) {
						borderModels[borderName+"top"].castShadow = false;
						borderModels[borderName+"top"].receiveShadow = false;
					}

					borderModels[borderName+"bottom"] = [];
					borderModels[borderName+"bottom"] = border.clone();
					borderModels[borderName+"bottom"].name = borderName;

					borderModels[borderName+"bottom"].material = materials['defaultBottomBorder'];
					if ( borderModels[borderName+"bottom"].isMesh ) {
						borderModels[borderName+"bottom"].castShadow = false;
						borderModels[borderName+"bottom"].receiveShadow = false;
					}


				});


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
	camera.lookAt( options.orbitPoint );
	renderer.render( scene, camera );
}

function addBorderPoints(position, transform = null, instanceIndex = 0) {
	//add adaptive scaling for top border on all tiers
	if (position == 'top' && transform) {
		scaleMatrix =  new THREE.Matrix4().makeScale(1- instanceIndex* options.tierBorderScaling, 1, 1 - instanceIndex*options.tierBorderScaling);
		transform.multiply(scaleMatrix);
	}
	if (position == 'top') {
		curve = cakeModels[options.baseCake].topBorder;
		nrMultiplier = 1;
	} else {
		curve = cakeModels[options.baseCake].bottomBorder;
		nrMultiplier = 1 + options.bottomBorderInstancesIncreaseRate
	}
	numPoints = 0;
	if (options.cakeSize == 'small') {
		numPoints = parseInt(options.smallNrInst * (1 - instanceIndex * options.borderInstancesReductionRate) * nrMultiplier);
	}
	if (options.cakeSize == 'medium') {
		numPoints =  parseInt(options.mediumNrInst * (1 - instanceIndex * options.borderInstancesReductionRate) * nrMultiplier);
	}
	if (options.cakeSize == 'big') {
		numPoints = parseInt(options.bigNrInst * (1 - instanceIndex * options.borderInstancesReductionRate) * nrMultiplier);
	}
	const points = curve.getSpacedPoints(numPoints);
	baseMatrix =  options.baseMatrix.clone();
	points.forEach(element => {
		if  (position == 'top') {
			point = new THREE.Vector3(element.x, 50, element.y)
			if (transform) {
				point.applyMatrix4(transform);
			} else {
				point.applyMatrix4(baseMatrix);
			}
			topBorderPoints.push(point);
		} else {
			point = new THREE.Vector3(element.x, 1, element.y)
			if (transform) {
				point.applyMatrix4(transform);
			} else {
				point.applyMatrix4(baseMatrix);
			}
			bottomBorderPoints.push(point);
		}
	});

}


function updateEditor() {
	//reinitialize top and bottom border points
	topBorderPoints = [];
	bottomBorderPoints = [];
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
				addBorderPoints('top');
			}
			if (options.bottomBorder) {
				addBorderPoints('bottom');
				//add bottom border for base cake
			}
		}

		if (options.numberOfTiers > 1) {
			source = cakeModels[options.baseCake];
			material = Object.create(cakeModels[options.baseCake].material);

			if (cakeModels[options.baseCake].children.length) {
				if (cakeModels[options.baseCake].children[0]) {
					instanceCakeTier(cakeModels[options.baseCake].children[0].geometry, Object.create(cakeModels[options.baseCake].children[0].material), true);
				}

				if (cakeModels[options.baseCake].children[1]) {
					instanceCakeTier(cakeModels[options.baseCake].children[1].geometry, Object.create(cakeModels[options.baseCake].children[1].material), false);
				}

				if (cakeModels[options.baseCake].children[2]) {
					instanceCakeTier(cakeModels[options.baseCake].children[2].geometry, Object.create(cakeModels[options.baseCake].children[2].material), false);
				}
			} else {
				instanceCakeTier(source.geometry, material, true);
			}

		}
		//add border instances
		if (topBorderPoints.length) {
			geometry = borderModels[options.topBorder+"top"].geometry;
			material = Object.create(borderModels[options.topBorder+"top"].material);
			instance = new THREE.InstancedMesh(geometry, material, topBorderPoints.length);
			instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			for (i=0; i<topBorderPoints.length; i++) {
				translateMatrix =  new THREE.Matrix4().makeTranslation(topBorderPoints[i].x, topBorderPoints[i].y, topBorderPoints[i].z);
				rotationMatrix =  new THREE.Matrix4().makeRotationY(Math.random()*2*Math.PI);
				translateMatrix.multiply(rotationMatrix);
				instance.setMatrixAt( i-1, translateMatrix );
			}
			instance.instanceMatrix.needsUpdate = true;
			scene.add(instance);
			instances.push(instance);
		}
		if (bottomBorderPoints.length) {
			geometry = borderModels[options.bottomBorder+"bottom"].geometry;
			material = Object.create(borderModels[options.bottomBorder+"bottom"].material);
			instance = new THREE.InstancedMesh(geometry, material, bottomBorderPoints.length);
			instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			for (i=0; i<bottomBorderPoints.length; i++) {
				translateMatrix =  new THREE.Matrix4().makeTranslation(bottomBorderPoints[i].x, bottomBorderPoints[i].y, bottomBorderPoints[i].z);
				rotationMatrix =  new THREE.Matrix4().makeRotationY(Math.random()*2*Math.PI);
				translateMatrix.multiply(rotationMatrix);
				instance.setMatrixAt( i-1, translateMatrix );
			}
			instance.instanceMatrix.needsUpdate = true;
			scene.add(instance);
			instances.push(instance);
		}
		options.orbitPoint.y = (options.baseHeight + (options.numberOfTiers -1 )* options.tierHeight) /2;
	}

}
function instanceCakeTier(geometry, material, addBorderPointsToInstance = true) {
	instance = new THREE.InstancedMesh(geometry, material, options.numberOfTiers-1);
	instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
	tierRotation = 360/options.numberOfTiers;
	for (i=1; i<options.numberOfTiers; i++) {
		transform = options.baseMatrix.clone();
		translateMatrix =  new THREE.Matrix4().makeTranslation(0, i*options.tierHeight, 0 );
		scaleMatrix =  new THREE.Matrix4().makeScale(1- i* options.tierScaling, 1, 1 - i*options.tierScaling);
		transform.multiply(translateMatrix);
		transform.multiply(scaleMatrix);
		instance.setMatrixAt( i-1, transform );
		if (addBorderPointsToInstance) {
			if (options.bottomBorder) {
				addBorderPoints('bottom', transform, i);
				//add bottom border for base cake
			}
			if (options.topBorder) {
				//add top border for base cake
				addBorderPoints('top', transform, i);
			}
		}
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
function loadTexture(name, suffix,  scaleU, scaleV) {
	fullName = name + suffix;
	if (!(fullName in textures)) {
		console.log('load texture' + fullName);
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
			return null;
		});

		textures[fullName].wrapS = THREE.RepeatWrapping;
		textures[fullName].wrapT = THREE.RepeatWrapping;
		textures[fullName].repeat.set(scaleU,scaleV );
	}
	return textures[fullName];
}

function loadMaterial(name, scaleU = 1, scaleV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	let diffuse = glossiness = normal = true;
	diffuse = loadTexture(name, '_diffuse', scaleU, scaleV);
	diffuse.encoding = THREE.sRGBEncoding;
	glossiness =  loadTexture(name, '_glossiness', scaleU, scaleV);
	normal =  loadTexture(name, '_normal', scaleU, scaleV);


	materials[name+scaleU+scaleV] = new THREE.MeshStandardMaterial( {
		color: options['baseColor'],
		map: diffuse,
		normalMap: normal,
		normalScale: new THREE.Vector2( 1, 1 ),
		roughnessMap : glossiness,
		roughness: roughness,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity,
		side: THREE.FrontSide
	} );
}

function loadTopMaterial(topName, name, scaleU = 1, scaleV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	let diffuse = glossiness = normal = true;
	diffuse = loadTexture(topName, '', 1, 1);
	diffuse.encoding = THREE.sRGBEncoding;
	alpha = loadTexture('topAlpha', '', 1,1);
	glossiness =  loadTexture(name, '_glossiness', scaleU, scaleV);
	normal =  loadTexture(name, '_normal', scaleU, scaleV);


	materials[topName+name+scaleU+scaleV] = new THREE.MeshStandardMaterial( {
		displacementMap: alpha,
		displacementScale : 0.01,
		displacementBias :0.01,
		alphaMap: alpha,
		transparent: true,
		color: 0xffffff,
		map: diffuse,
		normalMap: normal,
		normalScale: new THREE.Vector2(1, 1),
		roughnessMap : glossiness,
		roughness: roughness/1.6,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity*1.2,
		side: THREE.FrontSide
	} );
}


function setColorToUsedMaterials(newColor) {
	options['materialsUsed'].forEach(material => {
		materials[material].color.setHex(newColor);
		materials[material].color.convertSRGBToLinear();
	});
	options['baseColor'] = newColor;

}

function resetBaseColorAndSetBaseMaterial(firstMaterialName, secondMaterialName, scaleUFirst= 1, scaleVFirst=1, scaleUSecond = 1, scaleVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	options['baseColor'] = 0xffffff;
	setBaseMaterial(firstMaterialName, secondMaterialName, scaleUFirst, scaleVFirst,scaleUSecond,scaleVSecond,  roughness, envMapIntensity);
}

function setBaseMaterial(firstMaterialName, secondMaterialName, scaleUFirst= 1, scaleVFirst= 1, scaleUSecond = 1,scaleVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	options.baseMaterial.firstMaterialName = firstMaterialName;
	options.baseMaterial.secondMaterialName = secondMaterialName;
	options.baseMaterial.scaleUFirst = scaleUFirst;
	options.baseMaterial.scaleVFirst = scaleVFirst;
	options.baseMaterial.scaleUSecond = scaleUSecond;
	options.baseMaterial.scaleVSecond = scaleVSecond;
	options.baseMaterial.roughness = roughness;
	options.baseMaterial.envMapIntensity = envMapIntensity;
	updateMaterials()
}
function updateMaterials() {
	settings = options.baseMaterial;
	if (!((settings.firstMaterialName + settings.scaleUFirst + settings.scaleVFirst) in materials)) {
		console.log('load first material ' + settings.firstMaterialName);
		loadMaterial(settings.firstMaterialName, settings.scaleUFirst, settings.scaleVFirst, settings.roughness, settings.envMapIntensity);
	}
	if (settings.secondMaterialName) {
		if (!((settings.secondMaterialName +settings.scaleUSecond + settings.scaleVSecond) in materials)) {
			console.log('load second material ' + settings.secondMaterialName);
			loadMaterial(settings.secondMaterialName, settings.scaleUSecond, settings.scaleVSecond,  settings.roughness, settings.envMapIntensity);
		}
		setMaterialToAllBaseGeoms(settings.firstMaterialName + settings.scaleUFirst+ settings.scaleVFirst, settings.secondMaterialName + settings.scaleUSecond + settings.scaleVSecond);
	} else{
		setMaterialToAllBaseGeoms(settings.firstMaterialName + settings.scaleUFirst + settings.scaleVFirst);
	}
	if ('topMaterial' in settings) {
		if (settings.topMaterial) {
			if (!((settings.topMaterial + settings.firstMaterialName + settings.scaleUFirst + settings.scaleVFirst) in materials)) {
				loadTopMaterial(settings.topMaterial, settings.firstMaterialName, settings.scaleUFirst, settings.scaleVFirst, settings.roughness, settings.envMapIntensity)
			}
		}
		setTopMaterialToAllBaseGeoms(settings.topMaterial + settings.firstMaterialName + settings.scaleUFirst + settings.scaleVFirst);
		// console.log(' add base top material ' + settings.topMaterial );
	}
	updateEditor();
}

function setMaterialToAllBaseGeoms(firstMaterialName, secondMaterialName= false) {
	for( cake in cakeModels) {
		options['materialsUsed'] = [firstMaterialName];
		cakeModels[cake].material = materials[firstMaterialName];
		cakeModels[cake].children[0].material = materials[firstMaterialName];

		if (secondMaterialName) {
			if (cakeModels[cake].children.length) {
				cakeModels[cake].children[1].material = materials[secondMaterialName];
				options['materialsUsed'].push(secondMaterialName);
			}
		}
	}
}

function setTopMaterialToAllBaseGeoms(topMaterialName) {
	for( cake in cakeModels) {
		if (topMaterialName) {
			if (cakeModels[cake].children.length < 3) {
				newObject = cakeModels[cake].children[1].clone(true);
				newObject.remove(newObject.children[0]);
				cakeModels[cake].add(newObject);
			}
			cakeModels[cake].children[2].material = materials[topMaterialName];
		} else {
			if (cakeModels[cake].children.length > 2) {
				cakeModels[cake].remove(cakeModels[cake].children[2]);
			}
		}
	}
}

function setTopMaterial(materialName) {
	options.baseMaterial.topMaterial = materialName;
	updateMaterials()
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
		l1 = l1 * options.topBorderRadiusScale;
		l2 = l2 * options.topBorderRadiusScale;
	} else {
		l1 = l1 * options.bottomBorderRadiusScale;
		l2 = l2 * options.bottomBorderRadiusScale;
	}
	if (type == 'Cake_round') {
		curve = new THREE.EllipseCurve(
			0,  0,            // ax, aY
			l1, l2,           // xRadius, yRadius
			0,  2 * Math.PI,  // aStartAngle, aEndAngle
			false,            // aClockwise
			90                 // aRotation
		);
	} else if (type == 'Cake_square' || type == 'Cake_sheet') {
		curve = new THREE.Shape();
		roundedRect(curve, -l1/2, -l2/2, l1, l2, 10 );
	}
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

function setColorToTopBorder(color) {
	materials['defaultTopBorder'].color.setHex(color);
	materials['defaultTopBorder'].color.convertSRGBToLinear();
	options['topBorderColor'] = color;
}

function setColorToBottomBorder(color) {
	materials['defaultBottomBorder'].color.setHex(color);
	materials['defaultBottomBorder'].color.convertSRGBToLinear();
	options['topBorderColor'] = color;
}

//duplicate picture with the instance
// change alpha map with the cake type (square)






//shadow map bias...error fix
// optimize border geometries
// cake color icing adjust
//check shadows for borders
// setup for mobile size
//TODO set limits on camera rotation
//use geom instead of instances for base geoms to apply UV offsets for tier variation
//preload materials before switching it (chrome material shown while loading model)
//add stereo option
//show a cm as reference on the table (or plates);







//optimizations:
// If you need to make large groups of objects visible and invisible (or add/remove them from your scene), consider using Layers for best performance.
//Make your frustum as small as possible for better performance. It’s fine to use a large frustum in development, but once you are fine-tuning your app for deployment, make your frustum as small as possible to gain a few vital FPS.
// Don’t put things right on the far clipping plane (especially if your far clipping plane is really big), as this can cause flickering.


// Renderer#

//     Don’t enable preserveDrawingBuffer unless you need it.
//     Disable the alpha buffer unless you need it.
//     Don’t enable the stencil buffer unless you need it.
//     Disable the depth buffer unless you need it (but you probably do need it).
//     Use powerPreference: "high-performance" when creating the renderer. This may encourage a user’s system to choose the high-performance GPU, in multi-GPU systems.
//     Consider only rendering when the camera position changes by epsilon or when an animation happens.
//     If your scene is static and uses OrbitControls, you can listen for the control’s change event. This way you can render the scene only when the camera moves:

// OrbitControls.addEventListener( 'change', () => renderer.render( scene, camera ) );

// You won’t get a higher frame rate from the last two, but what you will get is less fans switching on, and less battery drain on mobile devices.

// Note: I’ve seen a few places around the web recommending that you disable anti-aliasing and apply a post-processing AA pass instead. In my testing, this is not true. On modern hardware built-in MSAA seems to be extremely cheap even on low-power mobile devices, while the post-processing FXAA or SMAA passes cause a considerable frame rate drop on every scene I’ve tested them with, and are also lower quality than MSAA.


// https://discoverthreejs.com/tips-and-tricks/



// Shadows#

//     If your scene is static, only update the shadow map when something changes, rather than every frame.
//     Use a CameraHelper to visualize the shadow camera’s viewing frustum.
//     Make the shadow frustum as small as possible.
//     Make the shadow texture as low resolution as possible.
//     Remember that point light shadows are more expensive than other shadow types since they must render six times (once in each direction), compared with a single time for DirectionalLight and SpotLight shadows.
//     While we’re on the topic of PointLight shadows, note that the CameraHelper only visualizes one out of six of the shadow directions when used to visualize point light shadows. It’s still useful, but you’ll need to use your imagination for the other five directions.

// Materials#

//     MeshLambertMaterial doesn’t work for shiny materials, but for matte materials like cloth it will give very similar results to MeshPhongMaterial but is faster.
//     If you are using morph targets, make sure you set morphTargets = true in your material, or they won’t work!
//     Same goes for morph normals.
//     And if you’re using a SkinnedMesh for skeletal animations, make sure that material.skinning = true.
//     Materials used with morph targets, morph normals, or skinning can’t be shared. You’ll need to create a unique material for each skinned or morphed mesh (material.clone() is your friend here).

// Custom Materials#

//     Only update your uniforms when they change, not every frame.

// Geometry#

//     Avoid using LineLoop since it must be emulated by line strip.

// Textures#

//     All of your textures need to be power of two (POT) size: 1,2,4,8,16,…,512,2048,….
//     Don’t change the dimensions of your textures. Create new ones instead, it’s faster
//     Use the smallest texture sizes possible (can you get away with a 256x256 tiled texture? You might be surprised!).
//     Non-power-of-two (NPOT) textures require linear or nearest filtering, and clamp-to-border or clamp-to-edge wrapping. Mipmap filtering and repeat wrapping are not supported. But seriously, just don’t use NPOT textures.
//     All textures with the same dimensions are the same size in memory, so JPG may have a smaller file size than PNG, but it will take up the same amount of memory on your GPU.

// Antialiasing#

//     The worst-case scenario for antialiasing is geometry made up of lots of thin straight pieces aligned parallel with one another. Think metal window blinds or a lattice fence. If it’s at all possible, don’t include geometry like this in your scenes. If you have no choice, consider replacing the lattice with a texture instead, as that may give better results.

// Post-Processing#

//     The built-in antialiasing doesn’t work with post-processing (at least in WebGL 1). You will need to do this manually, using FXAA or SMAA (probably faster, better)
//     Since you are not using the built-in AA, be sure to disable it!
//     three.js has loads of post-processing shaders, and that’s just great! But remember that each pass requires rendering your entire scene. Once you’re done testing, consider whether you can combine your passes into one single custom pass. It’s a little more work to do this, but can come with a considerable performance increase.

// Disposing of Things#

// Removing something from your scene?

// First of all, consider not doing that, especially if you will add it back again later. You can hide objects temporarily using object.visible = false (works for lights too), or material.opacity = 0. You can set light.intensity = 0 to disable a light without causing shaders to recompile.

// If you do need to remove things from your scene permanently, read this article first: How to dispose of objects.
// Updating Objects in Your Scene?#

// Read this article: How to update things.
// Performance#

//     Set object.matrixAutoUpdate = false for static or rarely moving objects and manually call object.updateMatrix() whenever their position/rotation/quaternion/scale are updated.
//     Transparent objects are slow. Use as few transparent objects as possible in your scenes.
//     use alphatest instead of standard transparency if possible, it’s faster.
//     When testing the performance of your apps, one of the first things you’ll need to do is check whether it is CPU bound, or GPU bound. Replace all materials with basic material using scene.overrideMaterial (see beginners tips and the start of the page). If performance increases, then your app is GPU bound. If performance doesn’t increase, your app is CPU bound.
//     When performance testing on a fast machine, you’ll probably be getting the maximum frame rate of 60FPS. Run chrome using open -a "Google Chrome" --args --disable-gpu-vsync for an unlimited frame rate.
//     Modern mobile devices have high pixel ratios as high as 5 - consider limiting the max pixel ratio to 2 or 3 on these devices. At the expense of some very slight blurring of your scene you will gain a considerable performance increase.
//     Bake lighting and shadow maps to reduce the number of lights in your scene.
//     Keep an eye on the number of drawcalls in your scene. A good rule of thumb is fewer draw calls = better performance.
//     Far away objects don’t need the same level of detail as objects close to the camera. There are many tricks used to increase performance by reducing the quality of distant objects. Consider using a LOD (Level Of Detail) object. You may also get away with only updating position / animation every 2nd or 3rd frame for distant objects, or replacing them with a billboard - that is, a drawing of the object.

// Advanced Tips#

//     Don’t use TriangleFanDrawMode, it’s slow.
//     Use geometry instancing when you have hundreds or thousands of similar geometries.
//     Animate on the GPU instead of the CPU, especially when animating vertices or particles (see THREE.Bas for one approach to doing this).
