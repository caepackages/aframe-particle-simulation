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
    lifetime: {default: 8.0},
    colormapMaxPressure: {default: 1},      
    colormapMinPressure: {default: 0},
    reverseColormap: {default: false},       
    hideParticleOutOfRange: {default: false},
    spawnRate: {default: 15000},
    timeScale: {default: 1.0},
    colormap: {default: ''},
    sprite: {default: ''},
    maxParticles: {default: 250000},
    sizeOutOfFocus: {default: 2.5},
    size: {default: 5.0}
  },
 
  init: function () {
    var el = this.el;
    this.clock = new THREE.Clock();
	this.tickTime = -1;
	this.animate = true;
	this.focusSpheres = [];

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

  updateFocusSpheres: function () {
	this.focusSpheres = this.el.sceneEl.systems['particle_focus'].getFocusSpheres()

	if (this.focusSpheres.length > 0) {          
		this.useFocusSpheres = true;
	} else {
		this.useFocusSpheres = false;          
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
      
      this.updateFocusSpheres()
	  
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
	  var sphereRadius = [];
      if (this.focusSpheres.length > 0) {

        for (var i = 0; i < Math.min(this.focusSpheres.length, 3); i++) {
          var wPos = new THREE.Vector3();
          this.focusSpheres[i].getWorldPosition (wPos);
		  
          spherePosWorld.push(wPos);
		  sphereRadius.push(this.focusSpheres[i].el.components['particle_focus'].data.radius)
        } 
      }
      
      this.particleSystem.update( this.tickTime, this.useFocusSpheres, spherePosWorld, sphereRadius);
    }
  }
});
  
AFRAME.registerSystem('particle_focus', {
  init: function () {
    this.entities = [];
  },

  registerMe: function (el) {
    this.entities.push(el);
  },

  unregisterMe: function (el) {
    var index = this.entities.indexOf(el);
    this.entities.splice(index, 1);
  },
  
  getFocusSpheres: function () {
	  return this.entities.map(function (x) { return x.object3D});
  }
  
});

