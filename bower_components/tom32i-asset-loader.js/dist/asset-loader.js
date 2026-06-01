/*!
 * asset-loader.js 0.0.2
 * https://github.com/Tom32i/asset-loader.js
 * Copyright 2014 Thomas JARRAND
 */

/**
 * Asset
 *
 * @param {string} source
 * @param {Function} callback
 * @param {Boolean} load
 */
function Asset(source, callback, load)
{
    this.element = new Image();
    this.source  = source;

    this.element.asset = this;
    this.element.addEventListener('load', callback);

    if (typeof(load) != 'undefined' && load) {
        this.load();
    }
}

/**
 * Set source
 *
 * @param {String} source
 */
Asset.prototype.setSource = function (source)
{
    this.source = source;
};

/**
 * Load
 */
Asset.prototype.load = function ()
{
    this.element.src = this.source;
};

/**
 * Get image
 *
 * @return {Image}
 */
Asset.prototype.getImage = function ()
{
    return this.element;
};

/**
 * Get image width
 *
 * @return {Number}
 */
Asset.prototype.getWidth = function ()
{
    return this.element.width;
};

/**
 * Get image height
 *
 * @return {Number}
 */
Asset.prototype.getHeight = function ()
{
    return this.element.height;
};
/**
 * Canvas for asset treatment
 *
 * @param {Number} width
 * @param {Height} height
 */
function AssetCanvas(width, height)
{
    this.element = document.createElement('canvas');
    this.context = this.element.getContext('2d');

    this.element.width  = width;
    this.element.height = height;
}

/**
 * Clear
 */
AssetCanvas.prototype.clear = function()
{
    this.context.clearRect(0, 0, this.element.width, this.element.height);
};

/**
 * To string
 *
 * @return {String}
 */
AssetCanvas.prototype.toString = function()
{
    return this.element.toDataURL();
};

/**
 * Draw image from source
 *
 * @param {Image} image
 * @param {Number} x
 * @param {Number} y
 */
AssetCanvas.prototype.drawImageFromSource = function(image, x, y)
{
    var width = this.element.width,
        height = this.element.height;

    this.context.drawImage(image, x, y, width, height, 0, 0, width, height);
};
/**
 * Sound asset
 *
 * @param {String} source
 * @param {Function} callback
 * @param {Boolean} load
 * @param {Object} formats
 */
function SoundAsset(source, callback, load, formats)
{
    this.source  = source;
    this.element = new Audio();
    this.formats = typeof(formats) != 'undefined' ? formats : this.formats;

    this.element.asset = this;
    this.element.addEventListener('canplaythrough', callback);

    this.attachSources();

    if (typeof(load) != 'undefined' && load) {
        this.load();
    }
}

/**
 * Formats
 *
 * @type {Object}
 */
SoundAsset.prototype.formats = {
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg'
};

/**
 * Attach sources
 */
SoundAsset.prototype.attachSources = function()
{
    for (var format in this.formats) {
        var source = document.createElement('source');
        source.type = this.formats[format];
        this.element.appendChild(source);
    }
};

/**
 * Load
 */
SoundAsset.prototype.load = function ()
{
    document.body.appendChild(this.element);

    var i = 0;

    for (var format in this.formats) {
        this.element.childNodes[i].src = this.source + '.' + format;
        i++;
    }
};

/**
 * Get the audio element
 *
 * @return {Element}
 */
SoundAsset.prototype.getAudio = function ()
{
    return this.element;
};
/**
 * Sprite Asset
 *
 * @param {String} source
 * @param {Number} columns
 * @param {Number} rows
 * @param {Function} callback
 * @param {Boolean} load
 */
function SpriteAsset (source, columns, rows, callback, load)
{
    this.source   = source;
    this.columns  = columns;
    this.rows     = rows;
    this.callback = callback;
    this.length   = columns * rows;

    this.width  = 0;
    this.height = 0;
    this.images = [];
    this.assets = [];
    this.loaded = 0;

    this.preLoaded  = this.preLoaded.bind(this);
    this.partLoaded = this.partLoaded.bind(this);

    this.createImages();

    if (typeof(load) != 'undefined' && load) {
        this.load();
    }
}

/**
 * Load
 */
SpriteAsset.prototype.load = function ()
{
    var sprite = new Asset(this.source, this.preLoaded.bind(this));

    this.source = sprite.getImage();

    sprite.load();
};

/**
 * Create images
 */
SpriteAsset.prototype.createImages = function()
{
    for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.columns; col++) {
            var asset = new Asset(null, this.partLoaded);
            this.assets.push({asset: asset, row: row, col: col});
            this.images.push(asset.getImage());
        }
    }
};

/**
 * On sprite preloaded
 *
 * @param {Event} e
 */
SpriteAsset.prototype.preLoaded = function (e)
{
    this.width  = this.source.width/this.columns;
    this.height = this.source.height/this.rows;
    this.canvas = new AssetCanvas(this.width, this.height);

    var i, assetData, asset, x ,y;

    for (i = this.assets.length - 1; i >= 0; i--) {
        assetData = this.assets[i];
        asset     = assetData.asset;
        x         = assetData.col * this.width;
        y         = assetData.row * this.height;

        this.canvas.clear();
        this.canvas.drawImageFromSource(this.source, x, y);

        asset.setSource(this.canvas.toString());
        asset.load();
    }

    delete this.canvas;
};

/**
 * On a sub image is loaded
 *
 * @param {Event} e
 */
SpriteAsset.prototype.partLoaded = function(e)
{
    this.loaded++;

    if (this.loaded === this.images.length) {
        this.callback.call();
    }
};

/**
 * Get images
 *
 * @return {Array}
 */
SpriteAsset.prototype.getImages = function ()
{
    return this.images;
};