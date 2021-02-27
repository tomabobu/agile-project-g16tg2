// initial data setup
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
var textureSize = 1024;
var options = {};
var maxLights = 5;
var sizes = {
	'small' : [0.65, 0.75, 0.65],
	'medium':[0.85, 0.85, 0.85],
	'big':[1.1, 0.9, 1.1]
};

//function to load default settings
function loadDefaultCustomizations() {
	options = {
		'step': 1,
		'initialSetup' : true,
		'baseCake' : 'Cake_round',
		'baseHeight' : 50,
		'baseMatrix' : new THREE.Matrix4().makeScale(0.85,0.85,0.85),
		'tierHeight' : 50,
		'tierScaling' : 0.22,
		'tierBorderScaling' : 0.04,
		'numberOfTiers' : 1,
		'numberOfPortions' : '20-35',
		'icingColor' : 'white',
		'topBorderColorName' : 'white',
		'bottomBorderColorName' : 'white',
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
		'bottomBorderRadiusScale' : 0.987,
		'baseMaterial' : {},
		'messageColor' : 0x000000,
		'customMessage' : 'Happy Birthday!',
		'messageFont' : 'Pacifico',
		'messageSize' : 100,
		'messageHorizontalOffset' : 0,
		'messageVerticalOffset': 0,
	};
}
loadDefaultCustomizations();

//a set of 300 predetermined random rotations used on border instances
var randomRotations = [];
for(let i=0;i<300;i++) {
	randomRotations.push(Math.random()*2*Math.PI);
}

//using WebFont to load Google fonts that will be used later to write on the cake
WebFont.load({
	google: {
	  families: ['Pacifico','Great Vibes', 'Dancing Script']
	},
	active: function() {
		//after the fonts are loaded, init the 3d editor and start animating
		init();
		animate();
	}
  });

//init function to start loading the THREE objects used in the 3d editor
function init() {
	//Setup camera
	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / (2*window.innerHeight), 1, 100000 );
	camera.position.set( 0, 200, 300 );

	// Setup scene
	scene = new THREE.Scene();

	//Setup lighting
	hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.35);
	scene.add(hemiLight);

	//Setup textures
	textureLoader = new THREE.TextureLoader();

	//Setup environment texture
	textureEquirec = textureLoader.load( './images/Classic-Kitchen-03.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
	textureEquirec.encoding = THREE.sRGBEncoding;
	scene.background = textureEquirec;


	//Setup renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth/2, window.innerHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	$('#editor-3d').append(renderer.domElement);

	renderer.gammaFactor = 2.2;
	renderer.outputEncoding = THREE.sRGBEncoding;

	//Load default materials
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

	//loading the texture for the table and setting up the material
	textures['concrete'] = textureLoader.load( './images/concrete.jpg' );
	materials['defaultTable'] = new THREE.MeshStandardMaterial( {
		map:textures['concrete'],
		envMapIntensity : 1.5,
		metalness: 0,
		roughness: 0.3,
		envMap : textureEquirec,
	} );

	numLights = 0;

	//Loading models and lights from the .gltf file created in Cinema4D
	loader = new THREE.GLTFLoader();
	loader.load( './assets/base.gltf', function ( gltf ) {
		gltf.scene.children.forEach(element => {
			//loading the lights
			if (element.name == "Lights") {
				lightsGroup = element.children;
				lightsGroup.forEach( light => {
						//importing not more than the set number of maxLights
						if (numLights < maxLights) {
							//add each light with position and color data stored in the .gltf file
							newLight = new THREE.SpotLight("#" + light.name.split("_")[0], 1.65/maxLights);
							newLight.position.set(light.position.x, light.position.y , light.position.z);
							newLight.castShadow = false;
							newLight.penumbra  = 1;
							newLight.angle = Math.PI/6;
							lights.push(newLight);
						}
						numLights++;
				});
			}
			//loading the cake models
			if(element.name.startsWith("Cake")) {
				//load each cake type
				cakeName = element.name;
				cakeModels[cakeName] = [];
				cakeModels[cakeName] = element;
				cakeModels[cakeName].name = cakeName;
				//setting default materials for each model and children
				cakeModels[cakeName].material = materials['dafaultLambert'];
				if (cakeModels[cakeName].children.length) {
					cakeModels[cakeName].children.forEach(child => {
						if ( child.isMesh ) {
							child.castShadow = false;
							child.receiveShadow = false;
						}
						child.material = materials['dafaultLambert'];
					})
				}
				//create curves that will be used to instantiate top and bottom border elements
				cakeModels[cakeName].topBorder = createCurve(cakeName, 'top');
				cakeModels[cakeName].bottomBorder = createCurve(cakeName, 'bottom');

				//setting to not cast shadows
				if ( cakeModels[cakeName].isMesh ) {
					cakeModels[cakeName].castShadow = false;
					cakeModels[cakeName].receiveShadow = false;
				}
			}

			//loading the borders geometries
			if(element.name.startsWith("Borders")) {
				//load each border geometry
				element.children.forEach( border => {
					//loading as top border
					borderName = border.name;
					borderModels[borderName+"top"] = [];
					borderModels[borderName+"top"] = border;
					borderModels[borderName+"top"].name = borderName;

					//setting default material
					borderModels[borderName+"top"].material = materials['defaultTopBorder'];
					if ( borderModels[borderName+"top"].isMesh ) {
						borderModels[borderName+"top"].castShadow = false;
						borderModels[borderName+"top"].receiveShadow = false;
					}

					//loading as bottom border
					borderModels[borderName+"bottom"] = [];
					borderModels[borderName+"bottom"] = border.clone();
					borderModels[borderName+"bottom"].name = borderName;

					//setting default material
					borderModels[borderName+"bottom"].material = materials['defaultBottomBorder'];
					if ( borderModels[borderName+"bottom"].isMesh ) {
						borderModels[borderName+"bottom"].castShadow = false;
						borderModels[borderName+"bottom"].receiveShadow = false;
					}
				});
			}
			//loading the table geometry
			if(element.name == "Table") {
				tableModel = element;
				//setting default material
				tableModel.material = materials['defaultTable']
				//setting to not cast shadows
				if ( tableModel.isMesh ) {
					tableModel.castShadow = false;
					tableModel.receiveShadow = false;
				}
			}

		});
		//setup editor dimensions based on window size
		detectWindowSize();
		//update the editor view
		updateEditor();
	}, undefined, function ( error ) {
		console.error( error );
	} );

	//setup editor controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.minDistance = 150;
	controls.maxDistance = 800;
	controls.enableDamping = true;
	controls.dampingFactor = 0.1;
	controls.target = options.orbitPoint;

	//add event listener for window resize
	window.addEventListener( 'resize', detectWindowSize, false );
}