AFRAME.registerComponent('particle_focus', {
	
  schema: {
    radius: {default: 1.0},
	widthSegments: {default: 16},
	heightSegments:  {default: 16},
	opacity:  {default: 0.5},
	x:  {default: 0.0},
	y:  {default: 0.0},
	z:  {default: -0.15},
    active: {default: false}
  },
	
  init: function () {

	var data = this.data;
    var el = this.el;
	
	this.thumbstick = {x:0, y:0};
	this.widgetEvents = {};
	
	// Create geometry.
    this.geometry = new AFRAME.THREE.SphereGeometry(data.radius, data.widthSegments, data.heightSegments );

    // Create material.
    this.material = new AFRAME.THREE.MeshStandardMaterial({wireframe: true, transparent: true, opacity: data.opacity});

    // Create mesh.
    this.mesh = new AFRAME.THREE.Mesh(this.geometry, this.material);

    // Set mesh on entity.
    el.setObject3D('mesh', this.mesh);
	
	var object3D = el.object3D;
    object3D.position.set(data.x, data.y, data.z - data.radius);
	
	this.uuid = el.object3D.uuid;
	
	this.tools = document.querySelector('[tools]')
	
	if (el.parentNode.nodeName !== 'VR-TOOL') {
		this.system.registerMe(this.el);		
	}
	
	if (el.parentNode.classList.contains('widgethub')) {
		
		this.widgetEvents['thumbstickmoved'] = (event) => {
			this.thumbstick.x = event.detail.x;
			this.thumbstick.y = event.detail.y;
			}

		for (const key in this.widgetEvents) {
		  if (this.widgetEvents.hasOwnProperty(key)) {
			this.addEventListener(key);
		  }
		}
	}
  },
  
  addEventListener: function (name) {
    this.tools.addEventListener(name, this.widgetEvents[name], false);
  },

  removeEventListener: function (name) {
    this.tools.removeEventListener(name, this.widgetEvents[name]);
  },
  
  update: function (oldData) {
  
    var data = this.data;
    var el = this.el;

    // If `oldData` is empty, then this means we're in the initialization process.
    // No need to update.
    if (Object.keys(oldData).length === 0) { return; }

    // Geometry-related properties changed. Update the geometry.
    if (data.radius !== oldData.radius ||
        data.widthSegments !== oldData.widthSegments ||
        data.heightSegments !== oldData.heightSegments) {
      el.getObject3D('mesh').geometry = new AFRAME.THREE.SphereGeometry(data.radius, data.widthSegments, data.heightSegments );
    }
	
	// Material-related properties changed
    if ( data.opacity !== oldData.opacity ) {
      el.getObject3D('mesh').material.opacity = data.opacity;
    }
	
	// sphere position changed
    if (data.x !== oldData.x || data.y !== oldData.y  || data.z !== oldData.z || data.radius !== oldData.radius) {
		var object3D = el.object3D;
		object3D.position.set(data.x, data.y, data.z - data.radius);
    }
  },
  
  tick: function (time, timeDelta) {
	  var current = this.el.getAttribute('particle_focus');
  
	  var opacity = current.opacity + Math.round(this.thumbstick.x * 1 ) / 1 * timeDelta / 2500;
	  opacity = Math.min( Math.max(0, opacity), 1.0 );
	  
	  var radius = current.radius + Math.round(this.thumbstick.y * 1 ) / 1 * timeDelta / 2000;
	  radius = Math.min( Math.max(0.02, radius), 4.0 );  
	  
	  this.el.setAttribute('particle_focus', 'radius', radius);
	  this.el.setAttribute('particle_focus', 'opacity', opacity);
  },
  
  remove: function () {
    for (const key in this.widgetEvents) {
      if (this.widgetEvents.hasOwnProperty(key)) {
        this.removeEventListener(key);
      }
    }
  
    this.system.unregisterMe(this.el);
  }
});

