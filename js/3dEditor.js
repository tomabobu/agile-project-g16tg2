// var controls, camera, scene, renderer, mouse;
// var textureEquirec, textureCube;
// var sphereMesh, sphereMaterial;

// function init() {
// 	//set scen
// 	scene = new THREE.Scene();

// 	//set camera
// 	camera = new THREE.PerspectiveCamera(75, window.innerWidth/(2*window.innerHeight), 0.1, 10000);
// 	camera.position.z = 200;
// 	camera.position.y = 100;

// 	//setup renderer
// 	renderer = new THREE.WebGLRenderer({antialias: true});
// 	renderer.setClearColor("#e5e5e5");
// 	renderer.setSize(window.innerWidth/2, window.innerHeight);
// 	renderer.toneMapping = THREE.ReinhardToneMapping;
// 	renderer.toneMappingExposure = 2.3;

// 	//setup lighting
// 	hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.7);
// 	scene.add(hemiLight);
// 	light = new THREE.PointLight(0xFFFFFF, 1, 1500);
// 	light.position.set(300, 500 , 250);
// 	scene.add(light);


// 	//append dom element
// 	$('#editor-3d').append(renderer.domElement);
// 	domEl = document.getElementById('editor-3d');

// 	//setup controls
// 	controls = new THREE.OrbitControls(camera, domEl);
// 	//TODO add auto rotate
// 	// controls.minDistance = 500;
// 	// controls.maxDistance = 2500;
// 	// controls.autoRotate = true;


// 	rayCaster = new THREE.Raycaster();
// 	mouse = new THREE.Vector2();

// 	scene.add(new THREE.AxesHelper(50));

// 	loader = new THREE.GLTFLoader();
// 	loader.load( './assets/base.gltf', function ( gltf ) {
// 		cake = gltf.scene.children[0];
// 		// cake.scale.set(0.5,0.5,0.5);
// 		scene.add(gltf.scene);
// 	}, undefined, function ( error ) {
// 		console.error( error );
// 	} );

// 	window.addEventListener( 'resize', onWindowResize, false );
// 	// window.addEventListener('click',onMouseClick);
// 	// controls.addEventListener('change', renderer);
// }


// init();
// render();

// function animate() {
// 	requestAnimationFrame( animate );
// 	// cube.rotation.x += 0.01;
// 	// cube.rotation.y += 0.01;
// 	// controls.update();
// 	render();

// }

// function render() {
// 	camera.lookAt( scene.position );
// 	renderer.render( scene, camera );
// }

// function onWindowResize() {
// 	camera.aspect = window.innerWidth / (2 * window.innerHeight);
// 	camera.updateProjectionMatrix();
// 	renderer.setSize( window.innerWidth/2, window.innerHeight );
// }

// function onMouseClick(event) {
// 	// console.log('clic');
// 	// event.preventDefault();
// 	// mouse.x = (event.clientX / window.innerWidth) * 2 -1;
// 	// mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
// 	// rayCaster.setFromCamera(mouse, camera);

// 	// var intersects = rayCaster.intersectObjects(scene.children, true);
// 	// for(var i =0; i< intersects.length; i++) {
// 	// 	if (intersects[i].object.name == "base") {
// 	// 		console.log(intersects[i].point)
// 	// 		const geometry = new THREE.ConeGeometry( 5, 20, 32 );
// 	// 		const material = new THREE.MeshBasicMaterial( {color: 0x00ffff} );
// 	// 		const cone = new THREE.Mesh( geometry, material );
// 	// 		cone.position.y = 10;
// 	// 		cone.position.add(intersects[i].point);
// 	// 		console.log(cone.position);
// 	// 		scene.add( cone );

// 	// 	}
// 	// 	// intersects[i].object.material.color.set(0xff0000);
// 	// }
// }


// init();
// animate();


let controls, camera, scene, renderer;
let textureEquirec;
let sphereMesh, sphereMaterial;

init();
animate();

