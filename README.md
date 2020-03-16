# aframe-particle-simulation

## NPM

```
npm i aframe-particle-simulation
```

```javascript
// main.js
require('aframe')
require('aframe-particle-simulation');
```

## Browserify

```
browserify main.js -o bundle.js
```

## HTML

```html
<html>
  <head>
  </head>
    <script src="bundle.js"></script>  
  <body>
  
    <a-scene background= "color:black">
      <a-assets>
		<!--
			<a-asset-item id="particleData" src="data.json"></a-asset-item>
		-->
		
        <vr-tools>

          <vr-tool name = "particle focus" multiple = "true" max = "2">
          
            <a-sphere radius = "0.015" material = "wireframe:true" class = "icon" rotation = "-40 0 0" >
			<a-text position = "-0.027 -0.03 0" scale = "0.1 0.1 0.1" value="focus"></a-text>
			</a-sphere>
            	
			<a-entity particle_focus = "radius:0.2" class = "widget" ></a-entity>
			
          </vr-tool>

  
          <vr-tool name = "lamp" multiple = "true" >
		  
            <a-sphere radius = "0.015" material = "color:yellow" class = "icon" rotation = "-40 0 0">
			<a-text position = "-0.026 -0.03 0" scale = "0.1 0.1 0.1" value="lamp"></a-text>
			</a-sphere>

			<a-entity lamp = "radius:0.04" class = "widget" ></a-entity>
			
          </vr-tool>  
		  
        </vr-tools>		

      </a-assets>

      <a-entity
        position = "0 1.4 0"
        scale = "1 1 1"
        particle_simulation = "source:#particleData;fps:60">
      </a-entity>

	<a-entity tools = "" windows-motion-controls="hand: right" windows-motion-controls-events></a-entity>
	
	<!-- Default lighting injected by A-Frame. -->
	<a-entity light="type: ambient; color: #BBB;intensity: 0.9"></a-entity>
	<a-entity light="type: directional; color: #FFF; intensity: 0.9" position="-0.5 1 1"></a-entity>

    </a-scene>
  </body>
</html>
```

## data.json
```javascript
[
	// frame 1
	[	
		// first particle on frame 1	
		// [ x,     y,     z,    vx,    vy,   vz,  p ]		 
		[-0.04,	-0.08, -0.01, -0.01, -0.04, 0.03, 62.73],
		
		// second particle on frame 1
		[-0.04, -0.09, -0.01, -0.01, -0.06, 0.03, 73.45], 	
		
		// ...

		// last particle on frame 1
		[-0.04, -0.02, -0.01, 0.05, -0.10, -0.66, 51.52]
	],

	// frame 2
	[
		[-0.04, -0.08, -0.06, 0.04, -0.4, 0.02, 37.23],
		[-0.05, -0.08, -0.01, 0.00, -0.0, -0.04, 16.61],
		//...
		[-0.07, -0.08, -0.16, 0.61, -0.01, -0.08, 31.32]
	],
	
	// ...

	// n-th frame
	[
		[-0.04, -0.08, -0.05, 0.01, -0.04, 0.08, 37.23],
		[-0.05, -0.08, -0.06, 0.13, -0.07, -0.42, 16.60],
		//...
		[-0.07, -0.08, -0.14, 0.61, -0.13, -0.09, 31.35]
	]
]
```

## Examples
<a href="https://famous-club.glitch.me">Cylinder</a>

<a href="https://panoramic-candle.glitch.me">VR Mixed Reality</a>

<a href="https://field-spring.glitch.me">Multi User</a>

## License
```
(c) Copyright 2020 Frank Rettig, all rights reserved.
```
