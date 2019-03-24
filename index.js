require('aframe')
require('three-particle-simulation')(THREE)

/* global AFRAME */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('particle_simulation', {
  schema: {
    source: {type: 'selector'},      
    dt: {default: 0.01},
    lifetime: {default: 2.0},
    colormapMaxPressure: {default: 100},      
    colormapMinPressure: {default: 10},
    reverseColormap: {default: false},       
    hideParticleOutOfRange: {default: false},  
    spawnRate: {default: 15000},
    timeScale: {default: 1.0},
    colormap: {default: 'tests/assets/textures/colormap.png'},
    sprite: {default: 'tests/assets/textures/particle2.png'},
    maxParticles: {default: 250000},
    focusSphereSelector:  {default: 'a-particle-focus'},
    focusSphereRadius: {default: 0.3},
    sizeOutOfFocus: {default: 0.25},
    size: {default: 10.0}
    //animate: {default: true}
  },
 
  init: function () {
    var el = this.el;
    this.clock = new THREE.Clock();
    this.particleSystem = new THREE.GPUParticleSimulation( {
      maxParticles: this.data.maxParticles,
      data: JSON.parse(this.data.source.data),
      fps: 1 / this.data.dt,
      colormap: this.data.colormap,
      sprite: this.data.sprite,
    } );
    
    el.setObject3D('mesh', this.particleSystem);
  },

  updateFocusSpheres: function (time) {
    
    if (!this.time || time - this.time > 1000) {   
      this.time = time;
      focusSphereNodes = [];
      this.focusSpheres = [];
      
      if (this.data.focusSphereSelector.length > 0) {
        focusSphereNodes = document.querySelectorAll(this.data.focusSphereSelector);
        
        if (focusSphereNodes.length > 0) {          
          this.useFocusSpheres = true;
        } else {
          this.useFocusSpheres = false;          
        }
        for (var i = 0; i < focusSphereNodes.length; i++) { 
          this.focusSpheres.push( focusSphereNodes[i].object3D )
        }
      }
    }
  },
  
  update: function () {
    var el = this.el;      // Reference to the component's entity.
    
    var isMobile = AFRAME.utils.device.isMobile();
    this.spawnRateFactor = 1.0;

    if (isMobile) {
      this.spawnRateFactor = 0.05;
    }
   
    this.options = {
      lifetime: this.data.lifetime,
      size: this.data.size,
      sizeOutOfFocus: this.data.sizeOutOfFocus,
      time: 0.0,
      colormapMaxPressure: this.data.colormapMaxPressure,
      colormapMinPressure: this.data.colormapMinPressure,
      reverseColormap: this.data.reverseColormap,  
      hideParticleOutOfRange: this.data.hideParticleOutOfRange,
    };
  },

  /*
  play: function () {
    this.data.animate = true;
  },

  pause: function () {
    this.data.animate = false;
  },*/
  
  remove: function () {
    this.el.removeObject3D('mesh');
  },
      
  tick: function (time, timeDelta) {

    //if (this.data.animate) {
      
      this.updateFocusSpheres(time)
      
      var delta = timeDelta / 1000.0 * this.data.timeScale;
      
      if ( delta > 0 ) {

        for ( var x = 0; x < this.data.spawnRate * this.spawnRateFactor * delta; x ++ ) {

          // Spawning particles is super cheap, and once you spawn them, the rest of
          // their lifecycle is handled entirely on the GPU, driven by a time uniform updated below
          this.particleSystem.spawnParticle( this.options );
        }
      }      
      
      var spherePosWorld = []; //new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]        
      if (this.focusSpheres.length > 0) {

        for (var i = 0; i < Math.min(this.focusSpheres.length, 3); i++) {
          var wPos = new THREE.Vector3();
          this.focusSpheres[i].getWorldPosition (wPos);
          spherePosWorld.push(wPos);
        } 
      }
      
      this.particleSystem.update( time / 1000.0, this.useFocusSpheres, spherePosWorld, this.data.focusSphereRadius);
    }
  //}
});

AFRAME.registerPrimitive('a-particle-focus', {
  defaultComponents: {
  },
  
  mappings: {
  }
});
  
AFRAME.registerComponent('toggle-particle-focus', {
  schema: {
    active: {default: false},
    showSphere: {default: false}
  },

  update: function () {
    var data = this.data;  // Component property values.
    var el = this.el;  // Reference to the component's entity.
  },
  init: function () {
		this.factor = 1.0;
		this.distanceOffset = -0.35;
		this.changeDistance = false		
		this.el.addEventListener('menudown', this.onMenuDown.bind(this) );
		this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this) );
		this.el.addEventListener('thumbstickmoved', this.onThumbstickMoved.bind(this) );
		this.time = -1;
  },
  onMenuDown: function (evt) {
		this.data.showSphere = !this.data.showSphere;
		this.el.querySelector(".particlesphere").setAttribute("visible", this.data.showSphere)
  },
    onTriggerDown: function (evt) {
		this.data.active = !this.data.active;
		this.el.querySelector(".particlefocus").setAttribute("active", this.data.active)
  },
    onThumbstickMoved: function (evt) {
		var delta = -0.05;
		
		if (evt.detail.y > 0.9) {
			this.factor = 1.0 + delta;
			this.changeDistance = true
		} else if (evt.detail.y < -0.9) {
			this.factor = 1.0 - delta;
			this.changeDistance = true			
		} else {
			this.factor = 1.0;
			this.changeDistance = false
		}

		this.el.querySelector(".focusoffset").setAttribute("position", "0 0 " + this.distanceOffset)
		
  },
  tick: function (time, delta) {
	if (time - this.time > 100) { 
	  if (this.changeDistance) {
		  this.distanceOffset *= this.factor;
		  
	  }
	  this.time = time;
	}
	  
	  
	  
  }
  
});  
  
  
  
  
  