function init() {

	// CAMERAS

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / (2*window.innerHeight), 1, 100000 );
	camera.position.set( 0, 200, 200 );
	//TODO set limits on camera rotation

	// SCENE

	scene = new THREE.Scene();

	// Lights

	// const ambient = new THREE.AmbientLight( 0xffffff );
	// scene.add( ambient );

	// 	//setup lighting
	hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.5);
	scene.add(hemiLight);
	// light = new THREE.PointLight(0xFFFFFF, 1, 1500);
	// light.position.set(300, 500 , 250);
	// scene.add(light);

	// light = new THREE.SpotLight(0xdce1ee,0.8);
	// light.position.set(-250,250,-250);
	// light.shadow.camera.fov = 120;
	// light.castShadow = true;
	// light.shadow.bias = -0.0001;
	// light.shadow.mapSize.width = 1024*4;
	// light.shadow.mapSize.height = 1024*4;
	// scene.add( light );

	// light = new THREE.SpotLight(0xffa95c,0.5);
	// light.position.set(150,450,150);
	// light.shadow.camera.fov = 120;
	// light.castShadow = true;
	// scene.add( light );

	// Textures
	const textureLoader = new THREE.TextureLoader();

	textureEquirec = textureLoader.load( '../images/Classic-Kitchen-03.jpg' );
	// textureEquirec = textureLoader.load( '../images/Kitchen.jpg' );
	// textureEquirec = textureLoader.load( '../images/office-desk-2k.jpg' );
	// textureEquirec = textureLoader.load( '../images/Hangar.jpg' );
	// textureEquirec = textureLoader.load( '../images/mu_-mu-27-360highres.jpg' );
	// textureEquirec = textureLoader.load( '../images/maxresdefault.jpg' );
	// textureEquirec = textureLoader.load( '../images/moscow-russia-february-19-2013-panorama-in-interior-stylish-furniture-kitchen-store-full-360-degree-seamless-panorama-in-equirectangular-equidis-R7TKD8.jpg' );
	// textureEquirec = textureLoader.load( '../images/8.barber-shop.jpg' );
	// textureEquirec = textureLoader.load( '../images/equirect_small.jpg' );
	// textureEquirec = textureLoader.load( '../images/moscow-russia-february-2013-full-spherical-360-by-180-degrees-seamless-panorama-in-interior-modern-furniture-kitchen-store-in-equirectangular-equ-RMGTJ.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
	textureEquirec.encoding = THREE.sRGBEncoding;

	scene.background = textureEquirec;

	loader = new THREE.GLTFLoader();
	loader.load( '../assets/base02.gltf', function ( gltf ) {
		// cake = gltf.scene.children[0];
		// cake.castShadow = true;
		// cake.receiveShadow = true;
		// if(cake.material.map) cake.material.map.anisotropy = 16;
		// cake.traverse(n => { if ( n.isMesh ) {
		// 	n.castShadow = true;
		// 	n.receiveShadow = true;
		// 	if(n.material.map) n.material.map.anisotropy = 16;
		//   }});
		var cake, table;
		gltf.scene.children.forEach(element => {
			if (element.name == "Lights") {
				element.children.forEach( light => {
						newLight = new THREE.PointLight("#" + light.name.split("_")[0], 5, Math.sqrt(light.position.x * light.position.x + light.position.y * light.position.y+ light.position.z * light.position.z));
						newLight.position.set(light.position.x, light.position.y+100 , light.position.z);
						scene.add(newLight);
				});
			}
			if(element.name == "Cake") {
				cake = element;

				cake.material = new THREE.MeshStandardMaterial( {
					color: 0xffffff,
					// clearcoat: 1,
					// clearcoatRoughness: 0.3,
					// reflectivity : 1,
					envMapIntensity : 1,
					refractionRatio : 2,
					metalness: 0,
					roughness: 0.9,
					envMap : textureEquirec,
				} );

			}
			if(element.name == "Table") {
				table = element;
				tableTexture = textureLoader.load( '../images/concrete.jpg' );
				table.material = new THREE.MeshStandardMaterial( {
					// color: 0xffffff,
					map:tableTexture,
					envMapIntensity : 1.9,
					// refractionRatio : 22,
					metalness: 0,
					roughness: 0.1,
					envMap : textureEquirec,
				} );
			}
		});
		// model.position.set(0,20,0);
		// model.traverse(n => { if ( n.isMesh ) {
		// 	n.castShadow = true;
		// 	n.receiveShadow = true;
		// 	if(n.material.map) n.material.map.anisotropy = 1;
		// }});
		// console.log(gltf.scene);
		// scene.add(model);
		if(cake) {
			scene.add(cake);
		}
		if (table) {
			scene.add(table);
		}
	}, undefined, function ( error ) {
		console.error( error );
	} );

	// const geometry = new THREE.IcosahedronBufferGeometry( 400, 15 );
	// sphereMaterial = new THREE.MeshLambertMaterial( { envMap: textureEquirec } );
	// sphereMaterial.envMap = textureEquirec;
	// sphereMaterial.needsUpdate = true;
	// sphereMesh = new THREE.Mesh( geometry, sphereMaterial );
	// scene.add( sphereMesh );


	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth/2, window.innerHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	$('#editor-3d').append(renderer.domElement);
	renderer.shadowMap.enabled = true;


	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.minDistance = 150;
	controls.maxDistance = 800;
	// controls.autoRotate = true;
	scene.add( new THREE.AxesHelper(500));
	//

	const params = {
		Cube: function () {

			scene.background = textureCube;

			sphereMaterial.envMap = textureCube;
			sphereMaterial.needsUpdate = true;

		},
		Equirectangular: function () {

			scene.background = textureEquirec;

			sphereMaterial.envMap = textureEquirec;
			sphereMaterial.needsUpdate = true;

		},
		Refraction: false
	};

	// const gui = new GUI();
	// gui.add( params, 'Cube' );
	// gui.add( params, 'Equirectangular' );
	// gui.add( params, 'Refraction' ).onChange( function ( value ) {

	// 	if ( value ) {

	// 		textureEquirec.mapping = THREE.EquirectangularRefractionMapping;
	// 		textureCube.mapping = THREE.CubeRefractionMapping;

	// 	} else {

	// 		textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
	// 		textureCube.mapping = THREE.CubeReflectionMapping;

	// 	}

	// 	sphereMaterial.needsUpdate = true;

	// } );
	// gui.open();

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / ( 2* window.innerHeight);
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth/2, window.innerHeight );

}

//

function animate() {

	requestAnimationFrame( animate );
	controls.update();
	render();

}

function render() {

	camera.lookAt( scene.position );
	renderer.render( scene, camera );

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
