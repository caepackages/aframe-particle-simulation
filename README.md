# aframe-particle-simulation

## NPM

```
npm i aframe-particle-simulation
```

```javascript
// main.js
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
    <a-scene background= "color:white">
      <a-assets>
        <a-asset-item id="particleData" src="data.json"></a-asset-item>
      </a-assets>

      <a-entity
        position = "0.3 0 0"
        scale = "10 10 10"
        particle_simulation = "source:#particleData;dt:0.2;focusSphereSelector:.focus;focusSphere:#sph1;focusSphereRadius:1">
      </a-entity>
      
      <a-sphere 
        id = "sph1"
        class = "focus"
        position="0 0 0"
        radius="1"
        material="wireframe:true;color:green;transparent:true;opacity:0.5">
      </a-sphere>
    </a-scene>
  </body>
</html>
```