//sets the renderer settings based on window size and editor placement
function detectWindowSize() {
	var w = $(document).innerWidth();
	if (w<992) {
		//for mobile devices, the editor is at the bottom half of the screen
		camera.aspect = (window.innerWidth * 2) /  window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight/2 );
	} else {
		//for desktop devices, the editor is at the right half of the screen
		camera.aspect = window.innerWidth / ( 2* window.innerHeight);
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth/2, window.innerHeight );
	}

}

//function that is called each frame by three js
function animate() {
	requestAnimationFrame( animate );
	controls.update();
	render();
}

//function to render the scene
function render() {
	camera.lookAt( options.orbitPoint );
	renderer.render( scene, camera );
}

// function to set base model based on attribute
function setBaseModel(type) {
	options.baseCake = type;
	//update current step number
	goToNextStep(2);
	//update the materials and the scene to show the newly loaded image
	updateMaterials();
}

//function to set the number of tiers for the cake
function setNumberOfTiers(number) {
	//check if action is available based on current step
	if (checkStep(2)) {
		options.numberOfTiers = number;
		//update current step number
		goToNextStep(3);
		updateEditor();
	}
}

//set the scale of the cake based on attribute
function setBaseScale(size) {
	//check if action is available based on current step
	if (checkStep(3)) {
		options.cakeSize = size;
		if (size == 'small') {
			options.numberOfPortions = '12-15';
		}
		if (size == 'medium') {
			options.numberOfPortions = '20-35';
		}
		if (size == 'big') {
			options.numberOfPortions = '35-45';
		}
		options.baseMatrix =  new THREE.Matrix4().makeScale(sizes[size][0], sizes[size][1], sizes[size][2]);
		//update current step number
		goToNextStep(4);
		updateEditor();
	}
}

//resets the base color and base materials
function resetBaseColorAndSetBaseMaterial(firstMaterialName, secondMaterialName, scaleUFirst= 1, scaleVFirst=1, scaleUSecond = 1, scaleVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	//check if action is available based on current step
	if (checkStep(4)) {
		//reset color to white
		options['baseColor'] = 0xffffff;
		if (firstMaterialName == 'chocolate') {
			options.cakeFlavor = 'chocolate flavor';
		}
		if (firstMaterialName == 'vanilla') {
			options.cakeFlavor = 'vanilla flavor';
		}
		if (firstMaterialName == 'chocovanilla') {
			options.cakeFlavor = 'chocolate and vanilla flavor';
		}
		//update current step number
		goToNextStep(5);
		setMaterial(firstMaterialName, secondMaterialName, scaleUFirst, scaleVFirst,scaleUSecond,scaleVSecond,  roughness, envMapIntensity);
	}
}

//set the base material based on attributes sent
function setBaseMaterial(firstMaterialName, secondMaterialName, scaleUFirst= 1, scaleVFirst= 1, scaleUSecond = 1,scaleVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	//check if action is available based on current step
	if (checkStep(5)) {
		if (firstMaterialName == 'fondant_icing') {
			options.icing = 'fondant icing'
		}
		if (firstMaterialName == 'buttercream_icing') {
			options.icing = 'buttercream icing'
		}
		if (firstMaterialName == 'whipped_icing') {
			options.icing = 'whipped cream icing'
		}
		$('#base-material-color').removeClass('display-hidden');
		//update current step number
		goToNextStep(6);
		setMaterial(firstMaterialName, secondMaterialName, scaleUFirst, scaleVFirst, scaleUSecond,scaleVSecond,  roughness, envMapIntensity);
	}
}

//function to return color name based on predefined hex values
function getColorName(color) {
	switch (color) {
		case(0xff3377):
			return 'pink';
			break;
		case(0xff2424):
			return 'red';
			break;
		case(0xff6d38):
			return 'orange';
			break;
		case(0xff9429):
			return 'orange yellow';
			break;
		case(0xfff838):
			return 'yellow';
			break;
		case(0xffffff):
			return 'white';
			break;
		case(0x53ff0f):
			return 'light green';
			break;
		case(0x2eff85):
			return 'pale green';
			break;
		case(0x00cc8f):
			return 'green';
			break;
		case(0x2e85ff):
			return 'blue';
			break;
		case(0x4766ff):
			return 'blue violet';
			break;
		case(0xa857ff):
			return 'violet';
			break;
	}
}

//function to set the color for the materials in use
function setColorToUsedMaterials(newColor) {
	//check if action is available based on current step
	if (checkStep(5)) {
		options.icingColor = getColorName(newColor);

		options['materialsUsed'].forEach(material => {
			materials[material].color.setHex(newColor);
			materials[material].color.convertSRGBToLinear();
		});
		options['baseColor'] = newColor;
		//update current step number
		goToNextStep(6);
		updateEditor();
	}
}

