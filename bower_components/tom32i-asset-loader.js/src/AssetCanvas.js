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