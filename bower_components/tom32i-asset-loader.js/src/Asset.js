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