// function to set the top or bottom border
function setBorder(type, position) {
	if (position == 'top') {
		//check if action is available based on current step
		if (checkStep(6)) {
			if (type == 'Type01') {
				options.topBorderName = 'type 01'
			}
			if (type == 'Type02') {
				options.topBorderName = 'type 02'
			}
			if (type == 'Type03') {
				options.topBorderName = 'type 03'
			}
			$('#top-border-color').removeClass('display-hidden');
			//update current step number
			goToNextStep(7);
			options.topBorder = type;
			updateEditor();
		}
	}
	if (position == 'bottom') {
		//check if action is available based on current step
		if (checkStep(7)) {
			if (type == 'Type01') {
				options.bottomBorderName = 'type 01'
			}
			if (type == 'Type02') {
				options.bottomBorderName = 'type 02'
			}
			if (type == 'Type03') {
				options.bottomBorderName = 'type 03'
			}
			$('#bottom-border-color').removeClass('display-hidden');
			//update current step number
			goToNextStep(8);
			options.bottomBorder = type;
			updateEditor();
		}
	}
	if (type == '') {
		options.bottomBorderName = null;
	}
}

//set the color for the top border
function setColorToTopBorder(color) {
	//check if action is available based on current step
	if (checkStep(6)) {
		options.topBorderColorName = getColorName(color);
		materials['defaultTopBorder'].color.setHex(color);
		materials['defaultTopBorder'].color.convertSRGBToLinear();
		options['topBorderColor'] = color;
		//update current step number
		goToNextStep(7);
		updateEditor();
	}
}

//set the color for the bottom border
function setColorToBottomBorder(color) {
	//check if action is available based on current step
	if (checkStep(7)) {
		options.bottomBorderColorName = getColorName(color);
		materials['defaultBottomBorder'].color.setHex(color);
		materials['defaultBottomBorder'].color.convertSRGBToLinear();
		options['topBorderColor'] = color;
		//update current step number
		goToNextStep(8);
		updateEditor();
	}
}

//set side material based on attributes sent
function setSideMaterial(materialName) {
	//check if action is available based on current step
	if (checkStep(8)) {
		if (materialName) {
			if (materialName == 'side01') {
				options.sideMaterialName = 'big pink sprinkles';
			}
			if (materialName == 'side02') {
				options.sideMaterialName = 'colored sprinkles';
			}
			if (materialName == 'side03') {
				options.sideMaterialName = 'small colored sprinkles';
			}
			options.baseMaterial.sideMaterial = materialName;
		} else {
			options.sideMaterialName = null;
			options.baseMaterial.sideMaterial = null;
		}
		//update current step number
		goToNextStep(9);
		//update the materials and the scene to show the newly loaded image
		updateMaterials();
	}
}

//get the picture theme name based on the predefined theme image name
function getThemeName(materialName) {
	switch(materialName) {
		case 'top02':
			return 'Mickey Mouse';
			break
		case 'top03':
			return 'Buzz Lightyear';
			break
		case 'top04':
			return 'Robots';
			break
		case 'top05':
			return 'Minions';
			break
		case 'top07':
			return 'My Little Pony';
			break
		case 'top08':
			return 'Lego Unicorn ';
			break
		default:
			return null;
	}
}

//function to set top material based on attributes sent
function setTopMaterial(materialName) {
	//check if action is available based on current step
	if (checkStep(9)) {
		options.topPhotoName = getThemeName(materialName);
		if (materialName) {

			options.baseMaterial.topMaterial = materialName;
		} else {
			options.baseMaterial.topMaterial = null;
		}
		options.baseMaterial.customImage = null;
		//update current step number
		goToNextStep(10);
		//update the materials and the scene to show the newly loaded image
		updateMaterials();
	}
}

//function to trigger the file select dialog when option was clicked
function selectYourPhoto() {
	//check if action is available based on current step
	if (checkStep(9)) {
		$('#customFile').trigger('click');
	}
}

//function to load the selected file into a ThreeJs texture
$('#customFile').on('change', function (event){
	//the file selected
	var userImage = event.target.files[0];
	//set the options to signal that there is a custom photo selected
	options.topPhotoName = 'custom '
	options.baseMaterial.customImage = 'customFile';
	//create an object url
	var userImageURL = URL.createObjectURL( userImage );
	//load the object url with the texture loader
	textures['customFile'] = textureLoader.load(userImageURL);
	textureLoader.setCrossOrigin("");
	//update current step number
	goToNextStep(10);
	//update the materials and the scene to show the newly loaded image
	updateMaterials();
});


//function to load a message on top of the cake
function setMessageFont(materialName = null) {
	//check if action is available based on current step
	if (checkStep(10)) {
		if (materialName) {
			//set the options to reflect the custom message presence
			options.customTopMessage = 'custom message';
			options.baseMaterial.messageMaterial = materialName;
			//show the sections with the colors and message position
			$('#custom-message-color').removeClass('display-hidden');
			$('#custom-message-position').removeClass('display-hidden');
			//get the message and options from the form
			options.customMessage = $('#customMessage').val();
			options.messageSize = $('#customSize').val();
			options.messageHorizontalOffset = parseInt($('#customHorizontalMovement').val());
			options.messageVerticalOffset = parseInt($('#customVerticalMovement').val());
		} else {
			//remove the custom message options
			options.customTopMessage = null;
			options.baseMaterial.messageMaterial = null;
		}
		//update current step number
		goToNextStep(11);
		//update the materials and the scene to show the newly loaded image
		updateMaterials()
	}
}

//function to change color of the message
function setMessageColor(color) {
	//check if action is available based on current step
	if (checkStep(10)) {
		options.messageColor = color;
		//update current step number
		goToNextStep(11);
		//update the material used for the message
		updateMessageMaterial();
	}
}

