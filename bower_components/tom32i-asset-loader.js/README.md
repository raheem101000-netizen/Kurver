asset-loader.js
===============

Image, sprite, sound loader for HTML5 games.

## Install:

    bower install --save tom32i-asset-loader.js

## Usage:

__Image:__

To load a single image:

`var asset = new Asset(source, callback, load);`

* source: (String) The url of the image
* callback: (Function) Callback called when the image is loaded
* load: (Boolean) Start load imediately?

```javascript
var image = new Asset('jeff.jpg', function (e) {
    container.appendChild(image.getImage());
});
```

__Sprite:__

To load an image an split it into several images according to a grid:

`var asset = new SpriteAsset(url, columns, rows, callback, load);`

* source: (String) The url of the image
* callback: (Function) Callback called when the image is loaded and splited
* columns: number of columns in the grid
* rows: number of rows in the grid
* load: (Boolean) Start load imediately?

```javascript
var sprite = new SpriteAsset('jeff.jpg', 3, 2, function (e) {
    var images = sprite.getImages();

    for (var i = images.length - 1; i >= 0; i--) {
        container.appendChild(images[i]);
    }
});
```