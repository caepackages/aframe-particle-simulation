require('aframe')
require('three-particle-simulation')(THREE)

/* global AFRAME */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('particle_simulation', {
  schema: {
    source: {type: 'selector'},      
    fps: {default: 60.0},
    lifetime: {default: 2.0},
    colormapMaxPressure: {default: 1},      
    colormapMinPressure: {default: 0},
    reverseColormap: {default: false},       
    hideParticleOutOfRange: {default: false},
    spawnRate: {default: 15000},
    timeScale: {default: 1.0},
    colormap: {default: ''},
    sprite: {default: ''},
    maxParticles: {default: 250000},
    focusSphereSelector:  {default: 'a-particle-focus'},
    focusSphereRadius: {default: 0.3},
    sizeOutOfFocus: {default: 2.5},
    size: {default: 5.0}
  },
 
  init: function () {
    var el = this.el;
    this.clock = new THREE.Clock();
	this.tickTime = -1;
	this.animate = true;
	
	var settings = {
      maxParticles: this.data.maxParticles,
      fps: this.data.fps,
      colormap: this.data.colormap,
      sprite: this.data.sprite,
    };
	
	if (this.data.source !== null) {
		settings.data = JSON.parse(this.data.source.data)
	}
	
    this.particleSystem = new THREE.GPUParticleSimulation( settings );
    
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

  play: function () {
    this.animate = true;
  },

  pause: function () {
    this.animate = false;
  },
  
  remove: function () {
    this.el.removeObject3D('mesh');
  },
      
  tick: function (time, timeDelta) {

    if (this.animate) {
      
      this.updateFocusSpheres(time)
	  
	  var delta = this.clock.getDelta() * this.data.timeScale;
	  
	  this.tickTime += delta;
      
      if ( delta > 0 ) {

        for ( var x = 0; x < this.data.spawnRate * this.spawnRateFactor * delta; x ++ ) {

          // Spawning particles is super cheap, and once you spawn them, the rest of
          // their lifecycle is handled entirely on the GPU, driven by a time uniform updated below
		  this.options.time = this.clock.getElapsedTime( );
          this.particleSystem.spawnParticle( this.options );
        }
      }      
      
      var spherePosWorld = [];    
      if (this.focusSpheres.length > 0) {

        for (var i = 0; i < Math.min(this.focusSpheres.length, 3); i++) {
          var wPos = new THREE.Vector3();
          this.focusSpheres[i].getWorldPosition (wPos);
          spherePosWorld.push(wPos);
        } 
      }
      
      this.particleSystem.update( this.tickTime, this.useFocusSpheres, spherePosWorld, this.data.focusSphereRadius);
    }
  }
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
  