//event listener to update the message while typing in the input field of changing the message position
$('#customSize, #customHorizontalMovement, #customVerticalMovement').on('input', function() {
	//check if action is available based on current step
	if (checkStep(10)) {
		//update current step number
		goToNextStep(11);
		//update the material used for the message
		updateMessageMaterial();
	}
});

//calculate points for the top or bottom border based on cake type, size and the tier number
function addBorderPoints(position, transform = null, instanceIndex = 0) {
	//add adaptive scaling for top border on all tiers
	if (position == 'top' && transform) {
		scaleMatrix =  new THREE.Matrix4().makeScale(1- instanceIndex* options.tierBorderScaling, 1, 1 - instanceIndex*options.tierBorderScaling);
		transform.multiply(scaleMatrix);
	}
	//for the top border get the curve topBorder from the current cake model
	if (position == 'top') {
		curve = cakeModels[options.baseCake].topBorder;
		nrMultiplier = 1;
	} else {
		//for the bottom border get the curve bottomBorder from the current cake model
		curve = cakeModels[options.baseCake].bottomBorder;
		//increase the multiplier because the bottom border is a little bit bigger than the top border
		nrMultiplier = 1 + options.bottomBorderInstancesIncreaseRate
	}
	//set the number of points based on the cake size and tier instances reduction rate
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

	//get the points from the curve in 2D space
	const points = curve.getSpacedPoints(numPoints);
	baseMatrix =  options.baseMatrix.clone();
	//transform each point based on the position top or bottom
	points.forEach(element => {
		if  (position == 'top') {
			//create a 3D point from a 2D one
			point = new THREE.Vector3(element.x, 50, element.y)
			//transform the point if a transform matrix was passed
			if (transform) {
				point.applyMatrix4(transform);
			} else {
				point.applyMatrix4(baseMatrix);
			}
			//add the point to the array
			topBorderPoints.push(point);
		} else {
			//create a 3D point from a 2D one
			point = new THREE.Vector3(element.x, 1, element.y)
			//transform the point if a transform matrix was passed
			if (transform) {
				point.applyMatrix4(transform);
			} else {
				point.applyMatrix4(baseMatrix);
			}
			//add the point to the array
			bottomBorderPoints.push(point);
		}
	});

}

//function to create a description based on selected cards
function cakeDescription() {
	description = 'You have opted for a cake with the following description: '
	if (options.baseCake == 'Cake_round') {
		description += 'round shaped';
	}
	if (options.baseCake == 'Cake_square') {
		description += 'square shaped';
	}
	if (options.baseCake == 'Cake_sheet') {
		description += 'sheet';
	}
	if (options.numberOfTiers == 1) {
		description += ', ' + options.numberOfTiers + ' tier';
	} else {
		description += ', ' + options.numberOfTiers + ' tiers';
	}
	description += ', ' + options.numberOfPortions + ' portions';
	if (options.cakeFlavor) {
		description += ', '+ options.cakeFlavor;
	}
	if (options.icing) {
		description += ', ' + options.icingColor + ' ' + options.icing;
	}
	if (options.topBorderName) {
		description += ', ' + options.topBorderColorName + ' ' + options.topBorderName + ' top border';
	}
	if (options.bottomBorderName) {
		description += ', ' + options.bottomBorderColorName + ' ' + options.bottomBorderName + ' top border';
	}
	if (options.sideMaterialName) {
		description += ', ' + options.sideMaterialName + ' as decoration on the side';
	}
	if (options.topPhotoName) {
		description += ', ' + options.topPhotoName + ' photo as decoration on the top';
	}
	if (options.customTopMessage) {
		description += ', with the "' + $('#customMessage').val() + '" custom message';
	}
	description += '.';

	//save the description in the form
	$('#order-description').html(description);
}

// calculate the cake price based on selected options
function cakePrice() {
	price = 0;
	if (options.step > 1) {
		//price for the base cake
		if (options.baseCake == 'Cake_round') {
			price += 20;
		}
		if (options.baseCake == 'Cake_square') {
			price += 25;
		}
		if (options.baseCake == 'Cake_sheet') {
			price += 27;
		}

		//price update  based on the number of selected tiers
		tierPrice = price;
		for(let i=2;i<= options.numberOfTiers; i++) {
			tierPrice = tierPrice * 0.7;
			price +=tierPrice;
		}

		//price update from the selected size
		switch ( options.numberOfPortions) {
			case '12-15':
				price = price * 0.55;
				break;
			case '20-35':
				price = price * 1;
				break;
			case '35-45':
				price = price * 1.4;
				break;
		}
		//price update based on selected flavor
		switch (options.cakeFlavor) {
			case 'chocolate flavor':
				price = price * 0.95;
				break;
			case 'vanilla flavor':
				price = price * 0.98;
				break;
			case 'chocolate and vanilla flavor':
				price = price * 1.05;
				break;
		}

		//price update based on the type of icing
		switch (options.icing) {
			case 'fondant icing':
				price = price * 1.35;
				break;
			case 'buttercream icing':
				price = price * 1.25;
				break;
			case 'whipped cream icing':
				price = price * 1.1;
				break;
		}

		//price update based on the selection of top or bottom borders
		if (options.topBorderName) {
			price = price * 1.05;
		}
		if (options.bottomBorderName) {
			price = price * 1.05;
		}

		//price update based on side material
		if (options.sideMaterialName) {
			price = price * 1.08;
		}

		//price update if top photo is used
		if (options.topPhotoName) {
			price = price + 7.5;
		}
		//price update if top message was selected
		if (options.customTopMessage) {
			price = price + 5;
		}
	}
	//price update based on the online discount
	onlineDiscount = 0.7;
	price = price * onlineDiscount;

	//update the prices shown in the form
	$('#total-price').html(parseFloat(price).toFixed(2));
	$('#order-value').html(parseFloat(price).toFixed(2));
	$('#order-vat-value').html(parseFloat(price * 0.19).toFixed(2));
	$('#order-total-value').html(parseFloat(price * 1.19).toFixed(2));
}