AFRAME.registerComponent('tools', {
  schema: {
  },
  
  init: function () {
    this.showIcons = false;
    this.state = 'widget';
	
	this.events = {
		'togglestate': () => {
				if (this.state === 'widget') {
					this.setState('icon');
				} else {
					this.setState('widget');
				}
			},
		'selectpreicon': () => { this.selectPreviousIcon();	},
		'selectposticon': () => { this.selectNextIcon(); },
		'fetchwidget': () => { 
				var fetchWidget = undefined;
				
				var currentWorldPosition = new AFRAME.THREE.Vector3();
				this.el.object3D.getWorldPosition(currentWorldPosition);
				var releasedWidgets = document.querySelector('a-scene').systems['released-widget'].getComponents()
				
				var minDistance = undefined;
				for (var i = 0; i < releasedWidgets.length; i += 1) {
					var releasedWidget = releasedWidgets[i];
						
					var worldPos = new AFRAME.THREE.Vector3();
					releasedWidget.el.object3D.getWorldPosition(worldPos);
							
					var distance = currentWorldPosition.distanceTo(worldPos);
						
					if (fetchWidget === undefined || minDistance === undefined || distance < minDistance) {
						minDistance = distance;
						fetchWidget = releasedWidget;
					}
				}
							
				if (fetchWidget !== undefined) {
					fetchWidget.flushToDOM(true);
					fetchWidget.el.removeAttribute('released-widget')
					this.setActiveIcon(fetchWidget.data.toolindex, fetchWidget.el)
					fetchWidget.el.parentNode.removeChild(fetchWidget.el)					
				}
		},
		'releasewidget': () => { 
		
			this.widgetEl.flushToDOM(true);
			var currentTool = this.getCurrentTool();
			if (currentTool.getAttribute('multiple') === 'true' ) {
				
			var nClones = 0;
			var releasedWidgets = document.querySelectorAll('[released-widget]');
					for (var i = 0; i < releasedWidgets.length; i += 1) {
						var widget = releasedWidgets[i];
						
						if (widget.getAttribute('released-widget').toolindex === this.currentIconIndex) {
							nClones += 1;
						}
					}

					if (!currentTool.hasAttribute('max') || nClones < parseInt(currentTool.getAttribute('max')) ) {
						this.el.object3D.matrixWorldNeedsUpdate = true
						
						var widget = this.widgetEl.cloneNode(true);
						var scene = this.el.sceneEl;
						var globalPos = this.el.object3D;
						scene.appendChild(widget);
						
						var worldMatrix = this.el.object3D.matrixWorld;
						
						var wQuat = new THREE.Quaternion();
						var wPos = new THREE.Vector3();
						var wRot = new THREE.Vector3();
						var wScale = new THREE.Vector3();
						var euler = new THREE.Euler();
						
						this.widgetEl.object3D.getWorldQuaternion(wQuat);
						wRot = euler.toVector3();
						
						this.widgetEl.object3D.getWorldPosition(wPos);
						
						widget.object3D.setRotationFromQuaternion(wQuat);
						widget.object3D.position.x = wPos.x
						widget.object3D.position.y = wPos.y
						widget.object3D.position.z = wPos.z
						widget.setAttribute('released-widget', 'toolindex:' + this.currentIconIndex);
						widget.classList.remove("widgethub");
					}
				}
		},
	}
	
	if (['0.8.07', '0.8.2', '0.9.0', '0.9.1'].indexOf(AFRAME.version) >= 0) {
		for (const key in this.events) {
		  if (this.events.hasOwnProperty(key)) {
			this.addEventListener(key);
		  }
		}
	}
  },
  
  setState: function (state) {
    this.toolIconCenterEl.setAttribute('visible', state === 'icon');
    this.state = state;
  },
  
  remove: function () {
    for (const key in this.events) {
      if (this.events.hasOwnProperty(key)) {
        this.removeEventListener(key);
      }
    }
  },
  
  addEventListener: function (name) {
    this.el.addEventListener(name, this.events[name], false);
  },

  removeEventListener: function (name) {
    this.el.removeEventListener(name, this.events[name]);
  },
  
  getNuberOfTools: function () {
    return this.tools.length;
  },

  setActiveIcon: function (index, templateNode = undefined) {
    var i = Math.min(index, this.getNuberOfTools() - 1);
    i = Math.max(i, 0);

    this.currentIconIndex = i;
    
    var rotAngle = -this.deltaAngle/ (Math.PI) * 180 * this.currentIconIndex;
    
    this.toolIconCenterEl.setAttribute('rotation', "0 " + rotAngle  + " 0");

    var icons = this.toolIconCenterEl.querySelectorAll('.icon');
    for (var j = 0; j < icons.length; j += 1) {
      
      var icon = icons[j];
      var toolindex = icon.getAttribute('toolindex');
      var vis = parseInt(toolindex) === this.currentIconIndex;
      
      var infos = icon.querySelectorAll('.info');
      
      for (info of infos) {
        info.setAttribute('visible', vis);
      }
    }
    
    // remove old widget
    for ( var i = 0; i < this.widgetEl.children.length; i += 1) {
      var child = this.widgetEl.children[i];
      this.widgetEl.removeChild(child);
    }

	if (templateNode) {	
	
		// clone widget
		templateNode.flushToDOM(true)		
		var widgets = templateNode.querySelectorAll('.widget'); 
		for (var j = 0; j < widgets.length; j += 1) {
		  var widget = widgets[j].cloneNode(true);
		  this.widgetEl.appendChild(widget);
		}		
	} else {
	
		// add new widget
		var widgets = this.tools[this.currentIconIndex].querySelectorAll('.widget'); 
		for (var j = 0; j < widgets.length; j += 1) {
		  var widget = widgets[j].cloneNode(true);
		  this.widgetEl.appendChild(widget);
		}
	}
  },  
  
  widgetVisible: function (visible) {
    for ( var i = 0; i < this.widgetEl.children.length; i += 1) {
      var child = this.widgetEl.children[i];
      child.setAttribute('visible', visible);
    }
  },
  
  selectNextIcon: function () {
    this.setActiveIcon(this.currentIconIndex + 1);
  },

  getCurrentTool: function () {
    return this.tools[this.currentIconIndex];
  },

  selectPreviousIcon: function () {
    this.setActiveIcon(this.currentIconIndex - 1);
  },
  
  update: function (oldData) {
    if (Object.keys(oldData).length === 0) {
      var data = this.data;
      var el = this.el;
      this.tools = document.querySelectorAll('vr-tool');
      this.currentIconIndex = 0;
      
      var radius = 0.5;
      var iconDist = 0.1;
      
      this.deltaAngle = iconDist / radius;
      
      this.toolIconCenterEl = document.createElement('a-entity');
      this.toolIconCenterEl.setAttribute('position', '0 0.2 ' + radius);
      this.toolIconCenterEl.setAttribute('rotation', '0 0 0');
      this.el.appendChild(this.toolIconCenterEl);
      
      // widget
      this.widgetEl = document.createElement('a-entity');    
	  this.widgetEl.setAttribute('class', 'widgethub')
	  
      this.el.appendChild(this.widgetEl);

      var nTools = this.getNuberOfTools();
      for (var i = 0; i < nTools; i += 1) {
        var el = document.createElement('a-entity');
        
        var angle = -this.deltaAngle * i;
        el.setAttribute('position', -Math.sin(-angle) * radius + ' 0 ' + -Math.cos(-angle) * radius );
        el.setAttribute('rotation', '0 ' + angle / Math.PI * 180 + ' 0');
        
        //  icons
        var nodes = this.tools[i].querySelectorAll('.icon');
        for (var j = 0; j < nodes.length; j += 1) {        
          var node = nodes[j].cloneNode(true);
          node.setAttribute('toolindex', i);
          el.appendChild(node);
        }
        
        this.toolIconCenterEl.appendChild(el);
      }
      
      this.setActiveIcon(0);
      this.setState('icon');
    }
  },
});