//main function that updates the 3d editor
function updateEditor() {
	//update cake description
	cakeDescription();

	//get current cake price;
	cakePrice();

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

	// adding the lights and the table
	if (options.initialSetup) {
		scene.add(tableModel);
		lights.forEach(light => scene.add(light));
		options.initialSetup = false;
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
				//add bottom border for base cake
				addBorderPoints('bottom');
			}
		}

		//add each tier instance based on the base cake
		if (options.numberOfTiers > 1) {
			source = cakeModels[options.baseCake];
			material = Object.create(cakeModels[options.baseCake].material);
			//create instance for each children if found
			if (cakeModels[options.baseCake].children.length) {
				for (let i = 0; i< cakeModels[options.baseCake].children.length; i++) {
					instanceCakeTier(cakeModels[options.baseCake].children[i].geometry, Object.create(cakeModels[options.baseCake].children[i].material), true);
				}
			} else {
				//create instance for the base model
				instanceCakeTier(source.geometry, material, true);
			}

		}

		//add top border instances
		if (topBorderPoints.length) {
			//get the border geometry and material
			geometry = borderModels[options.topBorder+"top"].geometry;
			material = Object.create(borderModels[options.topBorder+"top"].material);
			//create the instances
			instance = new THREE.InstancedMesh(geometry, material, topBorderPoints.length);
			instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			//transform each instance to match the position found in the points array
			for (i=0; i<topBorderPoints.length; i++) {
				translateMatrix =  new THREE.Matrix4().makeTranslation(topBorderPoints[i].x, topBorderPoints[i].y, topBorderPoints[i].z);
				rotationMatrix =  new THREE.Matrix4().makeRotationY(randomRotations[i]);
				translateMatrix.multiply(rotationMatrix);
				instance.setMatrixAt( i-1, translateMatrix );
			}
			instance.instanceMatrix.needsUpdate = true;
			//add the instances to the scene
			scene.add(instance);
			//save reference to the instances for later usage
			instances.push(instance);
		}

		//add bottom border instance
		if (bottomBorderPoints.length) {
			//get the border geometry and material
			geometry = borderModels[options.bottomBorder+"bottom"].geometry;
			material = Object.create(borderModels[options.bottomBorder+"bottom"].material);
			//create the instances
			instance = new THREE.InstancedMesh(geometry, material, bottomBorderPoints.length);
			instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
			//transform each instance to match the position found in the points array
			for (i=0; i<bottomBorderPoints.length; i++) {
				translateMatrix =  new THREE.Matrix4().makeTranslation(bottomBorderPoints[i].x, bottomBorderPoints[i].y, bottomBorderPoints[i].z);
				rotationMatrix =  new THREE.Matrix4().makeRotationY(randomRotations[i]);
				translateMatrix.multiply(rotationMatrix);
				instance.setMatrixAt( i-1, translateMatrix );
			}
			instance.instanceMatrix.needsUpdate = true;
			//add the instances to the scene
			scene.add(instance);
			//save reference to the instances for later usage
			instances.push(instance);
		}
		//update the camera orbit point to fit in all the tiers of the cake
		options.orbitPoint.y = (options.baseHeight + (options.numberOfTiers -1 )* options.tierHeight) /2;
	}

}

//function to create multiple instance from a base geometry
function instanceCakeTier(geometry, material, addBorderPointsToInstance = true) {
	//create the instances
	instance = new THREE.InstancedMesh(geometry, material, options.numberOfTiers-1);
	instance.instanceMatrix.setUsage( THREE.DynamicDrawUsage );

	for (i=1; i<options.numberOfTiers; i++) {
		//transform each tier to have the right size and position
		transform = options.baseMatrix.clone();
		translateMatrix =  new THREE.Matrix4().makeTranslation(0, i*options.tierHeight, 0 );
		scaleMatrix =  new THREE.Matrix4().makeScale(1- i* options.tierScaling, 1, 1 - i*options.tierScaling);
		transform.multiply(translateMatrix);
		transform.multiply(scaleMatrix);
		instance.setMatrixAt( i-1, transform );
		//add the border points for each tier
		if (addBorderPointsToInstance) {
			if (options.bottomBorder) {
				//add bottom border for base cake
				addBorderPoints('bottom', transform, i);
			}
			if (options.topBorder) {
				//add top border for base cake
				addBorderPoints('top', transform, i);
			}
		}
	}
	instance.instanceMatrix.needsUpdate = true;
	//add the instances to the scene
	scene.add( instance );
	//save reference to the instances for later usage
	instances.push(instance);
}

//function to create an alert message in a specified card
function showMessage(message, cardId = null) {
	//close any previous alert
	$('.alert').alert('close');
	//the alert HTML code
	alert = '<div  class="alert alert-danger alert-dismissible fade show in" role="alert">';
	alert += message;
	alert += '<button type="button" class="btn-close no-card-fx" data-bs-dismiss="alert" aria-label="Close"></button></div>';

	//find the card
	if (cardId) {
		if (cardId < 9) {
			cardName = '#card0' + (cardId + 1);
		} else {
			cardName = '#card' + (cardId + 1);
		}
		//add the alert to the card
		$(cardName + ' .card-body').prepend(alert);
	} else {
		//add the alert to the page if a cardId was not passed
		$('#alert-messages').html(alert);
	}
}

//function that checks if a card is active based on current step
function checkStep(step) {
	if (options.step < step) {
		if (step == 5) {
			if (options.step < 5) {
				showMessage("Please choose the cake flavor", 4);
				scrollToAnchor(4);
				return false;
			}
		}
		if ([6, 7 ,8 ,9,10,11].includes(step)) {
			if (options.step < 6) {
				showMessage("Please choose the cake icing", 5);
				scrollToAnchor(5);
				return false;
			}
		}
	}
	return true;
}

//function to set material and update the editor
function setMaterial(firstMaterialName, secondMaterialName, scaleUFirst= 1, scaleVFirst= 1, scaleUSecond = 1,scaleVSecond = 1,  roughness= 1.3, envMapIntensity = 1.5) {
	//update the options setting
	options.baseMaterial.firstMaterialName = firstMaterialName;
	options.baseMaterial.secondMaterialName = secondMaterialName;
	options.baseMaterial.scaleUFirst = scaleUFirst;
	options.baseMaterial.scaleVFirst = scaleVFirst;
	options.baseMaterial.scaleUSecond = scaleUSecond;
	options.baseMaterial.scaleVSecond = scaleVSecond;
	options.baseMaterial.roughness = roughness;
	options.baseMaterial.envMapIntensity = envMapIntensity;
	//update the materials and the scene to show the newly loaded image
	updateMaterials();
}

//function to load a texture based on name
function loadTexture(name, suffix,  scaleU, scaleV) {
	fullName = name + suffix;
	if (!(fullName in textures)) {
		textures[fullName] = textureLoader.load( './images/materials/'+name+'/'+ fullName + '.jpg',
		// onLoad callback
		function ( texture ) {},
		// onProgress callback currently not supported
		undefined,
		// onError callback
		function ( err ) {
			console.log( name+'/'+ fullName+'.jpg - texture not found.' );
			return null;
		});

		//set the texture wrap
		textures[fullName].wrapS = THREE.RepeatWrapping;
		textures[fullName].wrapT = THREE.RepeatWrapping;
		textures[fullName].repeat.set(scaleU,scaleV );
	}
	return textures[fullName];
}

//function to load material
function loadMaterial(name, scaleU = 1, scaleV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	//load textures
	let diffuse = glossiness = normal = true;
	diffuse = loadTexture(name, '_diffuse', scaleU, scaleV);
	diffuse.encoding = THREE.sRGBEncoding;
	normal =  loadTexture(name, '_normal', scaleU, scaleV);

	//create the material
	materials[name+scaleU+scaleV] = new THREE.MeshStandardMaterial( {
		color: options['baseColor'],
		map: diffuse,
		normalMap: normal,
		normalScale: new THREE.Vector2( 1, 1 ),
		roughness: roughness,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity,
		side: THREE.FrontSide
	} );
}

//function to load the top material used for photos
function loadTopMaterial(topName, name = null, scaleU = 1, scaleV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	//load the textures
	let diffuse = glossiness = normal = true;
	diffuse = loadTexture(topName, '', 1, 1);
	diffuse.encoding = THREE.sRGBEncoding;
	alpha = loadTexture('topAlpha','_' + options.baseCake, 1,1);
	if (name) {
		normal =  loadTexture(name, '_normal', scaleU, scaleV);
	}
	//create the material
	materials[topName] = new THREE.MeshStandardMaterial( {
		displacementMap: alpha,
		displacementScale : 0.1,
		displacementBias :0.1,
		alphaMap: alpha,
		transparent: true,
		color: 0xffffff,
		map: diffuse,
		normalScale: new THREE.Vector2(0.5, 0.5),
		roughness: roughness/2,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity*1.2,
		side: THREE.FrontSide
	} );

	if (name) {
		materials[topName].normalMap = normal;
	}
}

//function to load material for the top message
function loadTopMessage(roughness= 1.3, envMapIntensity = 1.5) {
	//load alpha texture
	alpha = loadTextTexture(options.customMessage, options.messageSize, options.messageHorizontalOffset, options.messageVerticalOffset,  options.baseMaterial.messageMaterial, textureSize);
	//create the material
	materials['customText'] = new THREE.MeshStandardMaterial( {
		displacementMap: alpha,
		displacementScale : 0.2,
		displacementBias :0.2,
		alphaMap: alpha,
		transparent: true,
		color: options.messageColor,
		normalScale: new THREE.Vector2(0.5, 0.5),
		roughness: roughness/2,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity*1.2,
		side: THREE.FrontSide
	} );
	materials['customText'].color.convertSRGBToLinear();
}

//function to load side materials
function loadSideMaterial(topName, scaleU = 1, scaleV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	//load the textures
	let diffuse = glossiness = normal = true;
	diffuse = loadTexture(topName, '_diffuse', scaleU, scaleV);
	diffuse.encoding = THREE.sRGBEncoding;
	alpha = loadTexture(topName,'_alpha', scaleU, scaleV);
	normal =  loadTexture(topName, '_normal', scaleU, scaleV);

	//create the material
	materials[topName] = new THREE.MeshStandardMaterial( {
		displacementMap: alpha,
		displacementScale : 0.1,
		displacementBias :0.1,
		alphaMap: alpha,
		transparent: true,
		color: 0xffffff,
		map: diffuse,
		normalMap: normal,
		normalScale: new THREE.Vector2(1, 1),
		roughness: roughness/2,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity*1.2,
		side: THREE.FrontSide
	} );
}

//function to load custom image
function loadTopCustomFile(name = null, scaleU = 1, scaleV = 1, roughness= 1.3, envMapIntensity = 1.5) {
	//load textures
	let diffuse = glossiness = normal = true;
	diffuse = textures['customFile'];
	diffuse.encoding = THREE.sRGBEncoding;
	alpha = loadTexture('topAlpha','_' + options.baseCake, 1,1);
	if (name) {
		normal =  loadTexture(name, '_normal', scaleU, scaleV);
	}
	//create the materials
	materials['customFile'] = new THREE.MeshStandardMaterial( {
		displacementMap: alpha,
		displacementScale : 0.1,
		displacementBias :0.1,
		alphaMap: alpha,
		transparent: true,
		color: 0xffffff,
		map: diffuse,
		normalScale: new THREE.Vector2(0.5, 0.5),
		roughness: roughness/2,
		metalness: 0,
		envMap : textureEquirec,
		envMapIntensity : envMapIntensity*1.2,
		side: THREE.FrontSide
	} );
	if (name) {
		materials['customFile'].normalMap = normal;
	}
}