AFRAME.registerSystem('released-widget', {
  init: function () {
    this.entities = [];
  },
  
  getComponents: function () {
    return this.entities.map(x => x.components['released-widget'])
  },

  registerMe: function (el) {
    this.entities.push(el);
  },

  unregisterMe: function (el) {
    var index = this.entities.indexOf(el);
    this.entities.splice(index, 1);
  }
});

AFRAME.registerComponent('released-widget', {
  schema: {
    toolindex: {type: 'number', default: -1}
  },

  init: function () {
    this.system.registerMe(this.el);
  },

  remove: function () {
    this.system.unregisterMe(this.el);
  }
  
});

AFRAME.registerComponent('windows-motion-controls-events', {
  schema: {
  },

  init: function () {
    this.onTrackpadDown =  (event) => { this.el.addEventListener("trackpadmoved", this.onTrackpadmoved); };
	this.el.addEventListener('trackpaddown', this.onTrackpadDown, false);
  
	this.onTrackpadmoved = (event) => {
	
		if (event.detail.x * event.detail.x  + event.detail.y * event.detail.y < 0.3) {
			this.el.emit('togglestate', {}, false);
		} else if (Math.abs(event.detail.x) > Math.abs(event.detail.y)) {
			if (event.detail.x > 0) {
				this.el.emit('selectpreicon', {}, false);

			} else {
				this.el.emit('selectposticon', {}, false);
			}
		} else if (Math.abs(event.detail.x) < Math.abs(event.detail.y)) {
			if (event.detail.y > 0) {
				this.el.emit('fetchwidget', {}, false);	
			} else {
				this.el.emit('releasewidget', {}, false);
			}
		}
		this.el.removeEventListener("trackpadmoved", this.onTrackpadmoved )
	};
  },

  remove: function () {
	this.el.removeEventListener("trackpaddown", this.onTrackpaddown )
  }
});