//function to update all the materials used on the cake
function updateMaterials() {
	settings = options.baseMaterial;
	//load the first material
	if (settings.firstMaterialName) {
		if (!((settings.firstMaterialName + settings.scaleUFirst + settings.scaleVFirst) in materials)) {
			loadMaterial(settings.firstMaterialName, settings.scaleUFirst, settings.scaleVFirst, settings.roughness, settings.envMapIntensity);
		}

	}
	//load the second material if it was set
	if (settings.secondMaterialName) {
		if (!((settings.secondMaterialName +settings.scaleUSecond + settings.scaleVSecond) in materials)) {
			loadMaterial(settings.secondMaterialName, settings.scaleUSecond, settings.scaleVSecond,  settings.roughness, settings.envMapIntensity);
		}
	}

	//load the side material
	if (settings.sideMaterial) {
		loadSideMaterial(settings.sideMaterial, 1, 1, 0.5, 2);
	}

	//load the custom image material
	if (settings.customImage) {
		if  (settings.secondMaterialName) {
			loadTopCustomFile(settings.secondMaterialName, settings.scaleUSecond, settings.scaleVSecond,  settings.roughness, settings.envMapIntensity);
		}else {
			if (settings.firstMaterialName) {
				loadTopCustomFile( settings.firstMaterialName, settings.scaleUFirst, settings.scaleVFirst, settings.roughness, settings.envMapIntensity);
			} else {
				loadTopCustomFile();
			}
		}
	} else {
		if (settings.topMaterial) {
			if (settings.topMaterial) {
				if  (settings.secondMaterialName) {
					loadTopMaterial(settings.topMaterial, settings.secondMaterialName, settings.scaleUSecond, settings.scaleVSecond,  settings.roughness, settings.envMapIntensity)
				} else {
					if (settings.firstMaterialName) {
						loadTopMaterial( settings.topMaterial, settings.firstMaterialName, settings.scaleUFirst, settings.scaleVFirst, settings.roughness, settings.envMapIntensity)
					} else {
						loadTopMaterial( settings.topMaterial);
					}
				}
			}
		}
	}

	//load message material
	if (settings.messageMaterial) {
		loadTopMessage();
	}

	//set loaded materials to all base geometries
	setMaterialToAllBaseGeoms(settings.firstMaterialName + settings.scaleUFirst+ settings.scaleVFirst, settings.secondMaterialName + settings.scaleUSecond + settings.scaleVSecond);
	//update the editor to reflect the changes
	updateEditor();
}

//function to set a material to all base geometries
function setMaterialToAllBaseGeoms(firstMaterialName, secondMaterialName= false) {
	for( cake in cakeModels) {
		while (cakeModels[cake].children.length > 2 ){
			cakeModels[cake].remove(cakeModels[cake].children[2]);
		}
	}
	//for all cake models update materials
	for( cake in cakeModels) {
		if (settings.firstMaterialName) {
			options['materialsUsed'] = [firstMaterialName];
			cakeModels[cake].material = materials[firstMaterialName];
			cakeModels[cake].children[0].material = materials[firstMaterialName];
			cakeModels[cake].children[1].material = materials[firstMaterialName];
		} else {
			options['materialsUsed'] = ['dafaultLambert'];
			cakeModels[cake].material = materials['dafaultLambert'];
			cakeModels[cake].children[0].material = materials['dafaultLambert'];
			cakeModels[cake].children[1].material = materials['dafaultLambert'];
		}

		if (settings.secondMaterialName) {
			if (cakeModels[cake].children.length) {
				cakeModels[cake].children[1].material = materials[secondMaterialName];
				options['materialsUsed'].push(secondMaterialName);
			}
		}

		//top material pos
		topPos = 2;
		messagePos = 2;
		let newSideObject = cakeModels[cake].children[0].clone(true);
		newSideObject.castShadow = false;
		newSideObject.receiveShadow = false;
		let newTopObject = cakeModels[cake].children[1].clone(true);
		newTopObject.castShadow = false;
		newTopObject.receiveShadow = false;
		let newMessageObject = cakeModels[cake].children[1].clone(true);
		newMessageObject.castShadow = false;
		newMessageObject.receiveShadow = false;

		//side material
		if (settings.sideMaterial) {
			newSideObject.material = materials[settings.sideMaterial];
			cakeModels[cake].add(newSideObject);
			topPos = 3;
			messagePos = 3;
		}

		// top material
		if (settings.customImage) {
			newTopObject.material =  materials['customFile'];
			cakeModels[cake].add(newTopObject);
			messagePos = 4;
		} else {
			if (settings.topMaterial) {
				newTopObject.material = materials[settings.topMaterial];
				cakeModels[cake].add(newTopObject);
				messagePos = 4;
			}
		}

		//message material
		if (settings.messageMaterial) {
			newMessageObject.material = materials['customText'];
			cakeModels[cake].add(newMessageObject);
		}
	}
}

//function to create a rounded rectangle curve
function roundedRect( ctx, x, y, width, height, radius ) {
	//create lines for the sides and the rounded corners
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

//function to create the curves used for borders based on the cake type and position
function createCurve(type, position) {
	//set dimensions based on cake type
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
	//update the sizes if the curve is for the top position
	if (position == 'top') {
		l1 = l1 * options.topBorderRadiusScale;
		l2 = l2 * options.topBorderRadiusScale;
	} else {
		l1 = l1 * options.bottomBorderRadiusScale;
		l2 = l2 * options.bottomBorderRadiusScale;
	}
	//create the curve based on cake type
	if (type == 'Cake_round') {
		curve = new THREE.EllipseCurve(0, 0, l1, l2, 0,  2 * Math.PI, false, 90 );
	} else if (type == 'Cake_square' || type == 'Cake_sheet') {
		curve = new THREE.Shape();
		roundedRect(curve, -l1/2, -l2/2, l1, l2, 10 );
	}
	return curve;
}

//function to update the font used for the custom message
function updateMessageMaterial() {
	if (options.baseMaterial.messageMaterial) {
		setMessageFont(options.baseMaterial.messageMaterial);
	} else {
		setMessageFont('Pacifico');
	}
}

//function to update the custom message material while editing the input field
$('#customMessage').on('keyup', updateMessageMaterial);

//function to reset the controls of the camera
function resetCamera() {
	controls.reset();
}

//function to reset the selected options and return to default values
function resetCustomizations() {
	resetCamera();
	loadDefaultCustomizations();

	//reset the materials colors
	options['materialsUsed'].forEach(material => {
		materials[material].color.setHex('0xffffff');
		materials[material].color.convertSRGBToLinear();
	});
	options['baseColor'] = '0xffffff';

	//reset the top border colors
	materials['defaultTopBorder'].color.setHex('0xffffff');
	materials['defaultTopBorder'].color.convertSRGBToLinear();
	options['topBorderColor'] = '0xffffff';

	//reset the bottom border colors
	materials['defaultBottomBorder'].color.setHex('0xffffff');
	materials['defaultBottomBorder'].color.convertSRGBToLinear();
	options['topBorderColor'] = '0xffffff';

	//resetting the input fields
	$('#customSize').val(100);
	$('#customHorizontalMovement').val(0);
	$('#customVerticalMovement').val(0);
	$('#firstName').val('');
	$('#lastName').val('');
	$('#phone').val('');
	$('#email').val('');

	//update the materials and the scene to show the newly loaded image
	updateMaterials();

	//reset the page scroll position
	scrollToAnchor(1)

	//reset the cards display
	$('.card').removeClass('card-done');
	//reset the current step indicator
	$('#current-step').html('Steps done: ' + 0);
}

//function to animate the scrolling to a page anchor
function scrollToAnchor(anchorNum) {
	var w = $(document).innerWidth();
	if (w<992) {
		anchor ="#card" + (anchorNum+1).toString().padStart(2,'0');
	} else {
		anchor ="#card" + anchorNum.toString().padStart(2,'0');
	}
	$('html, body').animate({
		'scrollTop':   $(anchor).offset().top
	  }, 1000);
}

//function to update current step
function goToNextStep(step) {
	if (step > options.step) {
		options.step = step;
		//update the step indicator
		$('#current-step').html('Steps done: ' + (step-1));
		for(let i=2; i<= step; i++) {
			//update the cards as done
			if (i < 10) {
				$('#card0' + i).addClass('card-done');
			} else {
				$('#card' + i).addClass('card-done');
			}

		}
	}
	//close all alerts
	$('.alert').alert('close');
}

//function to send order
$('#send-order').on('click', function() {
	//check if action is available based on current step
	if (checkStep(11)) {
		//update current step number
		goToNextStep(11);

		firstName = $('#firstName').val();
		lastName = $('#lastName').val();
		phone = $('#phone').val();
		email = $('#email').val();

		//check that the first name was set
		if (!firstName) {
			showMessage("Please input a first name in order to finalize the order.", 11);
			scrollToAnchor(11);
			return false;
		}
		//check that the last name was set
		if (!lastName) {
			showMessage("Please input a last name in order to finalize the order.", 11);
			scrollToAnchor(11);
			return false;
		}
		//check that the phone number was set
		if (!phone) {
			showMessage("Please input a phone number in order to finalize the order.", 11);
			scrollToAnchor(11);
			return false;
		}

		//check that the email was set
		if (!email) {
			showMessage("Please input an email in order to finalize the order.", 11);
			scrollToAnchor(11);
			return false;
		}

		//update the form message
		$('#current-step').html('All steps were done. You will be contacted shortly to confirm the order.')
		$('.order-sent').removeClass('d-none');
		//update the card display
		$('#card12').addClass('card-done');
	}
});



//function to load a string text as a texture
function loadTextTexture(txt, size, horizontalOffset, verticalOffset, fontName, textureSize, stroke = null) {
	//create a 2d canvas
	bitmap = document.createElement('canvas');
	g = bitmap.getContext('2d');
	bitmap.width = textureSize;
	bitmap.height = textureSize;
	//set the font
	g.font = size + 'px ' + fontName;

	//get the text sizes
	txtWidth = g.measureText(txt).width;
	txtHeight = g.measureText(txt).actualBoundingBoxAscent;

	//fill in the text
	g.fillStyle = 'white';
	g.fillText(txt, textureSize/2-txtWidth/2 + horizontalOffset , textureSize/2+ txtHeight/2 + verticalOffset);
	//if stroke is wanted, add a stroke to the canvas
	if (stroke) {
		g.strokeStyle = 'white';
		g.lineWidth = stroke;
		g.strokeText(txt, textureSize/2-txtWidth/2 + horizontalOffset , textureSize/2+ txtHeight/2 + verticalOffset);
		//saving canvas contents that will be used for a texture
		textures['customTextStroke'] = new THREE.Texture(bitmap) ;
		textures['customTextStroke'].needsUpdate = true;
		return textures['customTextStroke'];
	} else {
		//saving canvas contents that will be used for a texture
		textures['customText'] = new THREE.Texture(bitmap) ;
		textures['customText'].needsUpdate = true;
		return textures['customText'];
	}
}
