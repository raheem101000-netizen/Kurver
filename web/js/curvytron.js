/**
 * Collection
 *
 * @param {Array} items
 * @param {String} key
 * @param {Boolean} index
 */
function Collection(items, key, index)
{
    this.ids   = [];
    this.items = [];
    this.key   = typeof(key) !== 'undefined' && key ? key : 'id';
    this.index = typeof(index) !== 'undefined' && index;
    this.id    = 0;

    if (items) {
        for (var i = items.length - 1; i >= 0; i--) {
            this.add(items[i]);
        }
    }
}

/**
 * Clear
 */
Collection.prototype.clear = function()
{
    this.ids.length   = 0;
    this.items.length = 0;
    this.id           = 0;
};

/**
 * Count the size of the collection
 *
 * @return {Number}
 */
Collection.prototype.count = function()
{
    return this.ids.length;
};

/**
 * Is the collection empty?
 *
 * @return {Boolean}
 */
Collection.prototype.isEmpty = function()
{
    return this.ids.length === 0;
};

/**
 * Add an element
 *
 * @param {mixed} element
 * @param {Number} ttl
 *
 * @return {Boolean}
 */
Collection.prototype.add = function(element, ttl)
{
    this.setId(element);

    if (this.exists(element)) { return false; }

    this.ids.push(element[this.key]);

    var index = this.ids.indexOf(element[this.key]);

    this.items[index] = element;

    if (typeof(ttl) !== 'undefined' && ttl) {
        var collection = this;
        setTimeout(function () { collection.remove(element); }, ttl);
    }

    return true;
};

/**
 * Remove an element
 *
 * @param {mixed} element
 *
 * @return {Boolean}
 */
Collection.prototype.remove = function(element)
{
    var index = this.ids.indexOf(element[this.key]);

    if (index >= 0) {
        this.deleteIndex(index);
        return true;
    }

    return false;
};

/**
 * Remove an element by its id
 *
 * @param {mixed} id
 *
 * @return {Boolean}
 */
Collection.prototype.removeById = function(id)
{
    var index = this.ids.indexOf(id);

    if (index >= 0) {
        this.deleteIndex(index);
        return true;
    }

    return false;
};

/**
 * Set the id of an element
 *
 * @param {mixed} element
 */
Collection.prototype.setId = function(element)
{
    if (this.index) {
        if (typeof(element[this.key]) !== 'undefined' && element[this.key]) {
            if (element[this.key] > this.id) {
                this.id = element[this.key];
            }
        } else {
            element[this.key] = ++this.id;
        }
    }
};

/**
 * Get the index for the given element
 *
 * @param {mixed} element
 *
 * @return {Number}
 */
Collection.prototype.getElementIndex = function(element)
{
    return this.ids.indexOf(element[this.key]);
};

/**
 * Get the index fo the given id
 *
 * @param {Number} id
 *
 * @return {Number}
 */
Collection.prototype.getIdIndex = function(id)
{
    return this.ids.indexOf(id);
};

/**
 * Delete the element at the given index
 *
 * @param {Number} index
 */
Collection.prototype.deleteIndex = function(index)
{
    this.items.splice(index, 1);
    this.ids.splice(index, 1);
};

/**
 * Get an element by its id
 *
 * @param {Number} id
 *
 * @return {mixed}
 */
Collection.prototype.getById = function(id)
{
    var index = this.ids.indexOf(id);

    return index >= 0 ? this.items[index] : null;
};

/**
 * Get an element by its index
 *
 * @param {Number} index
 *
 * @return {mixed}
 */
Collection.prototype.getByIndex = function(index)
{
    return typeof(this.items[index]) !== 'undefined' ? this.items[index] : null;
};

/**
 * Test if an element is in the collection
 *
 * @param {mixed} element
 *
 * @return {Boolean}
 */
Collection.prototype.exists = function(element)
{
    return this.getElementIndex(element) >= 0;
};

/**
 * Test if the given index exists is in the collection
 *
 * @param {String} index
 *
 * @return {Boolean}
 */
Collection.prototype.indexExists = function(index)
{
    return this.ids.indexOf(index) >= 0;
};

/**
 * Map
 *
 * @param {Function} callable
 *
 * @return {Collection}
 */
Collection.prototype.map = function(callable)
{
    var elements = [];

    for (var i = this.items.length - 1; i >= 0; i--) {
        elements.push(callable.call(this.items[i]));
    }

    return new Collection(elements, this.key, this.index);
};

/**
 * Filter
 *
 * @param {Function} callable
 *
 * @return {Collection}
 */
Collection.prototype.filter = function(callable)
{
    var elements = [];

    for (var i = this.items.length - 1; i >= 0; i--) {
        if (callable.call(this.items[i])) {
            elements.push(this.items[i]);
        }
    }

    return new Collection(elements, this.key, this.index);
};

/**
 * Match
 *
 * @param {Function} callable
 *
 * @return {Collection}
 */
Collection.prototype.match = function(callable)
{
    var length = this.items.length;

    for (var i = 0; i < length; i++) {
        if (callable.call(this.items[i])) {
            return this.items[i];
        }
    }

    return null;
};

/**
 * Apply the given callback to all element
 *
 * @param {Function} callable
 */
Collection.prototype.walk = function(callable)
{
    for (var i = this.items.length - 1; i >= 0; i--) {
        callable.call(this.items[i]);
    }
};

/**
 * Get random item from the collection
 *
 * @return {mixed}
 */
Collection.prototype.getRandomItem = function()
{
    if (this.items.length === 0) {
        return null;
    }

    return this.items[Math.floor(Math.random() * this.items.length)];
};

/**
 * Get first item in collection
 *
 * @return {Mixed}
 */
Collection.prototype.getFirst = function()
{
    return this.items.length > 0 ? this.items[0] : null;
};

/**
 * Get last item in collection
 *
 * @return {Mixed}
 */
Collection.prototype.getLast = function()
{
    return this.items.length > 0 ? this.items[this.items.length - 1] : null;
};

/**
 * Sort
 *
 * @param {Function} callable
 */
Collection.prototype.sort = function(callable)
{
    this.items.sort(callable);
    this.rebuildIds();
};

/**
 * Rebuild Ids
 */
Collection.prototype.rebuildIds = function()
{
    var ids = new Array(this.items.length);

    for (var i = this.items.length - 1; i >= 0; i--) {
        ids[i] = this.items[i][this.key];
    }

    this.ids = ids;
};
/**
 * Base Socket Client
 *
 * @param {Object} socket
 * @param {Number} interval
 */
function BaseSocketClient(socket, interval)
{
    EventEmitter.call(this);

    this.socket    = socket;
    this.interval  = typeof(interval) === 'number' ? interval : 0;
    this.events    = [];
    this.callbacks = {};
    this.loop      = null;
    this.connected = true;
    this.callCount = 0;

    this.flush     = this.flush.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onClose   = this.onClose.bind(this);

    this.attachEvents();
    this.start();
}

BaseSocketClient.prototype = Object.create(EventEmitter.prototype);
BaseSocketClient.prototype.constructor = BaseSocketClient;

/**
 * On socket close
 */
BaseSocketClient.prototype.onClose = function()
{
    this.connected = false;
    this.emit('close', this);
    this.stop();
    this.detachEvents();
};


/**
 * Set interval
 *
 * @param {Number} interval
 */
BaseSocketClient.prototype.setInterval = function(interval)
{
    this.stop();
    this.flush();

    this.interval = typeof(interval) === 'number' ? interval : 0;

    this.start();
};

/**
 * Start
 */
BaseSocketClient.prototype.start = function()
{
    if (this.interval && !this.loop) {
        this.loop = setInterval(this.flush, this.interval);
        this.flush();
    }
};

/**
 * Stop
 */
BaseSocketClient.prototype.stop = function()
{
    if (this.loop) {
        clearInterval(this.loop);
        this.loop = null;
    }
};

/**
 * Attach events
 */
BaseSocketClient.prototype.attachEvents = function()
{
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
};

/**
 * Detach Events
 */
BaseSocketClient.prototype.detachEvents = function()
{
    this.socket.removeEventListener('message', this.onMessage);
    this.socket.removeEventListener('close', this.onClose);
};

/**
 * Add an event to the list
 *
 * @param {String} name
 * @param {Object} data
 * @param {Function} callback
 * @param {Boolean} force
 */
BaseSocketClient.prototype.addEvent = function (name, data, callback, force)
{
    var event = [name];

    if (typeof(data) !== 'undefined') {
        event[1] = data;
    }

    if (typeof(callback) === 'function') {
        event[2] = this.indexCallback(callback);
    }

    if (!this.interval || (typeof(force) !== 'undefined' && force)) {
        this.sendEvents([event]);
    } else {
        this.events.push(event);
        this.start();
    }
};

/**
 * Add an event to the list
 *
 * @param {Array} events
 * @param {Boolean} force
 */
BaseSocketClient.prototype.addEvents = function (sources, force)
{
    var length = sources.length,
        events = [];

    for (var i = 0; i < length; i++) {
        events.push(sources[i]);
    }

    if (!this.interval || force) {
        this.sendEvents(events);
    } else {
        Array.prototype.push.apply(this.events, events);
        this.start();
    }
};

/**
 * Index a new callback
 *
 * @param {Function} callback
 *
 * @return {Number}
 */
BaseSocketClient.prototype.indexCallback = function(callback)
{
    var index = this.callCount++;

    this.callbacks[index] = callback;

    return index;
};

/**
 * Add a callback
 *
 * @param {Number} id
 * @param {Object} data
 */
BaseSocketClient.prototype.addCallback = function (id, data)
{
    var event = [id];

    if (typeof(data) !== 'undefined') {
        event[1] = data;
    }

    this.sendEvents([event]);
};

/**
 * Send an event
 *
 * @param {String} name
 * @param {String} data
 */
BaseSocketClient.prototype.sendEvents = function (events)
{
    this.socket.send(JSON.stringify(events));
};

/**
 * Send Events
 */
BaseSocketClient.prototype.flush = function ()
{
    if (this.events.length > 0) {
        this.sendEvents(this.events);
        this.events.length = 0;
    }
};

/**
 * On message
 *
 * @param {Event} e
 */
BaseSocketClient.prototype.onMessage = function (e)
{
    var data = JSON.parse(e.data),
        length = data.length,
        name, source;

    for (var i = 0; i < length; i++) {
        source = data[i];
        name = source[0];

        if (typeof(name) === 'string') {
            if (source.length === 3) {
                this.emit(name, [source[1], this.createCallback(source[2])]);
            } else {
                this.emit(name, source[1]);
            }
        } else {
            this.playCallback(name, typeof(source[1]) !== 'undefined' ? source[1] : null);
        }
    }
};

/**
 * Play an indexed callback
 *
 * @param {Number} id
 * @param {Object|null} data
 */
BaseSocketClient.prototype.playCallback = function(id, data)
{
    if (typeof(this.callbacks[id]) !== 'undefined') {
        this.callbacks[id](data);
        delete this.callbacks[id];
    }
};

/**
 * Create callback
 *
 * @param {Number} id
 *
 * @return {Function}
 */
BaseSocketClient.prototype.createCallback = function(id)
{
    var client = this;

    return function (data) { client.addCallback(id, data); };
};

/**
 * Object version of the client
 *
 * @return {Object}
 */
BaseSocketClient.prototype.serialize = function()
{
    return {id: this.id};
};
/**
 * Base Bonus Manager
 *
 * @param {Game} game
 */
function BaseBonusManager(game)
{
    EventEmitter.call(this);

    this.game    = game;
    this.bonuses = new Collection([], 'id', true);

    this.clear = this.clear.bind(this);
}

BaseBonusManager.prototype = Object.create(EventEmitter.prototype);
BaseBonusManager.prototype.constructor = BaseBonusManager;

/**
 * Maximum number of bonus on the map at the same time
 *
 * @type {Number}
 */
BaseBonusManager.prototype.bonusCap = 20;

/**
 * Interval between two bonus pop (will vary from a factor x1 to x3)
 *
 * @type {Number}
 */
BaseBonusManager.prototype.bonusPopingTime = 3000;

/**
 * Margin from bonus to trails
 *
 * @type {Number}
 */
BaseBonusManager.prototype.bonusPopingMargin = 0.01;

/**
 * Start
 */
BaseBonusManager.prototype.start = function()
{
    this.clear();
};

/**
 * Stop
 */
BaseBonusManager.prototype.stop = function()
{
    this.clear();
};

/**
 * Add bonus
 *
 * @param {Bonus} bonus
 */
BaseBonusManager.prototype.add = function(bonus)
{
    return this.bonuses.add(bonus);
};

/**
 * Remove bonus
 *
 * @param {Bonus} bonus
 */
BaseBonusManager.prototype.remove = function(bonus)
{
    bonus.clear();

    return this.bonuses.remove(bonus);
};

/**
 * Clear bonuses
 */
BaseBonusManager.prototype.clear = function()
{
    for (var i = this.bonuses.items.length - 1; i >= 0; i--) {
        this.bonuses.items[i].clear();
    }

    this.bonuses.clear();
};
/**
 * Base Avatar
 *
 * @param {Player} player
 */
function BaseAvatar(player)
{
    EventEmitter.call(this);

    this.id              = player.id;
    this.name            = player.name;
    this.color           = player.color;
    this.player          = player;
    this.x               = 0;
    this.y               = 0;
    this.trail           = new Trail(this);
    this.bonusStack      = new BonusStack(this);
    this.angle           = 0;
    this.velocityX       = 0;
    this.velocityY       = 0;
    this.angularVelocity = 0;
    this.alive           = true;
    this.printing        = false;
    this.score           = 0;
    this.roundScore      = 0;
    this.ready           = false;
    this.present         = true;

    // useless too? this.updateVelocities();
}

BaseAvatar.prototype = Object.create(EventEmitter.prototype);
BaseAvatar.prototype.constructor = BaseAvatar;

/**
 * Movement velocity
 *
 * @type {Number}
 */
BaseAvatar.prototype.velocity = 16;

/**
 * Turn velocity
 *
 * @type {Float}
 */
BaseAvatar.prototype.angularVelocityBase = 2.8/1000;

/**
 * Radius
 *
 * @type {Number}
 */
BaseAvatar.prototype.radius = 0.6;

/**
 * Number of trail points that don't kill the player
 *
 * @type {Number}
 */
BaseAvatar.prototype.trailLatency = 3;

/**
 * Inverted controls
 *
 * @type {Boolean}
 */
BaseAvatar.prototype.inverse = false;

/**
 * Invincible
 *
 * @type {Boolean}
 */
BaseAvatar.prototype.invincible = false;

/**
 * Type of tunrn: round or straight
 *
 * @type {Boolean}
 */
BaseAvatar.prototype.directionInLoop = true;

/**
 * Equal
 *
 * @param {Avatar} avatar
 *
 * @return {Boolean}
 */
BaseAvatar.prototype.equal = function(avatar)
{
    return this.id === avatar.id;
};

/**
 * Set Point
 *
 * @param {Float} x
 * @param {Float} y
 */
BaseAvatar.prototype.setPosition = function(x, y)
{
    this.x = x;
    this.y = y;
};

/**
 * Add point
 *
 * @param {Float} x
 * @param {Float} y
 */
BaseAvatar.prototype.addPoint = function(x, y)
{
    this.trail.addPoint(x, y);
};

/**
 * Update angular velocity
 *
 * @param {Number} factor
 */
BaseAvatar.prototype.updateAngularVelocity = function(factor)
{
    if (typeof(factor) === 'undefined') {
        if (this.angularVelocity === 0) { return; }
        factor = (this.angularVelocity > 0 ? 1 : -1) * (this.inverse ? -1 : 1);
    }

    this.setAngularVelocity(factor * this.angularVelocityBase * (this.inverse ? -1 : 1));
};

/**
 * Set angular velocity
 *
 * @param {Float} angularVelocity
 */
BaseAvatar.prototype.setAngularVelocity = function(angularVelocity)
{
    this.angularVelocity = angularVelocity;
};

/**
 * Set angle
 *
 * @param {Float} angle
 */
BaseAvatar.prototype.setAngle = function(angle)
{
    if (this.angle !== angle) {
        this.angle = angle;
        this.updateVelocities();
    }
};

/**
 * Update
 *
 * @param {Number} step
 */
BaseAvatar.prototype.update = function(step) {};

/**
 * Add angle
 *
 * @param {Number} step
 */
BaseAvatar.prototype.updateAngle = function(step)
{
    if (this.angularVelocity) {
        if (this.directionInLoop) {
            this.setAngle(this.angle + this.angularVelocity * step);
        } else {
            this.setAngle(this.angle + this.angularVelocity);
            this.updateAngularVelocity(0);
        }
    }
};

/**
 * Update position
 *
 * @param {Number} step
 */
BaseAvatar.prototype.updatePosition = function(step)
{
    this.setPosition(
        this.x + this.velocityX * step,
        this.y + this.velocityY * step
    );
};

/**
 * Set velocity
 *
 * @param {Number} step
 */
BaseAvatar.prototype.setVelocity = function(velocity)
{
    velocity = Math.max(velocity, BaseAvatar.prototype.velocity/2);

    if (this.velocity !== velocity) {
        this.velocity = velocity;
        this.updateVelocities();
    }
};

/**
 * Update velocities
 */
BaseAvatar.prototype.updateVelocities = function()
{
    var velocity = this.velocity/1000;

    this.velocityX = Math.cos(this.angle) * velocity;
    this.velocityY = Math.sin(this.angle) * velocity;

    this.updateBaseAngularVelocity();
};

/**
 * Update base angular velocity
 */
BaseAvatar.prototype.updateBaseAngularVelocity = function()
{
    if (this.directionInLoop) {
        var ratio = this.velocity / BaseAvatar.prototype.velocity;
        this.angularVelocityBase = ratio * BaseAvatar.prototype.angularVelocityBase + Math.log(1/ratio)/1000;
        this.updateAngularVelocity();
    }
};

/**
 * Set radius
 *
 * @param {Number} radius
 */
BaseAvatar.prototype.setRadius = function(radius)
{
    this.radius = Math.max(radius, BaseAvatar.prototype.radius/8);
};

/**
 * Set inverse
 *
 * @param {Number} inverse
 */
BaseAvatar.prototype.setInverse = function(inverse)
{
    if (this.inverse !== inverse) {
        this.inverse = inverse ? true : false;
        this.updateAngularVelocity();
    }
};

/**
 * Set invincible
 *
 * @param {Number} invincible
 */
BaseAvatar.prototype.setInvincible = function(invincible)
{
    this.invincible = invincible ? true : false;
};

/**
 * Get distance
 *
 * @param {Number} fromX
 * @param {Number} fromY
 * @param {Number} toX
 * @param {Number} toY
 *
 * @return {Number}
 */
BaseAvatar.prototype.getDistance = function(fromX, fromY, toX, toY)
{
    return Math.sqrt(Math.pow(fromX - toX, 2) + Math.pow(fromY - toY, 2));
};

/**
 * Die
 */
BaseAvatar.prototype.die = function()
{
    this.bonusStack.clear();
    this.alive = false;
    this.addPoint(this.x, this.y);
};

/**
 * Set printing
 *
 * @param {Boolean} printing
 */
BaseAvatar.prototype.setPrinting = function(printing)
{
    printing = printing ? true : false;

    if (this.printing !== printing) {
        this.printing = printing;

        this.addPoint(this.x, this.y, true);

        if (!this.printing) {
            this.trail.clear();
        }
    }
};

/**
 * This score
 *
 * @param {Number} score
 */
BaseAvatar.prototype.addScore = function(score)
{
    this.setRoundScore(this.roundScore + score);
};

/**
 * Resolve score
 *
 * @param {Number} score
 */
BaseAvatar.prototype.resolveScore = function()
{
    this.setScore(this.score + this.roundScore);
    this.roundScore = 0;
};

/**
 * This round score
 *
 * @param {Number} score
 */
BaseAvatar.prototype.setRoundScore = function(score)
{
    this.roundScore = score;
};

/**
 * This score
 *
 * @param {Number} score
 */
BaseAvatar.prototype.setScore = function(score)
{
    this.score = score;
};

/**
 * Set color
 *
 * @param {Number} color
 */
BaseAvatar.prototype.setColor = function(color)
{
    this.color = color;
};

/**
 * Clear
 */
BaseAvatar.prototype.clear = function()
{
    this.bonusStack.clear();

    this.x                   = this.radius;
    this.y                   = this.radius;
    this.angle               = 0;
    this.velocityX           = 0;
    this.velocityY           = 0;
    this.angularVelocity     = 0;
    this.roundScore          = 0;
    this.velocity            = BaseAvatar.prototype.velocity;
    this.alive               = true;
    this.printing            = false;
    this.color               = this.player.color;
    this.radius              = BaseAvatar.prototype.radius;
    this.inverse             = BaseAvatar.prototype.inverse;
    this.invincible          = BaseAvatar.prototype.invincible;
    this.directionInLoop     = BaseAvatar.prototype.directionInLoop;
    this.angularVelocityBase = BaseAvatar.prototype.angularVelocityBase;

    if (this.body) {
        this.body.radius = BaseAvatar.prototype.radius;
    }

    // useless? this.updateVelocities();
};

/**
 * Destroy
 */
BaseAvatar.prototype.destroy = function()
{
    this.clear();
    this.present = false;
    this.alive   = false;
};

/**
 * Serialize
 *
 * @return {Object}
 */
BaseAvatar.prototype.serialize = function()
{
    return {
        id: this.id,
        name: this.name,
        color: this.color,
        score: this.score
    };
};
/**
 * BaseBonus
 *
 * @param {Number} x
 * @param {Number} y
 */
function BaseBonus(x, y)
{
    EventEmitter.call(this);

    this.x  = x;
    this.y  = y;
    this.id = null;
}

BaseBonus.prototype = Object.create(EventEmitter.prototype);
BaseBonus.prototype.constructor = BaseBonus;

/**
 * Target affected
 *
 * @type {String}
 */
BaseBonus.prototype.affect = 'self';

/**
 * Radius
 *
 * @type {Number}
 */
BaseBonus.prototype.radius = 3;

/**
 * Effect duration
 *
 * @type {Number}
 */
BaseBonus.prototype.duration = 5000;

/**
 * Probability to appear
 *
 * @type {Number}
 */
BaseBonus.prototype.probability = 1;

/**
 * Clear
 *
 * @param {Array} point
 */
BaseBonus.prototype.clear = function () {};

/**
 * Apply to target(s)
 *
 * @param {Avatar} avatar
 * @param {Game} game
 *
 * @return {Number}
 */
BaseBonus.prototype.applyTo = function (avatar, game) {};

/**
 * Get probability
 *
 * @param {Game} game
 *
 * @return {Number}
 */
BaseBonus.prototype.getProbability = function (game)
{
    return BaseBonus.prototype.probability;
};
/**
 * Base Bonus Stack
 *
 * @param {Object} target
 */
function BaseBonusStack (target)
{
    EventEmitter.call(this);

    this.target  = target;
    this.bonuses = new Collection();
}

BaseBonusStack.prototype = Object.create(EventEmitter.prototype);
BaseBonusStack.prototype.constructor = BaseBonusStack;

/**
 * Add bonus to the stack
 *
 * @param {Bonus} bonus
 */
BaseBonusStack.prototype.add = function(bonus)
{
    if (this.bonuses.add(bonus)) {
        this.resolve();
    }
};

/**
 * Remove bonus from the stack
 *
 * @param {Bonus} bonus
 */
BaseBonusStack.prototype.remove = function(bonus)
{
    if (this.bonuses.remove(bonus)) {
        this.resolve(bonus);
    }
};

/**
 * Clear
 */
BaseBonusStack.prototype.clear = function()
{
    this.bonuses.clear();
};

/**
 * Resolve
 */
BaseBonusStack.prototype.resolve = function(bonus)
{
    var properties = {},
        effects, property, i, j;

    if (typeof(bonus) !== 'undefined') {
        effects = bonus.getEffects(this.target);
        for (i = effects.length - 1; i >= 0; i--) {
            property = effects[i][0];
            properties[property] = this.getDefaultProperty(property);
        }
    }

    for (i = this.bonuses.items.length - 1; i >= 0; i--) {
        effects = this.bonuses.items[i].getEffects(this.target);
        for (j = effects.length - 1; j >= 0; j--) {
            property = effects[j][0];

            if (typeof(properties[property]) === 'undefined') {
                properties[property] = this.getDefaultProperty(property);
            }

            this.append(properties, property, effects[j][1]);
        }
    }

    for (property in properties) {
        if (properties.hasOwnProperty(property)) {
            this.apply(property, properties[property]);
        }
    }
};

/**
 * Apply the value to target's property
 *
 * @param {String} property
 * @param {Number} value
 */
BaseBonusStack.prototype.apply = function(property, value)
{
    this.target[property] = value;
};

/**
 * Get default property
 *
 * @param {String} property
 *
 * @return {Number}
 */
BaseBonusStack.prototype.getDefaultProperty = function(property)
{
    return 0;
};

/**
 * Append
 *
 * @param {Object} properties
 * @param {String} property
 * @param {Number} value
 */
BaseBonusStack.prototype.append = function(properties, property, value)
{
    properties[property] += value;
};
/**
 * BaseGame
 *
 * @param {Room} room
 */
function BaseGame(room)
{
    EventEmitter.call(this);

    this.room         = room;
    this.name         = this.room.name;
    this.frame        = null;
    this.avatars      = this.room.players.map(function () { return this.getAvatar(); });
    this.size         = this.getSize(this.avatars.count());
    this.rendered     = null;
    this.maxScore     = room.config.getMaxScore();
    this.fps          = new FPSLogger();
    this.started      = false;
    this.bonusManager = new BonusManager(this, room.config.getBonuses(), room.config.getVariable('bonusRate'));
    this.inRound      = false;

    this.start    = this.start.bind(this);
    this.stop     = this.stop.bind(this);
    this.loop     = this.loop.bind(this);
    this.newRound = this.newRound.bind(this);
    this.endRound = this.endRound.bind(this);
    this.end      = this.end.bind(this);
    this.onFrame  = this.onFrame.bind(this);
}

BaseGame.prototype = Object.create(EventEmitter.prototype);
BaseGame.prototype.constructor = BaseGame;

/**
 * Loop frame rate
 *
 * @type {Number}
 */
BaseGame.prototype.framerate = 1/60 * 1000;

/**
 * Map size factor per player
 *
 * @type {Number}
 */
BaseGame.prototype.perPlayerSize = 80;

/**
 * Time before round start
 *
 * @type {Number}
 */
BaseGame.prototype.warmupTime = 3000;

/**
 * Time after round end
 *
 * @type {Number}
 */
BaseGame.prototype.warmdownTime = 5000;

/**
 * Margin from borders
 *
 * @type {Number}
 */
BaseGame.prototype.spawnMargin = 0.05;

/**
 * Angle margin from borders
 *
 * @type {Number}
 */
BaseGame.prototype.spawnAngleMargin = 0.3;

/**
 * Borderless
 *
 * @type {Boolean}
 */
BaseGame.prototype.borderless = false;

/**
 * Update
 *
 * @param {Number} step
 */
BaseGame.prototype.update = function(step) {};

/**
 * Remove a avatar from the game
 *
 * @param {Avatar} avatar
 */
BaseGame.prototype.removeAvatar = function(avatar)
{
    if (this.avatars.exists(avatar)) {
        avatar.die();
        avatar.destroy();
    }
};

/**
 * Start loop
 */
BaseGame.prototype.start = function()
{
    if (!this.frame) {
        this.onStart();
        this.loop();
    }
};

/**
 * Stop loop
 */
BaseGame.prototype.stop = function()
{
    if (this.frame) {
        this.clearFrame();
        this.onStop();
    }
};

/**
 * Animation loop
 */
BaseGame.prototype.loop = function()
{
    this.newFrame();

    var now  = new Date().getTime(),
        step = now - this.rendered;

    this.rendered = now;

    this.onFrame(step);
    this.fps.onFrame();
};

/**
 * On start
 */
BaseGame.prototype.onStart = function()
{
    this.rendered = new Date().getTime();
    this.bonusManager.start();
    this.fps.start();
};

/**
 * Onn stop
 */
BaseGame.prototype.onStop = function()
{
    this.rendered = null;
    this.bonusManager.stop();
    this.fps.stop();

    var size = this.getSize(this.getPresentAvatars().count());

    if (this.size !== size) {
        this.setSize(size);
    }
};

/**
 * On round new
 */
BaseGame.prototype.onRoundNew = function()
{
    this.borderless = BaseGame.prototype.borderless;

    this.bonusManager.clear();

    for (var i = this.avatars.items.length - 1; i >= 0; i--) {
        if (this.avatars.items[i].present) {
            this.avatars.items[i].clear();
        }
    }
};

/**
 * On round end
 */
BaseGame.prototype.onRoundEnd = function() {};

/**
 * Get new frame
 */
BaseGame.prototype.newFrame = function()
{
    this.frame = setTimeout(this.loop, this.framerate);
};

/**
 * Clear frame
 */
BaseGame.prototype.clearFrame = function()
{
    clearTimeout(this.frame);
    this.frame = null;
};

/**
 * On frame
 *
 * @param {Number} step
 */
BaseGame.prototype.onFrame = function(step)
{
    this.update(step);
};

/**
 * Update game size
 */
BaseGame.prototype.setSize = function()
{
    this.size = this.getSize(this.getPresentAvatars().count());
};

/**
 * Get size by players
 *
 * @param {Number} players
 *
 * @return {Number}
 */
BaseGame.prototype.getSize = function(players)
{
    var square = this.perPlayerSize * this.perPlayerSize,
        size   = Math.sqrt(square + ((players - 1) * square / 5));

    return Math.round(size);
};

/**
 * Are all avatars ready?
 *
 * @return {Boolean}
 */
BaseGame.prototype.isReady = function()
{
    return this.getLoadingAvatars().isEmpty();
};

/**
 * Get still loading avatars
 *
 * @return {Collection}
 */
BaseGame.prototype.getLoadingAvatars = function()
{
    return this.avatars.filter(function () { return this.present && !this.ready; });
};

/**
 * Get alive avatars
 *
 * @return {Collection}
 */
BaseGame.prototype.getAliveAvatars = function()
{
    return this.avatars.filter(function () { return this.alive; });
};

/**
 * Get present avatars
 *
 * @return {Collection}
 */
BaseGame.prototype.getPresentAvatars = function()
{
    return this.avatars.filter(function () { return this.present; });
};

/**
 * Sort avatars
 *
 * @param {Object} avatars
 *
 * @return {Object}
 */
BaseGame.prototype.sortAvatars = function(avatars)
{
    avatars = typeof(avatars) !== 'undefined' ? avatars : this.avatars;

    avatars.sort(function (a, b) { return a.score > b.score ? -1 : (a.score < b.score ? 1 : 0); });

    return avatars;
};

/**
 * Set borderless
 *
 * @param {Boolean} borderless
 */
BaseGame.prototype.setBorderless = function(borderless)
{
    this.borderless = borderless ? true : false;
};

/**
 * Serialize
 *
 * @return {Object}
 */
BaseGame.prototype.serialize = function()
{
    return {
        name: this.name,
        players: this.avatars.map(function () { return this.serialize(); }).items,
        maxScore: this.maxScore
    };
};

/**
 * New round
 */
BaseGame.prototype.newRound = function(time)
{
    this.started = true;

    if (!this.inRound) {
        this.inRound = true;
        this.onRoundNew();
        setTimeout(this.start, typeof(time) !== 'undefined' ? time : this.warmupTime);
    }
};

/**
 * Check end of round
 */
BaseGame.prototype.endRound = function()
{
    if (this.inRound) {
        this.inRound = false;
        this.onRoundEnd();
        setTimeout(this.stop, this.warmdownTime);
    }
};

/**
 * FIN DU GAME
 */
BaseGame.prototype.end = function()
{
    if (this.started) {
        this.started = false;
        this.stop();
        this.emit('end', {game: this});

        return true;
    }

    return false;
};
/**
 * BasePlayer
 *
 * @param {String} client
 * @param {String} name
 * @param {String} color
 */
function BasePlayer(client, name, color, ready)
{
    EventEmitter.call(this);

    this.client = client;
    this.name   = name;
    this.color  = typeof(color) !== 'undefined' && this.validateColor(color) ? color : this.getRandomColor();
    this.ready  = typeof(ready) !== 'undefined' && ready;
    this.id     = null;
    this.avatar = null;
}

BasePlayer.prototype = Object.create(EventEmitter.prototype);
BasePlayer.prototype.constructor = BasePlayer;

/**
 * Max length for name
 *
 * @type {Number}
 */
BasePlayer.prototype.maxLength = 25;

/**
 * Max length for color
 *
 * @type {Number}
 */
BasePlayer.prototype.colorMaxLength = 20;

/**
 * Set name
 *
 * @param {String} name
 */
BasePlayer.prototype.setName = function(name)
{
    this.name = name;
};

/**
 * Set name
 *
 * @param {String} name
 */
BasePlayer.prototype.setColor = function(color)
{
    if (!this.validateColor(color, true)) { return false; }

    this.color = color;

    return true;
};

/**
 * Equal
 *
 * @param {Player} player
 *
 * @return {Boolean}
 */
BasePlayer.prototype.equal = function(player)
{
    return this.id === player.id;
};

/**
 * Toggle Ready
 *
 * @param {Boolean} toggle
 */
BasePlayer.prototype.toggleReady = function(toggle)
{
    this.ready = typeof(toggle) !== 'undefined' ? (toggle ? true : false) : !this.ready;
};

/**
 * Get avatar
 *
 * @return {Avatar}
 */
BasePlayer.prototype.getAvatar = function()
{
    if (!this.avatar) {
        this.avatar = new Avatar(this);
    }

    return this.avatar;
};

/**
 * Reset player after a game
 */
BasePlayer.prototype.reset = function()
{
    this.avatar.destroy();
    this.avatar = null;
    this.ready  = false;
};

/**
 * Serialize
 *
 * @return {Object}
 */
BasePlayer.prototype.serialize = function()
{
    return {
        client: this.client.id,
        id: this.id,
        name: this.name,
        color: this.color,
        ready: this.ready
    };
};

/**
 * Get random Color
 *
 * @return {String}
 */
BasePlayer.prototype.getRandomColor = function()
{
    var color = '',
        randomNum = function () { return Math.ceil(Math.random() * 255).toString(16); };

    while (!this.validateColor(color, true)) {
        color = '#' + randomNum() + randomNum() + randomNum();
    }

    return color;
};

/**
 * Validate color
 *
 * @param {String} color
 *
 * @return {Boolean}
 */
BasePlayer.prototype.validateColor = function(color, yiq)
{
    if (typeof(color) !== 'string') { return false; }

    var matches = color.match(new RegExp('^#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$'));

    if (matches && yiq) {
        var ratio = ((parseInt(matches[1], 16) * 0.4) + (parseInt(matches[2], 16) * 0.5) + (parseInt(matches[3], 16) * 0.3)) / 255;

        return ratio > 0.3;
    }

    return matches ? true : false;
};
/**
 * Base Room
 */
function BaseRoom(name)
{
    EventEmitter.call(this);

    this.name    = name;
    this.players = new Collection([], 'id', true);
    this.config  = new RoomConfig(this);

    this.closeGame = this.closeGame.bind(this);
}

BaseRoom.prototype = Object.create(EventEmitter.prototype);
BaseRoom.prototype.constructor = BaseRoom;

/**
 * Number of player needed to start a room
 *
 * @type {Number}
 */
BaseRoom.prototype.minPlayer = 1;

/**
 * Max length for name
 *
 * @type {Number}
 */
BaseRoom.prototype.maxLength = 25;

/**
 * Launch time
 *
 * @type {Number}
 */
BaseRoom.prototype.launchTime = 5000;

/**
 * Add player
 *
 * @param {Player} player
 */
BaseRoom.prototype.addPlayer = function(player)
{
    return this.players.add(player);
};

/**
 * Equal
 *
 * @param {Room} room
 *
 * @return {Boolean}
 */
BaseRoom.prototype.equal = function(room)
{
    return room ? this.name === room.name : false;
};

/**
 * Is name available?
 *
 * @param {String} name
 */
BaseRoom.prototype.isNameAvailable = function(name)
{
    return !this.players.match(function () { return this.name === name; });
};

/**
 * Remove player
 *
 * @param {Player} player
 */
BaseRoom.prototype.removePlayer = function(player)
{
    return this.players.remove(player);
};

/**
 * Is ready
 *
 * @return {Boolean}
 */
BaseRoom.prototype.isReady = function()
{
    return !this.game && this.players.count() >= this.minPlayer  && this.players.filter(function () { return !this.ready; }).isEmpty();
};

/**
 * Start warmpup
 */
BaseRoom.prototype.newGame = function()
{
    if (!this.game) {
        this.game = new Game(this);

        this.game.on('end', this.closeGame);
        this.emit('game:new', {room: this, game: this.game});

        return this.game;
    }

    return null;
};

/**
 * Close game
 */
BaseRoom.prototype.closeGame = function()
{
    if (this.game) {

        delete this.game;

        this.emit('game:end', {room: this});

        this.players = this.players.filter(function () { return this.client; });

        for (var i = this.players.items.length - 1; i >= 0; i--) {
            this.players.items[i].reset();
        }
    }
};

/**
 * Serialize
 *
 * @return {Object}
 */
BaseRoom.prototype.serialize = function(full)
{
    full = typeof(full) === 'undefined' || full;

    var data = {
        name: this.name,
        players: full ? this.players.map(function () { return this.serialize(); }).items : this.players.count(),
        game: this.game ? true : false,
        open: this.config.open
    };

    if (full) {
        data.config = this.config.serialize();
    }

    return data;
};
/**
 * Base room configuration
 */
function BaseRoomConfig(room)
{
    EventEmitter.call(this);

    this.room     = room;
    this.maxScore = null;
    this.open     = true;
    this.password = null;

    this.variables = {
        bonusRate: 0
    };

    this.bonuses  = {
        BonusSelfSmall: true,
        BonusSelfSlow: true,
        BonusSelfFast: true,
        BonusSelfMaster: true,
        BonusEnemySlow: true,
        BonusEnemyFast: true,
        BonusEnemyBig: true,
        BonusEnemyInverse: true,
        BonusEnemyStraightAngle: true,
        BonusGameBorderless: true,
        BonusAllColor: true,
        BonusGameClear: true
    };
}

BaseRoomConfig.prototype = Object.create(EventEmitter.prototype);
BaseRoomConfig.prototype.constructor = BaseRoomConfig;

/**
 * Password length
 *
 * @type {Number}
 */
BaseRoomConfig.prototype.passwordLength = 4;

/**
 * Set max score
 *
 * @param {Number} maxScore
 */
BaseRoomConfig.prototype.setMaxScore = function(maxScore)
{
    maxScore = parseInt(maxScore, 10);

    this.maxScore = maxScore ? maxScore : null;

    return true;
};

/**
 * Variable exists
 *
 * @param {String} variable
 *
 * @return {Boolean}
 */
BaseRoomConfig.prototype.variableExists = function(variable)
{
    return typeof(this.variables[variable]) !== 'undefined';
};

/**
 * Set variable
 *
 * @param {String} variable
 * @param {Float} value
 */
BaseRoomConfig.prototype.setVariable = function(variable, value)
{
    if (!this.variableExists(variable)) { return false; }

    value = parseFloat(value);

    if (-1 > value || value > 1 ) { return false; }

    this.variables[variable] = value;

    return true;
};

/**
 * Get variable
 *
 * @param {String} variable
 *
 * @return {Float}
 */
BaseRoomConfig.prototype.getVariable = function(variable)
{
    if (!this.variableExists(variable)) { return; }

    return this.variables[variable];
};

/**
 * Bonus exists
 *
 * @param {String} bonus
 *
 * @return {Boolean}
 */
BaseRoomConfig.prototype.bonusExists = function(bonus)
{
    return typeof(this.bonuses[bonus]) !== 'undefined';
};

/**
 * Toggle bonus
 *
 * @param {String} bonus
 *
 * @return {Boolean}
 */
BaseRoomConfig.prototype.toggleBonus = function(bonus)
{
    if (!this.bonusExists(bonus)) { return false; }

    this.bonuses[bonus] = !this.bonuses[bonus];

    return true;
};

/**
 * Get bonus value
 *
 * @param {String} bonus
 *
 * @return {Boolean}
 */
BaseRoomConfig.prototype.getBonus = function(bonus)
{
    if (!this.bonusExists(bonus)) { return; }

    return this.bonuses[bonus];
};

/**
 * Set bonus value
 *
 * @param {String} bonus
 * @param {Boolean} value
 *
 * @return {Boolean}
 */
BaseRoomConfig.prototype.setBonus = function(bonus, value)
{
    if (!this.bonusExists(bonus)) { return; }

    this.bonuses[bonus] = value ? true : false;
};

/**
 * Get max score
 *
 * @return {Number}
 */
BaseRoomConfig.prototype.getMaxScore = function()
{
    return this.maxScore ? this.maxScore : this.getDefaultMaxScore();
};

/**
 * Get max score
 *
 * @param {Number} players
 *
 * @return {Number}
 */
BaseRoomConfig.prototype.getDefaultMaxScore = function()
{
    return Math.max(1, (this.room.players.count() - 1) * 10);
};

/**
 * Authorise joinning the room
 *
 * @param {String} password
 *
 * @return {Boolean}
 */
BaseRoomConfig.prototype.allow = function(password)
{
    return this.open || this.password === password;
};

/**
 * Generate password
 *
 * @return {String}
 */
BaseRoomConfig.prototype.generatePassword = function()
{
    var password = '';

    for (var i = 0; i < this.passwordLength; i++) {
        password += Math.ceil(Math.random() * 9).toString();
    }

    return password;
};

/**
 * Serialize
 *
 * @return {Object}
 */
BaseRoomConfig.prototype.serialize = function()
{
    return {
        maxScore: this.maxScore,
        variables: this.variables,
        bonuses: this.bonuses,
        open: this.open,
        password: this.password
    };
};
/**
 * BaseTrail
 */
function BaseTrail(avatar)
{
    EventEmitter.call(this);

    this.avatar = avatar;
    this.color  = this.avatar.color;
    this.radius = this.avatar.radius;
    this.points = [];
    this.lastX  = null;
    this.lastY  = null;
}

BaseTrail.prototype = Object.create(EventEmitter.prototype);
BaseTrail.prototype.constructor = BaseTrail;

/**
 * Add point
 *
 * @param {Number} x
 * @param {Number} y
 */
BaseTrail.prototype.addPoint = function(x, y)
{
    this.points.push([x, y]);
    this.lastX = x;
    this.lastY = y;
};

/**
 * Clear
 */
BaseTrail.prototype.clear = function()
{
    this.points.length = 0;
    this.lastX = null;
    this.lastY = null;
};
/**
 * Preset
 */
function Preset () {}

/**
 * Bonuses
 *
 * @type {Array}
 */
Preset.prototype.bonuses = [];

/**
 * Has onus
 *
 * @param {String} bonus
 *
 * @return {Boolean}
 */
Preset.prototype.hasBonus = function(bonus)
{
    return this.bonuses.indexOf(bonus) > -1;
};
/**
 * BaseChat system
 */
function BaseChat()
{
    EventEmitter.call(this);

    this.messages = new Collection([], 'id', true);
}

BaseChat.prototype = Object.create(EventEmitter.prototype);
BaseChat.prototype.constructor = BaseChat;

/**
 * Add message
 *
 * @param {Message} message
 */
BaseChat.prototype.addMessage = function(message)
{
    if (!this.isValid(message)) {
        return false;
    }

    this.messages.add(message);
    this.emit('message', message);

    return true;
};

/**
 * Is message valid?
 *
 * @param {Message} message
 *
 * @return {Boolean}
 */
BaseChat.prototype.isValid = function(message)
{
    return true;
};

/**
 * Clear messages
 */
BaseChat.prototype.clearMessages = function()
{
    this.messages.clear();
};

/**
 * Serialize
 *
 * @return {Array}
 */
BaseChat.prototype.serialize = function(max)
{
    var length   = this.messages.items.length,
        limit    = typeof(max) === 'number' ? Math.min(max, length) : length,
        min      = length - limit,
        messages = new Array(length);

    for (var i = length - 1; i >= min; i--) {
        messages[i] = this.messages.items[i].serialize();
    }

    return messages;
};
/**
 * FPS Logger
 */
function BaseFPSLogger()
{
    EventEmitter.call(this);

    this.interval  = null;
    this.frames    = 0;
    this.frequency = 0;

    this.onFrame = this.onFrame.bind(this);
    this.log     = this.log.bind(this);

    this.start();
}

BaseFPSLogger.prototype = Object.create(EventEmitter.prototype);
BaseFPSLogger.prototype.constructor = BaseFPSLogger;

/**
 * End frame
 */
BaseFPSLogger.prototype.onFrame = function ()
{
    this.frames++;
};

/**
 * Log
 */
BaseFPSLogger.prototype.log = function()
{
    this.frequency = this.frames;
    this.frames    = 0;
};

/**
 * Start
 */
BaseFPSLogger.prototype.start = function()
{
    if (!this.interval) {
        this.frames   = 0;
        this.interval = setInterval(this.log, 1000);
    }
};

/**
 * Stop
 */
BaseFPSLogger.prototype.stop = function()
{
    if (this.interval) {
        clearInterval(this.interval);
        this.interval  = null;
        this.frequency = 0;
    }
};
/**
 * Tickrate Logger
 */
function BaseTickrateLogger()
{
    this.interval  = null;
    this.frequency = 0;
    this.ticks     = [];

    this.log  = this.log.bind(this);
    this.tick = this.tick.bind(this);

    this.start();
}

/**
 * Tick
 */
BaseTickrateLogger.prototype.tick = function (data)
{
    this.ticks.push(data);
};

/**
 * Log
 */
BaseTickrateLogger.prototype.log = function()
{
    this.frequency    = this.ticks.length;
    this.ticks.length = 0;
};

/**
 * Start
 */
BaseTickrateLogger.prototype.start = function()
{
    if (!this.interval) {
        this.interval = setInterval(this.log, 1000);
    }
};

/**
 * Stop
 */
BaseTickrateLogger.prototype.stop = function()
{
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
};
/**
 * Data compressor / decompressor for transport
 */
function Compressor() {}

/**
 * Float precision
 *
 * @type {Number}
 */
Compressor.prototype.precision = 100;

/**
 * Compress a float into an integer
 *
 * @param {Float} value
 *
 * @return {Integer}
 */
Compressor.prototype.compress = function(value)
{
    return (0.5 + value * this.precision) | 0;
};

/**
 * Decompress an integer into an float
 *
 * @param {Integer} value
 *
 * @return {Float}
 */
Compressor.prototype.decompress = function(value)
{
    return value / this.precision;
};
/**
 * Abstract Controller
 *
 * @param {Object} $scope
 */
function AbstractController($scope)
{
    EventEmitter.call(this);

    this.$scope        = $scope;
    this.digestTimeout = null;

    this.applyScope         = this.applyScope.bind(this);
    this.digestScope        = this.digestScope.bind(this);
    this.requestDigestScope = this.requestDigestScope.bind(this);
}

AbstractController.prototype = Object.create(EventEmitter.prototype);
AbstractController.prototype.constructor = AbstractController;

/**
 * Digest timeout
 *
 * @type {Number}
 */
AbstractController.prototype.digestTimeoutValue = 1000/25;

/**
 * Apply scope
 */
AbstractController.prototype.applyScope = function()
{
    var phase = this.$scope && this.$scope.$root ? this.$scope.$root.$$phase : null;

    if (phase !== '$apply' && phase !== '$digest') {
        this.$scope.$apply();
    }
};

/**
 * Digest scope
 */
AbstractController.prototype.digestScope = function()
{
    this.clearDigestTiemout();

    var phase = this.$scope && this.$scope.$root ? this.$scope.$root.$$phase : null;

    if (phase !== '$apply' && phase !== '$digest') {
        this.$scope.$digest();
    }
};

/**
 * Request a digest scope
 */
AbstractController.prototype.requestDigestScope = function() {
    if (!this.digestTimeout) {
        this.digestTimeout = setTimeout(this.digestScope, this.digestTimeoutValue);
    }
};

/**
 * Clear digest timeout
 *
 * @return {boolean}
 */
AbstractController.prototype.clearDigestTiemout = function() {
    if (this.digestTimeout) {
        this.digestTimeout = clearTimeout(this.digestTimeout);
    }
};
/**
 * Bonus Manager
 *
 * @param {Game} game
 */
function BonusManager(game)
{
    BaseBonusManager.call(this, game);

    this.bonuses.index = false;

    this.onLoad = this.onLoad.bind(this);

    this.loaded = false;
    this.sprite = new SpriteAsset('images/bonus.png', 3, 4, this.onLoad, true);
}

BonusManager.prototype = Object.create(BaseBonusManager.prototype);
BonusManager.prototype.constructor = BonusManager;

/**
 * Assets
 *
 * @type {Object}
 */
BonusManager.prototype.assets = {};

/**
 * Bonuses position on the sprite
 *
 * @type {Array}
 */
BonusManager.prototype.spritePosition = [
    'BonusSelfFast',
    'BonusEnemyFast',
    'BonusSelfSlow',
    'BonusEnemySlow',
    'BonusGameBorderless',
    'BonusSelfMaster',
    'BonusEnemyBig',
    'BonusAllColor',
    'BonusEnemyInverse',
    'BonusSelfSmall',
    'BonusGameClear',
    'BonusEnemyStraightAngle'
];

/**
 * Load DOM
 */
BonusManager.prototype.loadDOM = function()
{
    this.canvas = new Canvas(0, 0, document.getElementById('bonus'));
};

/**
 * On bonus sprite loaded
 */
BonusManager.prototype.onLoad = function()
{
    var images = this.sprite.getImages();

    for (var i = this.spritePosition.length - 1; i >= 0; i--) {
        this.assets[this.spritePosition[i]] = images[i];
    }

    this.loaded = true;
    this.emit('load');
};

/**
 * Remove bonus
 *
 * @param {Bonus} bonus
 */
BonusManager.prototype.remove = function(bonus)
{
    this.clearBonus(bonus);
    BaseBonusManager.prototype.remove.call(this, bonus);
};

/**
 * Clear
 */
BonusManager.prototype.clear = function()
{
    this.canvas.clear();
    BaseBonusManager.prototype.clear.call(this);
};

/**
 * Draw
 *
 * @param {Canvas} canvas
 */
BonusManager.prototype.draw = function()
{
    for (var bonus, i = this.bonuses.items.length - 1; i >= 0; i--) {
        bonus = this.bonuses.items[i];
        if (!bonus.animation.done && bonus.drawWidth) {
            this.clearBonus(bonus);
        }
    }

    for (bonus, i = this.bonuses.items.length - 1; i >= 0; i--) {
        bonus = this.bonuses.items[i];
        if (!bonus.animation.done) {
            bonus.update();
            this.drawBonus(bonus);
        }
    }
};

/**
 * Draw bonus
 *
 * @param {Bonus} bonus
 */
BonusManager.prototype.drawBonus = function(bonus)
{
    this.canvas.drawImageScaled(bonus.asset, bonus.drawX, bonus.drawY, bonus.drawWidth, bonus.drawWidth);
};

/**
 * Clear bonus from the canvas
 *
 * @param {Bonus} bonus
 */
BonusManager.prototype.clearBonus = function(bonus)
{
    this.canvas.clearZoneScaled(bonus.drawX, bonus.drawY, bonus.drawWidth, bonus.drawWidth);
};

/**
 * Set dimension
 *
 * @param {Number} width
 * @param {Float} scale
 */
BonusManager.prototype.setDimension = function(width, scale)
{
    this.canvas.setDimension(width, width, scale);
    this.draw();
};
/**
 * Bounce in animation
 *
 * @param {Number} duration
 */
function BounceIn(duration)
{
    this.duration = duration;
    this.created  = null;
    this.done     = false;

    this.end = this.end.bind(this);

    this.start();
}

/**
 * Target value
 *
 * @type {Number}
 */
BounceIn.prototype.target = 1;

/**
 * Easing constant
 *
 * @type {Number}
 */
BounceIn.prototype.factor = 1.77635683940025e-15;

/**
 * Start animation
 *
 * @return {String}
 */
BounceIn.prototype.start = function()
{
    this.created = new Date().getTime();
    this.timeout = setTimeout(this.end, this.duration);
};

/**
 * Get size
 *
 * @return {Float}
 */
BounceIn.prototype.getValue = function()
{
    return this.easeOutBack(this.getAge(), 0, this.target, this.duration, this.factor);
};

/**
 * Get age in millisecond
 *
 * @return {Number}
 */
BounceIn.prototype.getAge = function()
{
    return new Date().getTime() - this.created;
};

/**
 * End
 */
BounceIn.prototype.end = function()
{
    this.timeout = clearTimeout(this.timeout);
    this.done    = true;
};

/**
 * Ease out back
 *
 * @param {Number} time
 * @param {Number} begin
 * @param {Number} target
 * @param {Number} duration
 * @param {Float} factor
 *
 * @return {Float}
 */
BounceIn.prototype.easeOutBack = function(time, begin, target, duration, factor)
{
    var ts = (time/=duration)*time,
        tc = ts*time;
    return begin+target*(factor*tc*ts + 4*tc + -9*ts + 6*time);
};
/**
 * Explosion animation
 *
 * @param {Avatar} avatar
 * @param {Canvas} effect
 */
function Explode(avatar, effect)
{
    this.effect    = effect;
    this.particles = new Array(this.particleTotal);
    this.canvas    = new Canvas(this.width, this.width);
    this.created   = new Date().getTime();
    this.done      = false;
    this.cleared   = false;

    var width = this.width/2;

    this.canvas.drawCircle(width, width, width, avatar.color);

    for (var i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i] = new ExplodeParticle(
            avatar.x * this.effect.scale,
            avatar.y * this.effect.scale,
            this.randomize(avatar.velocity / 750 * this.effect.scale, 0.1),
            avatar.angle + this.angleVariation * (Math.random() * 2 - 1),
            this.effect.round(this.randomize(avatar.radius, 0.5) * this.effect.scale)
        );
    }
}

/**
 * Canvas width
 *
 * @type {Number}
 */
Explode.prototype.width = 10;

/**
 * Angle variation
 *
 * @type {Float}
 */
Explode.prototype.angleVariation = Math.PI / 8;

/**
 * Number of particles to generate
 *
 * @type {Number}
 */
Explode.prototype.particleTotal = 20;

/**
 * Animation duration
 *
 * @type {Number}
 */
Explode.prototype.duration = 500;

/**
 * Randomize value
 *
 * @param {Float} value
 * @param {Float} factor
 *
 * @return {Float}
 */
Explode.prototype.randomize = function(value, factor)
{
    return value + value * factor * (Math.random() * 2 - 1);
};

/**
 * Draw particles
 */
Explode.prototype.draw = function ()
{
    if (this.done) { return; }

    this.clear();

    this.lastRender = new Date().getTime();
    this.cleared    = false;

    var age = this.lastRender - this.created;

    if (age <= this.duration) {
        var step = age / this.duration;

        this.effect.setOpacity(ExplodeParticle.prototype.opacity * (1.2-step));

        for (var particle, i = this.particles.length - 1; i >= 0; i--) {
            particle = this.particles[i];
            particle.update(age);
            this.effect.drawImage(this.canvas.element, particle.x, particle.y, particle.radius, particle.radius);
        }

        this.effect.setOpacity(1);
    } else {
        this.clear();
        this.done = true;
    }
};

/**
 * Clear particles from cache
 */
Explode.prototype.clear = function ()
{
    if (this.cleared) { return; }

    for (var particle, width, i = this.particles.length - 1; i >= 0; i--) {
        particle = this.particles[i];
        this.effect.clearZone(particle.x, particle.y, particle.radius, particle.radius);
    }

    this.cleared = true;
};
/**
 * Explode particle
 */
function ExplodeParticle (x, y, velocity, angle, radius)
{
    this.x         = this.round(x);
    this.y         = this.round(y);
    this.originX   = x;
    this.originY   = y;
    this.velocityX = Math.cos(angle) * velocity;
    this.velocityY = Math.sin(angle) * velocity;
    this.radius    = radius;
}

/**
 * Opacity
 *
 * @type {Number}
 */
ExplodeParticle.prototype.opacity = 1;

/**
 * Update
 *
 * @param {Number} step
 */
ExplodeParticle.prototype.update = function (time)
{
    this.x = this.round(this.originX + this.velocityX * time);
    this.y = this.round(this.originY + this.velocityY * time);
};

/**
 * Round
 *
 * @param {Number} value
 *
 * @return {Number}
 */
ExplodeParticle.prototype.round = function (value)
{
    return (0.5 + value) | 0;
};
/**
 * Abstract Controller
 *
 * @param {Object} $scope
 */
function AbstractController($scope)
{
    EventEmitter.call(this);

    this.$scope        = $scope;
    this.digestTimeout = null;

    this.applyScope         = this.applyScope.bind(this);
    this.digestScope        = this.digestScope.bind(this);
    this.requestDigestScope = this.requestDigestScope.bind(this);
}

AbstractController.prototype = Object.create(EventEmitter.prototype);
AbstractController.prototype.constructor = AbstractController;

/**
 * Digest timeout
 *
 * @type {Number}
 */
AbstractController.prototype.digestTimeoutValue = 1000/25;

/**
 * Apply scope
 */
AbstractController.prototype.applyScope = function()
{
    var phase = this.$scope && this.$scope.$root ? this.$scope.$root.$$phase : null;

    if (phase !== '$apply' && phase !== '$digest') {
        this.$scope.$apply();
    }
};

/**
 * Digest scope
 */
AbstractController.prototype.digestScope = function()
{
    this.clearDigestTiemout();

    var phase = this.$scope && this.$scope.$root ? this.$scope.$root.$$phase : null;

    if (phase !== '$apply' && phase !== '$digest') {
        this.$scope.$digest();
    }
};

/**
 * Request a digest scope
 */
AbstractController.prototype.requestDigestScope = function() {
    if (!this.digestTimeout) {
        this.digestTimeout = setTimeout(this.digestScope, this.digestTimeoutValue);
    }
};

/**
 * Clear digest timeout
 *
 * @return {boolean}
 */
AbstractController.prototype.clearDigestTiemout = function() {
    if (this.digestTimeout) {
        this.digestTimeout = clearTimeout(this.digestTimeout);
    }
};
/**
 * Chat Controller
 *
 * @param {Object} $scope
 * @param {Chat} chat
 */
function ChatController($scope, chat)
{
    AbstractController.call(this, $scope);

    this.chat   = chat;

    this.onLoaded = this.onLoaded.bind(this);
    this.mute     = this.mute.bind(this);

    this.$scope.onLoaded       = this.onLoaded;
    this.$scope.mute           = this.mute;
    this.$scope.messages       = this.chat.messages.items;
    this.$scope.currentMessage = this.chat.message;
    this.$scope.submitTalk     = this.chat.talk;

    this.chat.on('message', this.digestScope);
    this.chat.on('filtered', this.digestScope);
}

ChatController.prototype = Object.create(AbstractController.prototype);
ChatController.prototype.constructor = ChatController;

/**
 * On chat DOM element loaded
 */
ChatController.prototype.onLoaded = function ()
{
    this.chat.setElement(document.getElementById('chat-feed'));
};

/**
 * Mute client from the given message
 *
 * @param {MessagePlayer} message
 */
ChatController.prototype.mute = function (message)
{
    if (this.chat.toggleMute(message.client)) {
        this.chat.addMessage(new MessageMute(message.client, message.player));
    } else {
        this.chat.removeMessage(message);
    }

    this.digestScope();
};
/**
 * Curvytron Controller
 *
 * @param {Object} $scope
 * @param {Object} $window
 * @param {Object} $location
 * @param {Profile} profile
 * @param {Analyser} analyser
 * @param {ActivityWatcher} watcher
 */
function CurvytronController($scope, $window, $location, profile, analyser, watcher, client)
{
    AbstractController.call(this, $scope);

    this.$window       = $window;
    this.$location     = $location;
    this.analyser      = analyser;
    this.watcher       = watcher;
    this.client        = client;

    // Bind
    this.onConnect     = this.onConnect.bind(this);
    this.onDisconnect  = this.onDisconnect.bind(this);
    this.reload        = this.reload.bind(this);

    // Hydrate scope
    this.$scope.status  = 'connecting';
    this.$scope.reload  = this.reload;
    this.$scope.profile = false;

    this.client.on('connected', this.onConnect);
    this.client.on('disconnected', this.onDisconnect);
}

CurvytronController.prototype = Object.create(AbstractController.prototype);
CurvytronController.prototype.constructor = CurvytronController;

/**
 * On connect
 *
 * @param {Event} e
 */
CurvytronController.prototype.onConnect = function(e)
{
    this.$scope.status  = 'online';
    this.$scope.profile = true;
    this.digestScope();
};

/**
 * On disconnect
 *
 * @param {Event} e
 */
CurvytronController.prototype.onDisconnect = function(e)
{
    document.body.classList.remove('game-mode');
    this.$scope.status = 'disconnected';
    this.digestScope();
};

/**
 * Reload
 */
CurvytronController.prototype.reload = function()
{
    this.$window.location.href = '/';
};
/**
 * Game Controller
 *
 * @param {Object} $scope
 * @param {Object} $routeParams
 * @param {SocketClient} client
 * @param {GameRepository} repository
 * @param {Chat} chat
 * @param {Radio} radio
 */
function GameController($scope, $routeParams, $location, client, repository, chat, radio, sound)
{
    AbstractController.call(this, $scope);

    document.body.classList.add('game-mode');

    this.$location       = $location;
    this.client          = client;
    this.repository      = repository;
    this.radio           = radio;
    this.chat            = chat;
    this.sound           = sound;
    this.room            = null;
    this.game            = null;
    this.assetsLoaded    = false;
    this.setup           = false;
    this.spectateMessage = null;

    // Binding
    this.checkReady   = this.checkReady.bind(this);
    this.onMove       = this.onMove.bind(this);
    this.onSpectate   = this.onSpectate.bind(this);
    this.onUnload     = this.onUnload.bind(this);
    this.onExit       = this.onExit.bind(this);
    this.onFirstRound = this.onFirstRound.bind(this);
    this.backToRoom   = this.backToRoom.bind(this);

    // Hydrate scope:
    this.$scope.radio           = this.radio;
    this.$scope.sound           = this.sound;
    this.$scope.backToRoom      = this.backToRoom;
    this.$scope.toggleSound     = this.sound.toggle;
    this.$scope.toggleRadio     = this.radio.toggle;
    this.$scope.avatars         = null;
    this.$scope.spectating      = false;
    this.$scope.$parent.profile = false;

    var name = decodeURIComponent($routeParams.name);

    this.repository.start();

    if (!this.repository.game || this.repository.game.name !== name) {
        this.$location.path('/room/' + encodeURIComponent(name));
    } else {
        this.loadGame(this.repository.game);
    }
}

GameController.prototype = Object.create(AbstractController.prototype);
GameController.prototype.constructor = GameController;

/**
 * Confirmation message
 *
 * @type {String}
 */
GameController.prototype.confirmation = 'Are you sure you want to leave the game?';

/**
 * Attach socket Events
 */
GameController.prototype.attachEvents = function()
{
    // Close on end?
    this.repository.on('spectate', this.onSpectate);
};

/**
 * Attach socket Events
 */
GameController.prototype.detachEvents = function()
{
    this.repository.off('spectate', this.onSpectate);
};

/**
 * Load game
 */
GameController.prototype.loadGame = function(game)
{
    this.offUnload        = this.$scope.$on('$locationChangeStart', this.onUnload);
    this.offDestroy       = this.$scope.$on('$destroy', this.onExit);
    window.onbeforeunload = this.onUnload;

    this.game = game;
    this.room = game.room;

    this.game.loadDOM();
    this.game.bonusManager.on('load', this.checkReady);

    gamepadListener.stop();

    for (var avatar, i = this.game.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.game.avatars.items[i];
        if (avatar.local) {
            avatar.input.on('move', this.onMove);
            if (avatar.input.useGamepad()) {
                gamepadListener.start();
            }
        }
    }

    this.radio.setActive(true);

    // Hydrate scope:
    this.$scope.game    = this.game;
    this.$scope.avatars = this.game.avatars.items;

    this.attachEvents();

    this.repository.on('round:new', this.onFirstRound);

    this.setup = true;
    this.checkReady();
};

/**
 * Check loading is done
 */
GameController.prototype.checkReady = function()
{
    if (this.game.bonusManager.loaded && this.setup) {
        this.game.bonusManager.off('load', this.checkReady);
        this.client.addEvent('ready');
    }
};

/**
 * Clear waiting list on first round
 *
 * @param {Event} e
 */
GameController.prototype.onFirstRound = function(e)
{
    setTimeout(function () { this.repository.off('round:new', this.onFirstRound); }.bind(this), 0);
    this.digestScope();
};

/**
 * On move
 *
 * @param {Event} e
 */
GameController.prototype.onMove = function(e)
{
    this.client.addEvent('player:move', {avatar: e.detail.avatar.id, move: e.detail.move ? e.detail.move : 0});
};

/**
 * On spectate
 */
GameController.prototype.onSpectate = function(e)
{
    document.getElementById('col-right').appendChild(this.getSpectateMessage());
    this.digestScope();
};

/**
 * Leave room
 */
GameController.prototype.onExit = function()
{
    if ((this.room && this.$location.path() !== this.room.getUrl()) || (this.game && this.game.started)) {
        this.repository.parent.leave();
        this.chat.clear();
    }

    window.onbeforeunload = null;

    this.sound.stop('win');
    this.offUnload();
    this.offDestroy();
    this.close();
};

/**
 * On unload
 *
 * @param {Event} e
 *
 * @return {String}
 */
GameController.prototype.onUnload = function(e)
{
    if (this.needConfirmation()) {
        if (e.type === 'beforeunload') {
            return this.confirmation;
        } else if (!confirm(this.confirmation)) {
            return e.preventDefault();
        }
    }
};

/**
 * Do we need confirmation before leaving?
 *
 * @return {Boolean}
 */
GameController.prototype.needConfirmation = function()
{
    return !this.$scope.spectating && this.game.started;
};

/**
 * Get spectate message
 *
 * @return {Element}
 */
GameController.prototype.getSpectateMessage = function()
{
    if (!this.spectateMessage) {
        this.spectateMessage           = document.createElement('div');
        this.spectateMessage.className = 'spectating';
        this.spectateMessage.innerHTML = '<h2><i class="icon-viewer"></i> You are in spectator mode</h2>';
        this.spectateMessage.innerHTML += '<p>You must wait for the game to finish before you can play.</p>';
    }

    return this.spectateMessage;
};

/**
 * Close game
 */
GameController.prototype.close = function()
{
    if (this.game) {
        this.detachEvents();

        var avatars = this.game.avatars.filter(function () { return this.input; }).items;

        for (var i = avatars.length - 1; i >= 0; i--) {
            avatars[i].input.off('move', this.onMove);
        }

        delete this.game;
    }
};

/**
 * Go back to the room
 */
GameController.prototype.backToRoom = function()
{
    this.$location.path(this.room.getUrl());

    if (!this.room.config.open) {
        this.$location.search('password', this.room.config.password);
    }
};

/**
 * Curvytron Controller
 *
 * @param {Object} $scope
 * @param {Object} $element
 * @param {Profile} profile
 * @param {Analyser} analyser
 * @param {ActivityWatcher} watcher
 */
function ProfileController($scope, profile, radio, sound)
{
    AbstractController.call(this, $scope);

    this.profile  = profile;
    this.radio    = radio;
    this.sound    = sound;
    this.open     = false;
    this.loaded   = false;
    this.tuto     = null;
    this.panel    = null;
    this.controls = null;

    this.profile.controller = this;

    this.toggleProfile = this.toggleProfile.bind(this);
    this.openProfile   = this.openProfile.bind(this);
    this.closeProfile  = this.closeProfile.bind(this);
    this.onLoaded      = this.onLoaded.bind(this);
    this.onLoadControl = this.onLoadControl.bind(this);
    this.blurControls  = this.blurControls.bind(this);

    this.$scope.profile       = this.profile;
    this.$scope.radio         = this.radio;
    this.$scope.sound         = this.sound;
    this.$scope.toggleSound   = this.sound.toggle;
    this.$scope.toggleRadio   = this.radio.toggle;
    this.$scope.toggleProfile = this.toggleProfile;
    this.$scope.openProfile   = this.openProfile;
    this.$scope.closeProfile  = this.closeProfile;
    this.$scope.onLoaded      = this.onLoaded;
    this.$scope.onLoadControl = this.onLoadControl;
    this.$scope.blurControls  = this.blurControls;

    this.profile.on('change', this.digestScope);
}

ProfileController.prototype = Object.create(AbstractController.prototype);
ProfileController.prototype.constructor = ProfileController;

/**
 * On dom loaded
 */
ProfileController.prototype.onLoaded = function()
{
    this.panel  = document.querySelector('.panel');
    this.tuto   = this.panel.querySelector('.profile-tuto');
    this.loaded = true;
    this.emit('loaded');
};

/**
 * On dom loaded controls
 */
ProfileController.prototype.onLoadControl = function()
{
    this.controls = this.panel.querySelectorAll('input.control');
};

/**
 * Open profile
 */
ProfileController.prototype.openProfile = function()
{
    if (!this.open) {
        this.open = true;
        this.panel.classList.add('active');
        this.tuto.classList.toggle('active', !this.profile.isComplete());
        this.profile.emit('open');
    }
};

/**
 * Close profile
 */
ProfileController.prototype.closeProfile = function()
{
    if (this.open && this.profile.isComplete()) {
        this.open = false;
        this.panel.classList.remove('active');
        this.tuto.classList.toggle('active', !this.profile.isComplete());
        this.profile.emit('close');
    }
};

/**
 * Toggle profile
 */
ProfileController.prototype.toggleProfile = function()
{
    return this.open ? this.closeProfile() : this.openProfile();
};

/**
 * Blur controls
 */
ProfileController.prototype.blurControls = function()
{
    this.controls[0].blur();
    this.controls[1].blur();
};
/**
 * Room Controller
 *
 * @param {Object} $scope
 * @param {Object} $routeParams
 * @param {Object} $location
 * @param {SocketClient} SocketClient
 * @param {RoomRepository} repository
 * @param {Profile} profile
 * @param {Chat} chat
 * @param {Notifier} notifier
 */
function RoomController($scope, $routeParams, $location, client, repository, profile, chat, notifier)
{
    AbstractController.call(this, $scope);

    document.body.classList.remove('game-mode');

    var search = $location.search();

    this.$location      = $location;
    this.$routeParams   = $routeParams;
    this.client         = client;
    this.profile        = profile;
    this.chat           = chat;
    this.notifier       = notifier;
    this.hasTouch       = typeof(window.ontouchstart) !== 'undefined';
    this.name           = decodeURIComponent($routeParams.name);
    this.password       = typeof(search.password) !== 'undefined' ? search.password : null;
    this.repository     = repository;
    this.controlSynchro = false;
    this.useTouch       = false;
    this.launchInterval = null;

    // Binding:
    this.addPlayer        = this.addPlayer.bind(this);
    this.addProfileUser   = this.addProfileUser.bind(this);
    this.removePlayer     = this.removePlayer.bind(this);
    this.kickPlayer       = this.kickPlayer.bind(this);
    this.onJoin           = this.onJoin.bind(this);
    this.onJoined         = this.onJoined.bind(this);
    this.onControlChange  = this.onControlChange.bind(this);
    this.joinRoom         = this.joinRoom.bind(this);
    this.leaveRoom        = this.leaveRoom.bind(this);
    this.setColor         = this.setColor.bind(this);
    this.setReady         = this.setReady.bind(this);
    this.setName          = this.setName.bind(this);
    this.setTouch         = this.setTouch.bind(this);
    this.updateProfile    = this.updateProfile.bind(this);
    this.toggleParameters = this.toggleParameters.bind(this);
    this.onRoomMaster     = this.onRoomMaster.bind(this);
    this.onConfigOpen     = this.onConfigOpen.bind(this);
    this.onLaunchStart    = this.onLaunchStart.bind(this);
    this.onLaunchTimer    = this.onLaunchTimer.bind(this);
    this.onLaunchCancel   = this.onLaunchCancel.bind(this);
    this.launch           = this.launch.bind(this);
    this.start            = this.start.bind(this);

    this.$scope.$on('$destroy', this.leaveRoom);

    // Hydrating scope:
    this.$scope.launch            = this.launch;
    this.$scope.submitAddPlayer   = this.addPlayer;
    this.$scope.removePlayer      = this.removePlayer;
    this.$scope.kickPlayer        = this.kickPlayer;
    this.$scope.setColor          = this.setColor;
    this.$scope.setReady          = this.setReady;
    this.$scope.setName           = this.setName;
    this.$scope.setTouch          = this.setTouch;
    this.$scope.toggleParameters  = this.toggleParameters;
    this.$scope.nameMaxLength     = Player.prototype.maxLength;
    this.$scope.colorMaxLength    = Player.prototype.colorMaxLength;
    this.$scope.hasTouch          = this.hasTouch;
    this.$scope.master            = this.repository.amIMaster();
    this.$scope.displayParameters = false;
    this.$scope.$parent.profile   = true;
    this.$scope.launching         = false;

    this.repository.start();
    gamepadListener.start();

    if (!this.profile.isComplete()) {
        this.profile.on('close', this.joinRoom);
        if (this.profile.controller.loaded) {
            this.profile.controller.openProfile();
        } else {
            this.profile.controller.on('loaded', this.profile.controller.openProfile);
        }
    } else {
        this.joinRoom();
    }
}

RoomController.prototype = Object.create(AbstractController.prototype);
RoomController.prototype.constructor = RoomController;

/**
 * Join room and load scope
 */
RoomController.prototype.joinRoom = function()
{
    if (!this.client.connected) {
        return this.client.on('connected', this.joinRoom);
    }

    this.profile.off('close', this.joinRoom);
    this.repository.join(this.name, this.password, this.onJoined);
};

/**
 * On room joined
 *
 * @param {Object} result
 */
RoomController.prototype.onJoined = function(result)
{
    if (result.success) {
        this.room        = result.room;
        this.$scope.room = this.room;

        this.attachEvents();
        this.addProfileUser();
        this.requestDigestScope();
    } else {
        console.error('Could not join room %s: %s', result.name, result.error);
        this.goHome();
        this.applyScope();
    }
};

/**
 * Leave room
 */
RoomController.prototype.leaveRoom = function()
{
    var path = this.$location.path();

    if (this.room) {
        if (path !== this.room.getGameUrl()) {
            this.repository.leave();
        }

        this.detachEvents();
    }
};

/**
 * Attach events
 */
RoomController.prototype.attachEvents = function()
{
    this.repository.on('room:close', this.goHome);
    this.repository.on('player:join', this.onJoin);
    this.repository.on('player:leave', this.requestDigestScope);
    this.repository.on('player:ready', this.requestDigestScope);
    this.repository.on('player:color', this.requestDigestScope);
    this.repository.on('player:name', this.requestDigestScope);
    this.repository.on('client:activity', this.requestDigestScope);
    this.repository.on('room:master', this.onRoomMaster);
    this.repository.on('room:game:start', this.start);
    this.repository.on('room:config:open', this.onConfigOpen);
    this.repository.on('room:launch:start', this.onLaunchStart);
    this.repository.on('room:launch:cancel', this.onLaunchCancel);

    for (var i = this.room.players.items.length - 1; i >= 0; i--) {
        this.room.players.items[i].on('control:change', this.onControlChange);
    }
};

/**
 * Detach events
 */
RoomController.prototype.detachEvents = function()
{
    this.repository.off('room:close', this.goHome);
    this.repository.off('player:join', this.onJoin);
    this.repository.off('player:leave', this.requestDigestScope);
    this.repository.off('player:ready', this.requestDigestScope);
    this.repository.off('player:color', this.requestDigestScope);
    this.repository.off('player:name', this.requestDigestScope);
    this.repository.off('client:activity', this.requestDigestScope);
    this.repository.off('room:master', this.onRoomMaster);
    this.repository.off('room:game:start', this.start);
    this.repository.off('room:config:open', this.onConfigOpen);
    this.repository.off('room:launch:start', this.onLaunchStart);
    this.repository.off('room:launch:cancel', this.onLaunchCancel);

    if (this.room) {
        for (var i = this.room.players.items.length - 1; i >= 0; i--) {
            this.room.players.items[i].off('control:change', this.onControlChange);
        }
    }
};

/**
 * Go back to the homepage
 */
RoomController.prototype.goHome = function()
{
    this.$location.path('/');
};

/**
 * Launch game
 */
RoomController.prototype.launch = function()
{
    if (this.repository.amIMaster()) {
        this.repository.launch();
    }
};

/**
 * Add player
 */
RoomController.prototype.addPlayer = function(name, color)
{
    var $scope = this.$scope;

    name  = typeof(name) !== 'undefined' ? name : $scope.username;
    color = typeof(color) !== 'undefined' ? color : null;

    if (name) {
        this.repository.addPlayer(
            name,
            color,
            function (result) {
                if (result.success) {
                    $scope.username = null;
                    $scope.$apply();
                } else {
                    var error = typeof(result.error) !== 'undefined' ? result.error : 'Unknown error';
                    console.error('Could not add player %s: %s', name, error);
                }
            }
        );
    }
};

/**
 * Remove player
 */
RoomController.prototype.removePlayer = function(player)
{
    if (!player.local) { return; }

    this.repository.removePlayer(
        player,
        function (result) {
            if (!result.success) {
                console.error('Could not remove player %s', player.name);
            }
        }
    );
};

/**
 * Kick player
 */
RoomController.prototype.kickPlayer = function(player)
{
    var repository  = this;

    this.repository.kickPlayer(player, function (result) {
        if (!result.success) {
            console.error('Could not kick player %s', player.name);
        }
        repository.digestScope();
    });
};

/**
 * Go room config open
 */
RoomController.prototype.onConfigOpen = function(e)
{
    this.$location.search('password', this.room.config.password);
    this.applyScope();
};

/**
 * On join
 *
 * @param {Event} e
 */
RoomController.prototype.onJoin = function(e)
{
    var player = e.detail.player;

    if (player.client.id === this.client.id) {
        player.on('control:change', this.onControlChange);
        player.setLocal(true);

        player.profile = this.profile.name === player.name;

        this.updateCurrentMessage();

        if (player.profile) {
            this.setProfileControls(player);
        }

        if (this.useTouch) {
            player.setTouch();
        }
    } else {
        this.notifier.notify('New player joined!');
    }

    this.requestDigestScope();
};

/**
 * Set player color
 *
 * @return {Array}
 */
RoomController.prototype.setColor = function(player)
{
    if (!player.local) { return; }

    var controller = this;

    this.repository.setColor(
        player,
        player.color,
        function (result) {
            if (player.profile) {
                controller.profile.setColor(player.color);
            }
            controller.digestScope();
        }
    );
};

/**
 * Set player name
 *
 * @return {Array}
 */
RoomController.prototype.setName = function(player)
{
    if (!player.local) { return; }

    var controller = this;

    this.repository.setName(
        player.id,
        player.name,
        function (result) {
            if (!result.success) {
                var error = typeof(result.error) !== 'undefined' ? result.error : 'Unknown error',
                    name = typeof(result.name) !== 'undefined' ? result.name : null;

                console.error('Could not rename player: %s', error);

                if (name) {
                    player.name = name;
                }
            }

            if (player.profile) {
                controller.profile.setName(player.name);
            }

            controller.digestScope();
        }
    );
};

/**
 * Set player ready
 *
 * @return {Array}
 */
RoomController.prototype.setReady = function(player)
{
    if (!player.local) { return; }

    this.repository.setReady(
        player.id,
        function (result) {
            if (!result.success) {
                console.error('Could not set player %s ready', player.name);
            }
        }
    );
};

/**
 * Set touch for local players
 */
RoomController.prototype.setTouch = function()
{
    if (!this.hasTouch) { return; }

    this.useTouch = true;

    var players = this.room.getLocalPlayers();

    for (var i = players.items.length - 1; i >= 0; i--) {
        players.items[i].setTouch();
    }
};

/**
 * Start Game
 *
 * @param {Event} e
 */
RoomController.prototype.start = function(e)
{
    this.$location.path(this.room.getGameUrl());

    if (this.room.config.open) {
        this.$location.search('password', this.room.config.password);
    }

    this.applyScope();
};

/**
 * Add profile user
 */
RoomController.prototype.addProfileUser = function()
{
    if (this.room.isNameAvailable(this.profile.name)) {
        this.profile.on('change', this.updateProfile);
        this.addPlayer(this.profile.name, this.profile.color);
    }
};

/**
 * Update profile
 */
RoomController.prototype.updateProfile = function()
{
    var player = this.room.players.match(function () { return this.profile; });

    if (player) {
        this.setProfileName(player);
        this.setProfileColor(player);
        this.setProfileControls(player);
    }
};

/**
 * Update current message
 */
RoomController.prototype.updateCurrentMessage = function()
{
    var profile = this.room.players.match(function () { return this.profile; }),
        player = this.room.players.match(function () { return this.local; });

    this.chat.setPlayer(profile ? profile : player);
};

/**
 * Triggered when a local player changes its controls
 *
 * @param {Event} e
 */
RoomController.prototype.onControlChange = function(e)
{
    this.saveProfileControls();
    this.digestScope();
};

/**
 * Save controls
 */
RoomController.prototype.saveProfileControls = function()
{
    var player = this.room.players.match(function () { return this.profile; });

    if (player && !this.controlSynchro) {
        this.controlSynchro = true;
        this.profile.setControls(player.getMapping());
        this.controlSynchro = false;
    }
};

/**
 * Set profile controls
 */
RoomController.prototype.setProfileControls = function(player)
{
    if (!this.controlSynchro) {
        this.controlSynchro = true;

        for (var i = this.profile.controls.length - 1; i >= 0; i--) {
            player.controls[i].loadMapping(this.profile.controls[i].getMapping());
        }

        this.controlSynchro = false;
        this.digestScope();
    }
};

/**
 * Set profile name
 */
RoomController.prototype.setProfileName = function(player)
{
    if (this.profile.name !== player.name) {
        player.setName(this.profile.name);
        this.setName(player);
    }
};

/**
 * Set profile color
 */
RoomController.prototype.setProfileColor = function(player)
{
    if (this.profile.color !== player.color) {
        player.setColor(this.profile.color);
        this.setColor(player);
    }
};

/**
 * Toggle parameters
 */
RoomController.prototype.onRoomMaster = function(e)
{
    this.$scope.master = this.repository.amIMaster();
    this.digestScope();
};

/**
 * On launch start
 *
 * @param {Event} e
 */
RoomController.prototype.onLaunchStart = function(e)
{
    this.clearLaunchInterval();
    this.launchInterval   = setInterval(this.onLaunchTimer, 1000);
    this.$scope.launching = this.repository.room.launchTime / 1000;
    this.digestScope();
};

/**
 * On launch cancel
 *
 * @param {Event} e
 */
RoomController.prototype.onLaunchCancel = function(e)
{
    this.clearLaunchInterval();
    this.$scope.launching = false;
    this.digestScope();
};

/**
 * On launch timer
 *
 * @param {Event} e
 */
RoomController.prototype.onLaunchTimer = function(e)
{
    if (this.$scope.launching) {
        this.$scope.launching--;
        this.digestScope();
    }
};

/**
 * Clear launch interval
 */
RoomController.prototype.clearLaunchInterval = function()
{
    if (this.launchInterval) {
        this.launchInterval = clearInterval(this.launchInterval);
    }
};

/**
 * Toggle parameters
 */
RoomController.prototype.toggleParameters = function()
{
    this.$scope.displayParameters = !this.$scope.displayParameters;
};
/**
 * Rooms Controller
 *
 * @param {Object} $scope
 * @param {Object} $location
 * @param {SocketClient} client
 */
function RoomsController($scope, $location, client)
{
    AbstractController.call(this, $scope);

    document.body.classList.remove('game-mode');

    this.$location  = $location;
    this.client     = client;
    this.repository = new RoomsRepository(this.client);

    // Binding:
    this.createRoom   = this.createRoom.bind(this);
    this.onCreateRoom = this.onCreateRoom.bind(this);
    this.joinRoom     = this.joinRoom.bind(this);
    this.quickPlay    = this.quickPlay.bind(this);
    this.detachEvents = this.detachEvents.bind(this);

    this.$scope.$on('$destroy', this.detachEvents);
    this.$location.search('password', null);

    // Hydrating the scope:
    this.$scope.rooms           = this.repository.rooms;
    this.$scope.createRoom      = this.createRoom;
    this.$scope.join            = this.joinRoom;
    this.$scope.quickPlay       = this.quickPlay;
    this.$scope.roomMaxLength   = Room.prototype.maxLength;
    this.$scope.roomName        = '';
    this.$scope.$parent.profile = true;

    this.attachEvents();
}

RoomsController.prototype = Object.create(AbstractController.prototype);
RoomsController.prototype.constructor = RoomsController;

/**
 * Attach Events
 */
RoomsController.prototype.attachEvents = function()
{
    this.repository.on('room:open', this.requestDigestScope);
    this.repository.on('room:close', this.requestDigestScope);
    this.repository.on('room:players', this.requestDigestScope);
    this.repository.on('room:game', this.requestDigestScope);
    this.repository.on('room:config:open', this.requestDigestScope);

    this.repository.start();
};

/**
 * Attach Events
 */
RoomsController.prototype.detachEvents = function()
{
    this.repository.stop();

    this.repository.off('room:open', this.requestDigestScope);
    this.repository.off('room:close', this.requestDigestScope);
    this.repository.off('room:players', this.requestDigestScope);
    this.repository.off('room:game', this.requestDigestScope);
    this.repository.off('room:config:open', this.requestDigestScope);
};

/**
 * Create a room
 */
RoomsController.prototype.createRoom = function(e)
{
    this.repository.create(this.$scope.roomName, this.onCreateRoom);
};

/**
 * On create Room
 *
 * @param {Object} result
 */
RoomsController.prototype.onCreateRoom = function(result)
{
    if (result.success) {
        this.$scope.name = null;
        this.joinRoom(this.repository.createRoom(result.room));
        this.applyScope();
    } else {
        console.error('Could not create room %s', this.$scope.name);
    }
};

/**
 * Join a room
 */
RoomsController.prototype.joinRoom = function(room)
{
    if (room.open) {
        this.$location.path(room.getUrl());
    } else if (room.password && room.password.match(new RegExp('[0-9]{4}'))) {
        this.$location.path(room.getUrl()).search('password', room.password);
    }
};

/**
 * Quick play
 */
RoomsController.prototype.quickPlay = function()
{
    var room = this.repository.rooms.filter(function () { return !this.game; }).getRandomItem();

    if (room) {
        this.joinRoom(room);
    } else {
        this.$scope.roomName = 'Hello Curvytron!';
        this.createRoom();
    }
};
/**
 * Kill Log Controller
 *
 * @param {Object} $scope
 * @param {Object} $interpolate
 * @param {SocketClient} client
 */
function KillLogController($scope, $interpolate, client)
{
    if (!$scope.game) { return; }

    AbstractController.call(this, $scope);

    this.client    = client;
    this.game      = $scope.game;
    this.element   = document.getElementById('kill-log-feed');
    this.templates = {
        suicide: $interpolate('<span style="color: {{ ::deadPlayer.color }}">{{ ::deadPlayer.name }}</span> committed suicide'),
        kill: $interpolate('<span style="color: {{ ::deadPlayer.color }}">{{ ::deadPlayer.name }}</span> was killed by <span style="color: {{ ::killerPlayer.color }}">{{ ::killerPlayer.name }}</span>'),
        crash: $interpolate('<span style="color: {{ ::deadPlayer.color }}">{{ ::deadPlayer.name }}</span> crashed on <span style="color: {{ ::killerPlayer.color }}">{{ ::killerPlayer.name }}</span>'),
        wall: $interpolate('<span style="color: {{ ::deadPlayer.color }}">{{ ::deadPlayer.name }}</span> crashed on the wall')
    };

    this.clear = this.clear.bind(this);
    this.onDie = this.onDie.bind(this);

    this.client.on('die', this.onDie);
    this.client.on('round:new', this.clear);
}

KillLogController.prototype = Object.create(AbstractController.prototype);
KillLogController.prototype.constructor = KillLogController;

/**
 * On die
 *
 * @param {Event} e
 */
KillLogController.prototype.onDie = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        this.display(new MessageDie(avatar, e.detail[1] ? this.game.avatars.getById(e.detail[1]) : null, e.detail[2]));
    }
};

/**
 * Display the given message
 *
 * @param {string} message
 */
KillLogController.prototype.display = function(message) {
    var content = '<span class="message-icon icon-dead"></span>' + this.templates[message.type](message),
        item    = this.element.children[0];

    item.innerHTML = content;
    this.element.appendChild(item);
};

/**
 * Clear
 */
KillLogController.prototype.clear = function()
{
    for (var i = this.element.children.length - 1; i >= 0; i--) {
        this.element.children[i].innerHTML = '';
    }
};
/**
 * Metric controller
 *
 * @param {Object} $scope
 * @param {SocketClient} client
 */
function MetricController($scope, client)
{
    if (!$scope.game) { return; }

    AbstractController.call(this, $scope);

    this.client = client;
    this.game   = this.$scope.game;

    // Binding
    this.onFPS        = this.onFPS.bind(this);
    this.onLatency    = this.onLatency.bind(this);
    this.onSpectators = this.onSpectators.bind(this);
    this.detachEvents = this.detachEvents.bind(this);

    // Hydrate scope:
    this.$scope.fps          = 0;
    this.$scope.fpsColor     = 'gray';
    this.$scope.latency      = 0;
    this.$scope.latencyColor = 'gray';
    this.$scope.spectators   = 0;

    this.$scope.$on('$destroy', this.detachEvents);

    this.attachEvents();
}

MetricController.prototype = Object.create(AbstractController.prototype);
MetricController.prototype.constructor = MetricController;

/**
 * Attach events
 */
MetricController.prototype.attachEvents = function()
{
    this.client.on('latency', this.onLatency);
    this.client.on('game:spectators', this.onSpectators);
    this.game.fps.on('fps', this.onFPS);
};

/**
 * Detach events
 */
MetricController.prototype.detachEvents = function()
{
    this.client.off('latency', this.onLatency);
    this.client.off('game:spectators', this.onSpectators);
    this.game.fps.off('fps', this.onFPS);
};

/**
 * On FPS
 *
 * @param {Event} event
 */
MetricController.prototype.onFPS = function(event)
{
    var value = this.game.fps.frequency;

    if (this.$scope.fps !== value) {
        this.$scope.fps      = value;
        this.$scope.fpsColor = this.getFPSColor(value);
        this.digestScope();
    }
};

/**
 * Get FPS color
 *
 * @param {Number} fps
 *
 * @return {String}
 */
MetricController.prototype.getFPSColor = function(fps)
{
    if (fps >= 55) { return 'green'; }
    if (fps >= 40) { return 'orange'; }
    if (fps >= 1) { return 'red'; }

    return 'gray';
};

/**
 * On latency
 *
 * @param {Event} event
 */
MetricController.prototype.onLatency = function(event)
{
    var value = event.detail;

    if (this.$scope.latency !== value) {
        this.$scope.latency      = value;
        this.$scope.latencyColor = this.getLatencyColor(value);
        this.digestScope();
    }
};

/**
 * Get latency color
 *
 * @param {Number} latency
 *
 * @return {String}
 */
MetricController.prototype.getLatencyColor = function(latency)
{
    if (latency <= 100) { return 'green'; }
    if (latency <= 250) { return 'orange'; }

    return 'red';
};

/**
 * On spectators
 *
 * @param {Event} event
 */
MetricController.prototype.onSpectators = function(event)
{
    this.$scope.spectators = event.detail;
    this.digestScope();
};
/**
 * Player List Controller
 *
 * @param {Object} $scope
 * @param {Object} $element
 * @param {SocketClient} client
 */
function PlayerListController($scope, $element, client)
{
    if (!$scope.game) { return; }

    AbstractController.call(this, $scope);

    this.element = $element[0];
    this.client  = client;
    this.game    = this.$scope.game;

    // Binding
    this.onScore      = this.onScore.bind(this);
    this.onRoundScore = this.onRoundScore.bind(this);
    this.onRoundNew   = this.onRoundNew.bind(this);
    this.onRoundEnd   = this.onRoundEnd.bind(this);
    this.onDie        = this.onDie.bind(this);
    this.detachEvents = this.detachEvents.bind(this);

    this.$scope.$on('$destroy', this.detachEvents);

    this.attachEvents();
}

PlayerListController.prototype = Object.create(AbstractController.prototype);
PlayerListController.prototype.constructor = PlayerListController;

/**
 * Attach socket Events
 */
PlayerListController.prototype.attachEvents = function()
{
    this.client.on('score', this.onScore);
    this.client.on('score:round', this.onRoundScore);
    this.client.on('game:leave', this.requestDigestScope);
    this.client.on('round:new', this.onRoundNew);
    this.client.on('round:end', this.onRoundEnd);
    this.client.on('die', this.onDie);
};

/**
 * Attach socket Events
 */
PlayerListController.prototype.detachEvents = function()
{
    this.client.off('score', this.onScore);
    this.client.off('score:round', this.onRoundScore);
    this.client.off('game:leave', this.requestDigestScope);
    this.client.off('round:new', this.onRoundNew);
    this.client.off('round:end', this.onRoundEnd);
    this.client.off('die', this.onDie);
};

/**
 * Get avatar related elements in DOM
 *
 * @param {Avatar} avatar
 */
PlayerListController.prototype.getElements = function(avatar)
{
    if (!avatar.elements.root) {
        avatar.elements.root       = document.getElementById('avatar-' + avatar.id);
        avatar.elements.score      = document.getElementById('avatar-score-' + avatar.id);
        avatar.elements.roundScore = document.getElementById('avatar-round-score-' + avatar.id);

        if (avatar.local) {
            avatar.elements.root.classList.add('local');
        }
    }

    return avatar.elements;
};

/**
 * On score
 *
 * @param {Event} e
 */
PlayerListController.prototype.onScore = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.setScore(e.detail[1]);
        this.updateScore(avatar);
    }
};

/**
 * On round score
 *
 * @param {Event} e
 */
PlayerListController.prototype.onRoundScore = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.setRoundScore(e.detail[1]);
        this.updateRoundScore(avatar);
    }
};

/**
 * On round new
 *
 * @param {Event} e
 */
PlayerListController.prototype.onRoundNew = function(e)
{
    this.element.classList.add('in-round');

    for (var i = this.game.avatars.items.length - 1; i >= 0; i--) {
        this.getElements(this.game.avatars.items[i]).root.classList.remove('dead');
    }
};

/**
 * On round dnd
 *
 * @param {Event} e
 */
PlayerListController.prototype.onRoundEnd = function(e)
{
    this.element.classList.remove('in-round');
    this.reorder();
};

/**
 * On die
 *
 * @param {Event} e
 */
PlayerListController.prototype.onDie = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        this.getElements(avatar).root.classList.add('dead');
    }
};

/**
 * Update score
 *
 * @param {Avatar} avatar
 */
PlayerListController.prototype.updateScore = function(avatar)
{
    this.getElements(avatar).score.innerHTML = avatar.score;
};


/**
 * Update round score
 *
 * @param {Avatar} avatar
 */
PlayerListController.prototype.updateRoundScore = function(avatar)
{
    this.getElements(avatar).roundScore.innerHTML = avatar.roundScore ? '+' + avatar.roundScore : '';
};

/**
 * Reorder player list
 */
PlayerListController.prototype.reorder = function() {
    var length = this.game.sortAvatars().items.length;

    for (var elements, i = 0; i < length; i++) {
        elements = this.getElements(this.game.avatars.items[i]);
        elements.root.parentNode.appendChild(elements.root);
    }
};
/**
 * Round Controller
 *
 * @param {Object} $scope
 * @param {SocketClient} repository
 * @param {Notifier} notifier
 */
function RoundController($scope, repository, notifier)
{
    if (!$scope.game) { return; }

    AbstractController.call(this, $scope);

    this.repository      = repository;
    this.notifier        = notifier;
    this.game            = this.$scope.game;
    this.warmupElement   = document.getElementById('warmup');
    this.tieBreakElement = document.getElementById('tie-break');
    this.countElement    = document.getElementById('count');
    this.endElement      = document.getElementById('end');
    this.renderElement   = document.getElementById('render');
    this.warmupInterval  = null;

    // Binding
    this.onRoundNew    = this.onRoundNew.bind(this);
    this.onRoundEnd    = this.onRoundEnd.bind(this);
    this.updateBorders = this.updateBorders.bind(this);
    this.onEnd         = this.onEnd.bind(this);
    this.onWarmup      = this.onWarmup.bind(this);
    this.endWarmup     = this.endWarmup.bind(this);
    this.detachEvents  = this.detachEvents.bind(this);

    this.$scope.roundWinner = null;
    this.$scope.gameWinner  = null;

    this.$scope.$on('$destroy', this.detachEvents);

    this.attachEvents();
}

RoundController.prototype = Object.create(AbstractController.prototype);
RoundController.prototype.constructor = RoundController;

/**
 * Attach socket Events
 */
RoundController.prototype.attachEvents = function()
{
    this.repository.on('borderless', this.updateBorders);
    this.repository.on('round:end', this.onRoundEnd);
    this.repository.on('round:new', this.onRoundNew);
    this.repository.on('end', this.onEnd);
};

/**
 * Attach socket Events
 */
RoundController.prototype.detachEvents = function()
{
    this.repository.off('borderless', this.updateBorders);
    this.repository.off('round:end', this.onRoundEnd);
    this.repository.off('round:new', this.onRoundNew);
    this.repository.off('end', this.onEnd);
    this.clearWarmup();
};

/**
 * On round new
 *
 * @param {Event} e
 */
RoundController.prototype.onRoundNew = function(e)
{
    this.updateBorders();
    this.endElement.style.display = 'none';

    if (this.game.isTieBreak()) {
        this.tieBreakElement.style.display = 'block';
    }

    this.displayWarmup(this.game.warmupTime);
};

/**
 * On round end
 *
 * @param {Event} e
 */
RoundController.prototype.onRoundEnd = function(e)
{
    this.notifier.notifyInactive(this.game.roundWinner ? this.game.roundWinner.name + ' won round!' : 'Round end!');

    this.$scope.winner = this.game.roundWinner ? this.game.roundWinner : false;
    this.digestScope();

    this.endElement.style.display = 'block';
};

/**
 * On end
 *
 * @param {Event} e
 */
RoundController.prototype.onEnd = function(e)
{
    this.notifier.notify('Game over!', null, 'win');
    this.$scope.winner = this.game.avatars.getFirst();
    this.digestScope();
    this.endElement.style.display = 'block';
};

/**
 * Update map borders
 */
RoundController.prototype.updateBorders = function()
{
    this.renderElement.classList.toggle('borderless', this.game.borderless);
};

/**
 * Start warmup
 */
RoundController.prototype.displayWarmup = function(time)
{
    this.warmupElement.style.display = 'block';
    this.countElement.innerHTML      = time/1000;
    this.warmupInterval              = setInterval(this.onWarmup, 1000);
    setTimeout(this.endWarmup, time);
    this.notifier.notify('Round start in ' + this.countElement.innerHTML + '...');
};

/**
 * On warmup
 */
RoundController.prototype.onWarmup = function()
{
    this.countElement.innerHTML--;
    this.notifier.notify('Round start in ' + this.countElement.innerHTML + '...');
};

/**
 * End warmup
 */
RoundController.prototype.endWarmup = function()
{
    this.clearWarmup();
    this.warmupElement.style.display = 'none';
    this.notifier.notify('Go!', 1000);
};

/**
 * Clear warmup interval
 */
RoundController.prototype.clearWarmup = function()
{
    if (this.warmupInterval) {
        clearInterval(this.warmupInterval);
        this.warmupInterval = null;
    }
};
/**
 * Waiting players connection controller
 *
 * @param {Object} $scope
 * @param {SocketClient} client
 */
function WaitingController($scope, client)
{
    if (!$scope.game) { return; }

    AbstractController.call(this, $scope);

    this.client = client;
    this.game   = $scope.game;

    // Binding
    this.onReady      = this.onReady.bind(this);
    this.onStart      = this.onStart.bind(this);
    this.detachEvents = this.detachEvents.bind(this);

    // Hydrate scope
    this.$scope.list = this.game.avatars.items.slice(0);

    this.$scope.$on('$destroy', this.onStart);

    this.attachEvents();
}

WaitingController.prototype = Object.create(AbstractController.prototype);
WaitingController.prototype.constructor = WaitingController;

/**
 * Attach socket Events
 */
WaitingController.prototype.attachEvents = function()
{
    this.client.on('ready', this.onReady);
};

/**
 * Attach socket Events
 */
WaitingController.prototype.detachEvents = function()
{
    this.client.off('ready', this.onReady);
};

/**
 * On avatar ready (client loaded)
 *
 * @param {Event} e
 */
WaitingController.prototype.onReady = function(e)
{
    var avatar = this.game.avatars.getById(e.detail),
        index  = this.$scope.list.indexOf(avatar);

    if (avatar && index) {
        this.$scope.list.splice(index, 1);
        this.digestScope();
    }
};

/**
 * On game start
 *
 * @param {Event} e
 */
WaitingController.prototype.onStart = function(e)
{
    this.$scope.list.length = 0;
    this.detachEvents();
};
/**
 * Room Controller
 *
 * @param {Object} $scope
 * @param {RoomRepository} RoomRepository
 */
function RoomConfigController($scope, repository)
{
    AbstractController.call(this, $scope);

    this.repository = repository;
    this.config     = null;

    // Binding:
    this.onJoined     = this.onJoined.bind(this);
    this.toggleBonus  = this.toggleBonus.bind(this);
    this.togglePreset = this.togglePreset.bind(this);
    this.setOpen      = this.setOpen.bind(this);
    this.setMaxScore  = this.setMaxScore.bind(this);
    this.setVariable  = this.setVariable.bind(this);

    // Hydrating scope
    this.$scope.toggleBonus  = this.toggleBonus;
    this.$scope.togglePreset = this.togglePreset;
    this.$scope.setOpen      = this.setOpen;
    this.$scope.setMaxScore  = this.setMaxScore;
    this.$scope.setVariable  = this.setVariable;

    this.repository.on('config:open', this.digestScope);
    this.repository.on('config:max-score', this.digestScope);
    this.repository.on('config:variable', this.digestScope);
    this.repository.on('config:bonus', this.digestScope);

    this.$scope.$parent.$watch('room', this.onJoined);
}

RoomConfigController.prototype = Object.create(AbstractController.prototype);
RoomConfigController.prototype.constructor = RoomConfigController;

/**
 * On room joined
 */
RoomConfigController.prototype.onJoined = function()
{
    if (this.$scope.$parent.room) {
        this.config = this.$scope.$parent.room.config;
        this.$scope.config = this.config;
    }
};

/**
 * Toggle bonus
 *
 * @param {String} bonus
 */
RoomConfigController.prototype.toggleBonus = function(bonus)
{
    if (this.config.bonusExists(bonus) && this.repository.amIMaster()) {
        var config = this.config;

        this.repository.setConfigBonus(bonus, function (result) {
            config.setBonus(bonus, result.enabled);
        });
    } else {
        console.error('Unknown bonus: %s', bonus.type);
    }
};

/**
 * Toggle preset
 *
 * @param {String} bonus
 */
RoomConfigController.prototype.togglePreset = function(preset)
{
    if (this.config.preset === preset) {
        if (preset === this.config.getDefaultPreset()) {
            return;
        }

        return this.applyPreset(this.config.getDefaultPreset());
    }

    this.applyPreset(preset);
};

/**
 * Apply the given preset
 *
 * @param {Preset} preset
 */
RoomConfigController.prototype.applyPreset = function(preset)
{
    if (this.repository.amIMaster()) {
        for (var bonus in this.config.bonuses) {
            if (this.config.bonuses[bonus] !== preset.hasBonus(bonus)) {
                this.toggleBonus(bonus);
            }
        }

        this.config.preset = preset;
    }
};

/**
 * Set open
 */
RoomConfigController.prototype.setOpen = function(open)
{
    if (this.repository.amIMaster()) {
        var config = this.config;

        this.repository.setConfigOpen(open, function (result) {
            config.setOpen(result.open);
            config.setPassword(result.password);
        });
    }
};

/**
 * Set max score
 */
RoomConfigController.prototype.setMaxScore = function(maxScore)
{
    if (this.repository.amIMaster()) {
        var config = this.config;

        this.repository.setConfigMaxScore(maxScore, function (result) {
            config.setMaxScore(result.maxScore);
        });
    }
};

/**
 * Set variable
 */
RoomConfigController.prototype.setVariable = function(variable)
{
    if (this.config.variableExists(variable) && this.repository.amIMaster()) {
        var config = this.config;

        this.repository.setConfigVariable(variable, this.config.getVariable(variable), function (result) {
            config.setVariable(result.variable, result.value);
        });
    }
};
/**
 * Canvas
 *
 * @param {Number} width
 * @param {Number} height
 * @param {Element} element
 */
function Canvas(width, height, element)
{
    this.element = typeof(element) !== 'undefined' ? element : document.createElement('canvas');
    this.context = this.element.getContext('2d');
    this.scale   = 1;

    if (typeof(width) !== 'undefined' && width) {
        this.setWidth(width);
    }

    if (typeof(height) !== 'undefined' && height) {
        this.setHeight(height);
    }
}

/**
 * Two pi
 *
 * @type {Number}
 */
Canvas.prototype.twoPi = 2 * Math.PI;

/**
 * Set width
 *
 * @param {Number} width
 */
Canvas.prototype.setWidth = function(width)
{
    this.element.width = width;
};

/**
 * Set height
 *
 * @param {Number} height
 */
Canvas.prototype.setHeight = function(height)
{
    this.element.height = height;
};

/**
 * Set scale
 *
 * @param {Float} scale
 */
Canvas.prototype.setScale = function(scale)
{
    this.scale = scale;
};

/**
 * Set dimension
 *
 * @param {Number} width
 * @param {Number} height
 * @param {Number} scale
 */
Canvas.prototype.setDimension = function(width, height, scale, update)
{
    var save;

    width  = Math.ceil(width);
    height = Math.ceil(height);

    if (update) {
        save = new Canvas(this.element.width, this.element.height);
        save.pastImage(this.element);
    }

    this.element.width  = width;
    this.element.height = height;

    if (typeof(scale) !== 'undefined') {
        this.setScale(scale);
    }

    if (update) {
        this.drawImage(save.element, 0, 0, this.element.width, this.element.height);
        save = null;
    }
};

/**
 * Set opacity
 *
 * @param {Float} opacity
 */
Canvas.prototype.setOpacity = function(opacity) {
    this.context.globalAlpha = opacity;
};

/**
 * Clear
 */
Canvas.prototype.clear = function()
{
    this.context.clearRect(0, 0, this.element.width, this.element.height);
};

/**
 * Color
 */
Canvas.prototype.color = function(color)
{
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.element.width, this.element.height);
};

/**
 * Clear rectangular zone
 */
Canvas.prototype.clearZone = function(x, y, width, height)
{
    this.context.clearRect(x, y, width, height);
};

/**
 * Clear rectangular zone scaled
 */
Canvas.prototype.clearZoneScaled = function(x, y, width, height)
{
    this.clearZone(
        this.round(x * this.scale),
        this.round(y * this.scale),
        this.round(width * this.scale),
        this.round(height * this.scale)
    );
};

/**
 * Save context
 */
Canvas.prototype.save = function()
{
    this.context.save();
};

/**
 * Restore context
 */
Canvas.prototype.restore = function()
{
    this.context.restore();
};

/**
 * Reverse image
 */
Canvas.prototype.reverse = function()
{
    this.context.save();
    this.context.translate(this.element.width, 0);
    this.context.scale(-1, 1);
};

/**
 * Draw image to scale
 *
 * @param {Resource} image
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
Canvas.prototype.drawImageScaled = function(image, x, y, width, height)
{
    this.context.drawImage(
        image,
        this.round(x * this.scale),
        this.round(y * this.scale),
        this.round(width * this.scale),
        this.round(height * this.scale)
    );
};

/**
 * Draw image to scale
 *
 * @param {Resource} image
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Float} angle
 */
Canvas.prototype.drawImageScaledAngle = function(image, x, y, width, height, angle)
{
    x      = this.round(x * this.scale);
    y      = this.round(y * this.scale);
    width  = this.round(width / 2 * this.scale);
    height = this.round(height / 2 * this.scale);

    var centerX = x + width,
        centerY = y + height;

    x = -width;
    y = -height;

    this.context.save();
    this.context.translate(centerX, centerY);
    this.context.rotate(angle);
    this.context.drawImage(image, x, y, width * 2, height * 2);
    this.context.restore();
};

/**
 * Draw image to size
 *
 * @param {Resource} image
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
Canvas.prototype.drawImage = function(image, x, y, width, height)
{
    this.context.drawImage(image, x, y, width, height);
};

/**
 * Draw image to size
 *
 * @param {Resource} image
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
Canvas.prototype.drawImageTo = function(image, x, y)
{
    this.context.drawImage(image, x, y);
};

/**
 * Past image
 *
 * @param {Resource} image
 */
Canvas.prototype.pastImage = function(image)
{
    this.context.drawImage(image, 0, 0);
};

/**
 * Draw circle
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {String} color
 */
Canvas.prototype.drawCircle = function(x, y, radius, color)
{
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, this.twoPi, false);
    this.context.fillStyle = color;
    this.context.fill();
};

/**
 * Draw line
 *
 * @param {Array} points
 * @param {Number} width
 * @param {String} color
 * @param {String} style
 */
Canvas.prototype.drawLine = function(points, width, color, style)
{
    var length = points.length;

    if (length > 1) {
        this.context.lineCap     = style;
        this.context.strokeStyle = color;
        this.context.lineWidth   = width;
        this.context.beginPath();
        this.context.moveTo(points[0][0], points[0][1]);

        for (var i = 1; i < length; i++) {
            this.context.lineTo(points[i][0], points[i][1]);
        }

        this.context.stroke();
    }
};

/**
 * Draw line scaled
 *
 * @param {Array} points
 * @param {Number} width
 * @param {String} color
 * @param {String} style
 */
Canvas.prototype.drawLineScaled = function(points, width, color, style)
{
    var length = points.length;

    if (length > 1) {
        this.context.lineCap     = style;
        this.context.strokeStyle = color;
        this.context.lineWidth   = width * this.scale;
        this.context.beginPath();
        this.context.moveTo(points[0][0] * this.scale, points[0][1] * this.scale);

        for (var i = 1; i < length; i++) {
            this.context.lineTo(points[i][0] * this.scale, points[i][1] * this.scale);
        }

        this.context.stroke();
    }
};

/**
 * To string
 *
 * @return {String}
 */
Canvas.prototype.toString = function()
{
    return this.element.toDataURL();
};

/**
 * Round
 *
 * @param {Number} value
 *
 * @return {Number}
 */
Canvas.prototype.round = function (value)
{
    return (0.5 + value) | 0;
};

/**
 * Round float
 *
 * @param {Float} value
 * @param {Number} precision
 *
 * @return {Float}
 */
Canvas.prototype.roundFloat = function (value, precision)
{
    var coef = Math.pow(10, typeof(precision) !== 'undefined' ? precision : 2);

    return ((0.5 + value*coef) | 0)/coef;
};
/**
 * SocketClient
 */
function SocketClient()
{
    this.id        = null;
    this.connected = false;

    this.onError      = this.onError.bind(this);
    this.onOpen       = this.onOpen.bind(this);
    this.onConnection = this.onConnection.bind(this);

    var Socket = window.MozWebSocket || window.WebSocket;

    var protocol = 'ws://';
    if(location.protocol === 'https:') {
        protocol = 'wss://';
    }

    BaseSocketClient.call(this, new Socket(protocol + document.location.host + document.location.pathname, ['websocket']));

    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('error', this.onError);
    this.socket.addEventListener('close', this.onClose);
}

SocketClient.prototype = Object.create(BaseSocketClient.prototype);
SocketClient.prototype.constructor = SocketClient;

/**
 * On socket connection
 *
 * @param {Socket} socket
 */
SocketClient.prototype.onOpen = function(e)
{
    console.info('Socket open.');
    this.addEvent('whoami', null, this.onConnection);
};

/**
 * On open
 *
 * @param {Event} e
 */
SocketClient.prototype.onConnection = function(id)
{
    console.info('Connected with id "%s".', id);

    this.id        = id;
    this.connected = true;

    this.start();
    this.emit('connected');
};

/**
 * On open
 *
 * @param {Event} e
 */
SocketClient.prototype.onClose = function(e)
{
    console.info('Disconnected.');

    this.connected = false;
    this.id        = null;

    this.stop();

    this.emit('disconnected');
};

/**
 * On error
 *
 * @param {Event} e
 */
SocketClient.prototype.onError = function (e)
{
    console.error(e);

    if (!this.connected) {
        this.onClose();
    }
};
/**
 * Stop watch
 *
 * @param {String} name
 * @param {Number} tolerance
 */
function StopWatch(name, tolerance) {
    this.name     = name;
    this.from     = null;
    this.to       = null;
    this.duration = 0;

    if (typeof(tolerance) === 'number') {
        this.tolerance = tolerance;
    }

    this.start();
}

/**
 * Duration
 *
 * @type {Number}
 */
StopWatch.prototype.tolerance = 2;
/**
 * Start
 */
StopWatch.prototype.start = function() {
    this.from = new Date();
};

/**
 * Stop
 */
StopWatch.prototype.stop = function() {
    this.to = new Date();
    this.log(this.to.getTime() - this.from.getTime());
};

/**
 * Log duration
 *
 * @param {Number} duration
 */
StopWatch.prototype.log = function(duration) {
    if (duration >= this.tolerance) {
        this.duration = duration;
        console.info(this.name + ': ' + this.duration);
    }
};
/**
 * Bonus Manager
 *
 * @param {Game} game
 */
function BonusManager(game)
{
    BaseBonusManager.call(this, game);

    this.bonuses.index = false;

    this.onLoad = this.onLoad.bind(this);

    this.loaded = false;
    this.sprite = new SpriteAsset('images/bonus.png', 3, 4, this.onLoad, true);
}

BonusManager.prototype = Object.create(BaseBonusManager.prototype);
BonusManager.prototype.constructor = BonusManager;

/**
 * Assets
 *
 * @type {Object}
 */
BonusManager.prototype.assets = {};

/**
 * Bonuses position on the sprite
 *
 * @type {Array}
 */
BonusManager.prototype.spritePosition = [
    'BonusSelfFast',
    'BonusEnemyFast',
    'BonusSelfSlow',
    'BonusEnemySlow',
    'BonusGameBorderless',
    'BonusSelfMaster',
    'BonusEnemyBig',
    'BonusAllColor',
    'BonusEnemyInverse',
    'BonusSelfSmall',
    'BonusGameClear',
    'BonusEnemyStraightAngle'
];

/**
 * Load DOM
 */
BonusManager.prototype.loadDOM = function()
{
    this.canvas = new Canvas(0, 0, document.getElementById('bonus'));
};

/**
 * On bonus sprite loaded
 */
BonusManager.prototype.onLoad = function()
{
    var images = this.sprite.getImages();

    for (var i = this.spritePosition.length - 1; i >= 0; i--) {
        this.assets[this.spritePosition[i]] = images[i];
    }

    this.loaded = true;
    this.emit('load');
};

/**
 * Remove bonus
 *
 * @param {Bonus} bonus
 */
BonusManager.prototype.remove = function(bonus)
{
    this.clearBonus(bonus);
    BaseBonusManager.prototype.remove.call(this, bonus);
};

/**
 * Clear
 */
BonusManager.prototype.clear = function()
{
    this.canvas.clear();
    BaseBonusManager.prototype.clear.call(this);
};

/**
 * Draw
 *
 * @param {Canvas} canvas
 */
BonusManager.prototype.draw = function()
{
    for (var bonus, i = this.bonuses.items.length - 1; i >= 0; i--) {
        bonus = this.bonuses.items[i];
        if (!bonus.animation.done && bonus.drawWidth) {
            this.clearBonus(bonus);
        }
    }

    for (bonus, i = this.bonuses.items.length - 1; i >= 0; i--) {
        bonus = this.bonuses.items[i];
        if (!bonus.animation.done) {
            bonus.update();
            this.drawBonus(bonus);
        }
    }
};

/**
 * Draw bonus
 *
 * @param {Bonus} bonus
 */
BonusManager.prototype.drawBonus = function(bonus)
{
    this.canvas.drawImageScaled(bonus.asset, bonus.drawX, bonus.drawY, bonus.drawWidth, bonus.drawWidth);
};

/**
 * Clear bonus from the canvas
 *
 * @param {Bonus} bonus
 */
BonusManager.prototype.clearBonus = function(bonus)
{
    this.canvas.clearZoneScaled(bonus.drawX, bonus.drawY, bonus.drawWidth, bonus.drawWidth);
};

/**
 * Set dimension
 *
 * @param {Number} width
 * @param {Float} scale
 */
BonusManager.prototype.setDimension = function(width, scale)
{
    this.canvas.setDimension(width, width, scale);
    this.draw();
};
/**
 * Avatar
 *
 * @param {Player} player
 */
function Avatar(player)
{
    BaseAvatar.call(this, player);

    this.local        = player.local;
    this.canvas       = new Canvas(100, 100);
    this.arrow        = new Canvas(this.arrowSize, this.arrowSize);
    this.width        = this.radius * 2;
    this.canvasWidth  = this.canvas.element.width;
    this.canvasRadius = this.canvasWidth/2;
    this.clearWidth   = this.canvasWidth;
    this.startX       = 0;
    this.startY       = 0;
    this.clearX       = 0;
    this.clearY       = 0;
    this.elements     = {
        root: null,
        roundScore: null,
        score: null
    };

    if (this.local) {
        this.input = new PlayerInput(this, player.getBinding());
    }

    this.drawArrow();
}

Avatar.prototype = Object.create(BaseAvatar.prototype);
Avatar.prototype.constructor = Avatar;

/**
 * Array width
 *
 * @type {Number}
 */
Avatar.prototype.arrowWidth = 3;

/**
 * Arrow canvas size
 *
 * @type {Number}
 */
Avatar.prototype.arrowSize = 200;

/**
 * Update
 *
 * @param {Number} step
 */
Avatar.prototype.update = function(step)
{
    if (!this.changed && this.alive) {
        this.updateAngle(step);
        this.updatePosition(step);
    }

    this.startX  = this.canvas.round(this.x * this.canvas.scale - this.canvasRadius);
    this.startY  = this.canvas.round(this.y * this.canvas.scale - this.canvasRadius);
    this.changed = false;
};

/**
 * Set position (from server)
 *
 * @param {Number} x
 * @param {Number} y
 */
Avatar.prototype.setPositionFromServer = function(x, y)
{
    BaseAvatar.prototype.setPosition.call(this, x, y);

    this.changed = true;

    if (this.printing) {
        this.addPoint(x, y);
    }
};

/**
 * Set scale
 *
 * @param {Number} scale
 */
Avatar.prototype.setScale = function(scale)
{
    var width = Math.ceil(this.width * scale);
    this.canvas.setDimension(width, width, scale);
    this.changed      = true;
    this.canvasWidth  = this.canvas.element.width;
    this.canvasRadius = this.canvas.element.width/2;
    this.drawHead();
};

/**
 * Set radius
 *
 * @param {Number} radius
 */
Avatar.prototype.setRadius = function(radius)
{
    BaseAvatar.prototype.setRadius.call(this, radius);
    this.updateWidth();
    this.drawHead();
};

/**
 * Set color
 *
 * @param {String} color
 */
Avatar.prototype.setColor = function(color)
{
    BaseAvatar.prototype.setColor.call(this, color);
    this.drawHead();
};

/**
 * Set score
 *
 * @param {Number} score
 */
Avatar.prototype.setScore = function(score)
{
    var diff = score - this.score;

    BaseAvatar.prototype.setScore.call(this, score);

    this.roundScore = diff;
};

/**
 * Die
 */
Avatar.prototype.die = function()
{
    BaseAvatar.prototype.die.call(this);
    this.emit('die', this);
};

/**
 * Draw head
 */
Avatar.prototype.drawHead = function()
{
    this.canvas.clear();
    this.canvas.drawCircle(
        this.canvasRadius,
        this.canvasRadius,
        this.radius * this.canvas.scale,
        this.color
    );
};

/**
 * Draw arrow
 */
Avatar.prototype.drawArrow = function()
{
    var arrowLines = [
        [[this.arrowSize * 0.65, this.arrowSize * 0.5], [this.arrowSize * 0.95, this.arrowSize * 0.5]],
        [[this.arrowSize * 0.85, this.arrowSize * 0.4], [this.arrowSize * 0.95, this.arrowSize * 0.5], [this.arrowSize * 0.85, this.arrowSize * 0.6]]
    ];

    this.arrow.clear();

    for (var i = arrowLines.length - 1; i >= 0; i--) {
        this.arrow.drawLine(arrowLines[i], this.arrowSize * this.arrowWidth/100, this.color, 'round');
    }
};

/**
 * Update width
 */
Avatar.prototype.updateWidth = function()
{
    this.width = this.radius * 2;
    this.setScale(this.canvas.scale);
};

/**
 * Destroy
 */
Avatar.prototype.destroy = function()
{
    this.trail.clear();
    this.canvas.clear();
    this.arrow.clear();

    if (this.input) {
        this.input.detachEvents();
        this.input = null;
    }

    BaseAvatar.prototype.destroy.call(this);
};

/**
 * Clear
 */
Avatar.prototype.clear = function()
{
    BaseAvatar.prototype.clear.call(this);
    this.updateWidth();
    this.drawHead();
};

/**
 * Set
 *
 * @param {String} property
 * @param {Object} value
 */
Avatar.prototype.set = function(property, value)
{
    var method = 'set' + property[0].toUpperCase() + property.slice(1);

    if (typeof(this[method]) !== 'undefined') {
        this[method](value);
    } else {
        throw 'Unknown setter ' + method;
    }
};

/**
 * Has bonus
 *
 * @return {Boolean}
 */
Avatar.prototype.hasBonus = function()
{
    return !this.bonusStack.bonuses.isEmpty();
};
/**
 * Bonus Stack
 *
 * @param {Avatar} avatar
 */
function BonusStack(avatar)
{
    BaseBonusStack.call(this, avatar);

    this.canvas     = new Canvas(this.width, this.width);
    this.changed    = true;
    this.lastWidth  = this.width;
    this.lastHeight = this.width;

    this.draw = this.draw.bind(this);
}

BonusStack.prototype = Object.create(BaseBonusStack.prototype);
BonusStack.prototype.constructor = BonusStack;

/**
 * Bonus width
 *
 * @type {Number}
 */
BonusStack.prototype.bonusWidth = 20;

/**
 * Warning time
 *
 * @type {Number}
 */
BonusStack.prototype.warning = 1000;

/**
 * Add bonus to the stack
 *
 * @param {Bonus} bonus
 */
BonusStack.prototype.add = function(bonus)
{
    bonus.on('change', this.draw);
    bonus.setEndingTimeout(this.warning);
    this.bonuses.add(bonus);
    this.updateDimensions();
};

/**
 * Remove bonus from the stack
 *
 * @param {Bonus} bonus
 */
BonusStack.prototype.remove = function(bonus)
{
    bonus.clear();
    bonus.off('change', this.draw);
    this.bonuses.remove(bonus);
    this.updateDimensions();
};

/**
 * Clear
 */
BonusStack.prototype.clear = function()
{
    for (var i = this.bonuses.items.length - 1; i >= 0; i--) {
        this.bonuses.items[i].clear();
    }

    BaseBonusStack.prototype.clear.call(this);
    this.updateDimensions();
};

/**
 * Update dimensions
 */
BonusStack.prototype.updateDimensions = function()
{
    this.canvas.setDimension(this.bonuses.items.length * this.bonusWidth, this.bonusWidth);
    this.changed = true;
    this.draw();
};

/**
 * Draw
 */
BonusStack.prototype.draw = function(e)
{
    if (this.changed) {
        this.canvas.clear();
    }

    for (var bonus, x, i = this.bonuses.items.length - 1; i >= 0; i--) {
        bonus = this.bonuses.items[i];
        if (this.changed || bonus.changed) {
            x = i * this.bonusWidth;
            if (!this.changed) {
                this.canvas.clearZone(x, 0, this.bonusWidth, this.bonusWidth);
            }
            this.canvas.setOpacity(bonus.opacity);
            this.canvas.drawImage(bonus.asset, x, 0, this.bonusWidth, this.bonusWidth);
            bonus.changed = false;
        }
    }

    this.changed = false;
};
/**
 * Distant client
 */
function Client(id, active)
{
    this.id      = id;
    this.players = new Collection();
    this.active  = typeof(active) === 'undefined' || active;
    this.master  = false;
}

/**
 * Set master
 *
 * @param {boolean} master
 */
Client.prototype.setMaster = function(master)
{
    this.master = master;
};
/**
 * Game
 *
 * @param {Room} room
 */
function Game(room)
{
    BaseGame.call(this, room);

    this.animations = [];

    this.onResize = this.onResize.bind(this);
    this.onDie    = this.onDie.bind(this);

    window.addEventListener('error', this.stop);
    window.addEventListener('resize', this.onResize);

    for (var avatar, i = this.avatars.items.length - 1; i >= 0; i--) {
        this.avatars.items[i].on('die', this.onDie);
    }
}

Game.prototype = Object.create(BaseGame.prototype);
Game.prototype.constructor = Game;

/**
 * Margin between player an bonus stack
 *
 * @type {Number}
 */
Game.prototype.stackMargin = 15;

/**
 * Background color
 *
 * @type {String}
 */
Game.prototype.backgroundColor = '#222222';

/**
 * Load DOM
 */
Game.prototype.loadDOM = function()
{
    this.render     = document.getElementById('render');
    this.gameInfos  = document.getElementById('game-infos');
    this.canvas     = new Canvas(0, 0, document.getElementById('game'));
    this.background = new Canvas(0, 0, document.getElementById('background'));
    this.effect     = new Canvas(0, 0, document.getElementById('effect'));

    this.bonusManager.loadDOM();
    this.onResize();
};

/**
 * Get new frame
 */
Game.prototype.newFrame = function()
{
    this.frame = window.requestAnimationFrame(this.loop);
};

/**
 * Clear frame
 */
Game.prototype.clearFrame = function()
{
    window.cancelAnimationFrame(this.frame);
    this.frame = null;
};

/**
 * On frame
 *
 * @param {Number} step
 */
Game.prototype.onFrame = function(step)
{
    this.draw(step);
};

/**
 * On round new
 */
Game.prototype.onRoundNew = function()
{
    BaseGame.prototype.onRoundNew.call(this);
    this.repaint();
};

/**
 * On start
 */
Game.prototype.onStart = function()
{
    this.effect.clear();
    BaseGame.prototype.onStart.call(this);
};

/**
 * Is tie break
 *
 * @return {Boolean}
 */
Game.prototype.isTieBreak = function()
{
    var maxScore = this.maxScore;

    return this.avatars.match(function () { return this.score >= maxScore; }) !== null;
};

/**
 * Are all avatars ready?
 *
 * @return {Boolean}
 */
Game.prototype.isReady = function()
{
    return this.started ? true : BaseGame.prototype.isReady.call(this);
};

/**
 * Clear trails
 */
Game.prototype.clearTrails = function()
{
    this.clearBackground();
};

/**
 * End
 */
Game.prototype.end = function()
{
    if (BaseGame.prototype.end.call(this)) {
        window.removeEventListener('error', this.stop);
        window.removeEventListener('resize', this.onResize);
    }
};

/**
 * Update size
 */
Game.prototype.setSize = function()
{
    BaseGame.prototype.setSize.call(this);
    this.onResize();
};

/**
 * Repaint
 */
Game.prototype.repaint = function()
{
    this.animations.length = 0;
    this.clearBackground();
    this.effect.clear();
    this.canvas.clear();
    this.draw();
};


/**
 * Draw
 *
 * @param {Number} step
 */
Game.prototype.draw = function(step)
{
    for (var animation, a = this.animations.length - 1; a >= 0; a--) {
        animation = this.animations[a];
        animation.draw();
        if (animation.done && animation.cleared) {
            this.animations.splice(a, 1);
        }
    }

    for (var avatar, i = this.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.avatars.items[i];
        if (avatar.present && (avatar.alive || avatar.changed)) {
            this.clearAvatar(avatar);
            this.clearBonusStack(avatar);
        }
    }

    for (avatar, i = this.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.avatars.items[i];
        if (avatar.present && (avatar.alive || avatar.changed)) {
            if (avatar.alive) {
                avatar.update(this.frame ? step : 0);
            }

            this.drawTail(avatar);
            this.drawAvatar(avatar);
            this.drawBonusStack(avatar);

            if (!this.frame && avatar.local) {
                this.drawArrow(avatar);
            }
        }
    }

    this.bonusManager.draw();
};

/**
 * Draw tail
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawTail = function(avatar)
{
    var points = avatar.trail.getLastSegment();

    if (points) {
        this.background.drawLineScaled(points, avatar.width, avatar.color, 'round');
    }
};

/**
 * Draw avatar
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawAvatar = function(avatar)
{
    this.canvas.drawImageTo(avatar.canvas.element, avatar.startX, avatar.startY);
    avatar.clearX     = avatar.startX;
    avatar.clearY     = avatar.startY;
    avatar.clearWidth = avatar.canvas.element.width;
};

/**
 * Clear bonus from the canvas
 *
 * @param {Bonus} bonus
 */
Game.prototype.clearAvatar = function(avatar)
{
    this.canvas.clearZone(avatar.clearX, avatar.clearY, avatar.clearWidth, avatar.clearWidth);
};

/**
 * Clear bonus stack
 *
 * @param {Avatar} avatar
 */
Game.prototype.clearBonusStack = function(avatar)
{
    if (avatar.bonusStack.lastWidth) {
        this.canvas.clearZone(
            avatar.startX + this.stackMargin,
            avatar.startY + this.stackMargin,
            avatar.bonusStack.lastWidth,
            avatar.bonusStack.lastHeight
        );
    }
};


/**
 * Draw bonus stack
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawBonusStack = function(avatar)
{
    if (avatar.hasBonus()) {
        avatar.bonusStack.lastWidth  = avatar.bonusStack.canvas.element.width;
        avatar.bonusStack.lastHeight = avatar.bonusStack.canvas.element.height;

        this.canvas.drawImageTo(
            avatar.bonusStack.canvas.element,
            avatar.startX + this.stackMargin,
            avatar.startY + this.stackMargin
        );
    }
};

/**
 * Draw arrow
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawArrow = function(avatar)
{
    this.effect.drawImageScaledAngle(avatar.arrow.element, avatar.x - 5, avatar.y - 5, 10, 10, avatar.angle);
};

/**
 * Clear background with color
 */
Game.prototype.clearBackground = function()
{
    this.background.color(this.backgroundColor);
};

/**
 * On die
 *
 * @param {Event} event
 */
Game.prototype.onDie = function(event)
{
    this.animations.push(new Explode(event.detail, this.effect));
};

/**
 * On resize
 */
Game.prototype.onResize = function()
{
    var w=window,d=document,e=d.documentElement,g=document.body,x=w.innerWidth||e.clientWidth||g.clientWidth,y=w.innerHeight||e.clientHeight||g.clientHeight;

    var width = Math.min(x - this.gameInfos.clientWidth - 8, y - 8),
        scale = width / this.size,
        avatar;

    this.render.style.width  = (width + 8) + 'px';
    this.render.style.height = (width + 8) + 'px';
    this.canvas.setDimension(width, width, scale);
    this.effect.setDimension(width, width, scale);
    this.background.setDimension(width, width, scale, true);
    this.bonusManager.setDimension(width, scale);

    for (var i = this.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.avatars.items[i];

        avatar.setScale(scale);

        if (typeof(avatar.input) !== 'undefined') {
            avatar.input.setWidth(x);
        }
    }
};
/**
 * Player
 *
 * @param {Number} id
 * @param {String} client
 * @param {String} name
 * @param {String} color
 * @param {Boolean} ready
 */
function Player(id, client, name, color, ready)
{
    BasePlayer.call(this, client, name, color, ready);

    this.id       = id;
    this.local    = false;
    this.controls = null;
    this.vote     = false;
    this.kicked   = false;
    this.position = this.client.id + '-' + this.id;

    this.onControlChange = this.onControlChange.bind(this);

    this.client.players.add(this);
}

Player.prototype = Object.create(BasePlayer.prototype);
Player.prototype.constructor = Player;

/**
 * Set local
 *
 * @param {Boolean} local
 */
Player.prototype.setLocal = function(local)
{
    this.local = local;

    this.initControls();
};

/**
 * Init controls
 */
Player.prototype.initControls = function()
{
    if (!this.controls) {
        this.controls = [
            new PlayerControl(37, 'icon-left-dir'),
            new PlayerControl(39, 'icon-right-dir')
        ];

        for (var i = this.controls.length - 1; i >= 0; i--) {
            this.controls[i].on('change', this.onControlChange);
        }
    }
};

/**
 * Get controls mapping
 *
 * @return {Array}
 */
Player.prototype.getMapping = function()
{
    var mapping = new Array(this.controls.length);

    for (var i = this.controls.length - 1; i >= 0; i--) {
        mapping[i] = this.controls[i].getMapping();
    }

    return mapping;
};

/**
 * Set touch
 */
Player.prototype.setTouch = function()
{
    var touch = document.createTouch(window, window, new Date().getTime(), 0, 0, 0, 0);

    for (var i = this.controls.length - 1; i >= 0; i--) {
        this.controls[i].mappers.getById('touch').setValue(touch);
    }
};

/**
 * On change
 *
 * @param {Event} e
 */
Player.prototype.onControlChange = function(e)
{
    this.emit('control:change');
};

/**
 * Get binding
 *
 * @return {Array}
 */
Player.prototype.getBinding = function()
{
    return [this.controls[0].mapper.value, this.controls[1].mapper.value];
};

/**
 * Should this player be considered master?
 *
 * @return {Boolean}
 */
Player.prototype.isMaster = function ()
{
    return this.client.master && this.client.players.getIdIndex(this.id) === 0;
};
/**
 * Player control
 */
function PlayerControl(value, icon)
{
    EventEmitter.call(this);

    this.icon      = icon;
    this.listening = false;
    this.mappers   = new Collection();

    this.start = this.start.bind(this);
    this.stop  = this.stop.bind(this);

    this.addMapper('keyboard', new KeyboardMapper());
    this.addMapper('touch', new TouchMapper());
    this.addMapper('gamepad', new GamepadMapper(gamepadListener, true));

    this.mapper = this.mappers.getById('keyboard');

    this.mapper.setValue(value);
}

PlayerControl.prototype = Object.create(EventEmitter.prototype);
PlayerControl.prototype.constructor = PlayerControl;

/**
 * Create mapper
 *
 * @param {String} id
 * @param {Mapper} mapper
 */
PlayerControl.prototype.addMapper = function(id, mapper)
{
    var control = this;

    mapper.id = id;

    mapper.on('change', function (e) { return control.setMapper(mapper); });
    mapper.on('listening:stop', this.stop);

    this.mappers.add(mapper);
};

/**
 * Set mapper
 *
 * @param {Mapper} mapper
 */
PlayerControl.prototype.setMapper = function(mapper)
{
    this.mapper = mapper;
    this.emit('change');
};

/**
 * Get mapping
 *
 * @return {Object}
 */
PlayerControl.prototype.getMapping = function()
{
    return {
        'mapper': this.mapper.id,
        'value': this.mapper.value
    };
};

/**
 * Load mapping
 *
 * @param {Object} mapping
 */
PlayerControl.prototype.loadMapping = function(mapping)
{
    var mapper = this.mappers.getById(mapping.mapper);

    if (mapper) {
        this.setMapper(mapper);
        this.mapper.setValue(mapping.value);
    }
};

/**
 * Toggle
 */
PlayerControl.prototype.toggle = function()
{
    if (this.mapper.listening) {
        this.stop();
    } else {
        this.start();
    }
};

/**
 * Start listening
 */
PlayerControl.prototype.start = function()
{
    for (var i = this.mappers.items.length - 1; i >= 0; i--) {
        this.mappers.items[i].start();
    }
};

/**
 * Start listening
 */
PlayerControl.prototype.stop = function()
{
    for (var i = this.mappers.items.length - 1; i >= 0; i--) {
        this.mappers.items[i].stop();
    }
};
/**
 * Player input
 */
function PlayerInput(avatar, binding)
{
    EventEmitter.call(this);

    this.avatar  = avatar;
    this.key     = false;
    this.active  = [false, false];
    this.move    = 0;
    this.width   = 0;
    this.binding = typeof(binding) !== 'undefined' ? binding : this.defaultBinding;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp   = this.onKeyUp.bind(this);
    this.onAxis    = this.onAxis.bind(this);
    this.onButton  = this.onButton.bind(this);
    this.onTouch   = this.onTouch.bind(this);

    this.attachEvents();
}

PlayerInput.prototype = Object.create(EventEmitter.prototype);
PlayerInput.prototype.constructor = PlayerInput;

/**
 * Key binding
 *
 * @type {Object}
 */
PlayerInput.prototype.defaultBinding = [37, 39];

/**
 * Attach events
 */
PlayerInput.prototype.attachEvents = function()
{
    var listening = [],
        binding, type;

    for (var i = this.binding.length - 1; i >= 0; i--) {
        binding = this.binding[i];
        type = this.getBindingType(binding);

        if (listening.indexOf(type) < 0) {
            listening.push(type);

            if (type === 'keyboard') {
                window.addEventListener('keydown', this.onKeyDown);
                window.addEventListener('keyup', this.onKeyUp);
            } else if (type === 'touch') {
                window.addEventListener('touchstart', this.onTouch);
                window.addEventListener('touchend', this.onTouch);
                window.addEventListener('touchleave', this.onTouch);
                window.addEventListener('touchcancel', this.onTouch);
            } else if (new RegExp('^gamepad:\\d+:button').test(type)) {
                gamepadListener.on(type, this.onButton);
            } else {
                gamepadListener.on(type, this.onAxis);
            }
        }
    }
};

/**
 * Detach events
 */
PlayerInput.prototype.detachEvents = function()
{
    var listening = [],
        binding, type;

    for (var i = this.binding.length - 1; i >= 0; i--) {
        binding = this.binding[i];
        type = this.getBindingType(binding);

        if (listening.indexOf(type) < 0) {
            listening.push(type);

            if (type === 'keyboard') {
                window.removeEventListener('keydown', this.onKeyDown);
                window.removeEventListener('keyup', this.onKeyUp);
            } else if (type === 'touch') {
                window.removeEventListener('touchstart', this.onTouch);
                window.removeEventListener('touchend', this.onTouch);
                window.removeEventListener('touchleave', this.onTouch);
                window.removeEventListener('touchcancel', this.onTouch);
            } else if (new RegExp('^gamepad:\\d+:button').test(type)) {
                gamepadListener.off(type, this.onButton);
            } else {
                gamepadListener.off(type, this.onAxis);
            }
        }
    }
};

/**
 * Get binding type
 *
 * @param {String} binding
 *
 * @return {String}
 */
PlayerInput.prototype.getBindingType = function(binding)
{
    if (typeof(Touch) !== 'undefined' && binding instanceof Touch) {
        return 'touch';
    }

    var matches = new RegExp('^(gamepad:(\\d+):(button|axis):(\\d+))').exec(binding);

    return matches ? matches[1] : 'keyboard';
};

/**
 * On Key Down
 *
 * @param {Event} e
 */
PlayerInput.prototype.onKeyDown = function(e)
{
    var index = this.binding.indexOf(e.keyCode);

    if (index >= 0) {
        this.setActive(index, true);
    }
};

/**
 * On Key Down
 *
 * @param {Event} e
 */
PlayerInput.prototype.onKeyUp = function(e)
{
    var index = this.binding.indexOf(e.keyCode);

    if (index >= 0) {
        this.setActive(index, false);
    }
};

/**
 * On axis
 *
 * @param {Event} e
 */
PlayerInput.prototype.onAxis = function(e)
{
    var index = this.binding.indexOf('gamepad:' + e.detail.gamepad.index + ':axis:' + e.detail.axis + ':' + e.detail.value);

    if (index >= 0) {
        this.setActive(index, true);
    } else {
        for (var i = this.binding.length - 1; i >= 0; i--) {
            if (new RegExp('^gamepad:' + e.detail.gamepad.index + ':axis:' + e.detail.axis).test(this.binding[i])) {
                this.setActive(i, false);
            }
        }
    }
};

/**
 * On button
 *
 * @param {Event} e
 */
PlayerInput.prototype.onButton = function(e)
{
    var index = this.binding.indexOf('gamepad:' + e.detail.gamepad.index + ':button:' + e.detail.index);

    if (index >= 0) {
        this.setActive(index, e.detail.pressed);
    }
};

/**
 * On touch start
 *
 * @param {Event} e
 */
PlayerInput.prototype.onTouch = function(e)
{
    e.preventDefault();

    var center = this.width/2,
        tests = [],
        t, i, x;

    for (i = this.binding.length - 1; i >= 0; i--) {
        if (this.binding[i] instanceof Touch) {
            tests.push({index: i, result: false});
        }
    }

    for (i = e.touches.length - 1; i >= 0; i--) {
        for (t = tests.length - 1; t >= 0; t--) {
            x = e.touches[i].screenX;
            if (tests[t].index === 0 ? x < center : x >= center) {
                tests[t].result = true;
            }
        }
    }

    for (i = tests.length - 1; i >= 0; i--) {
        this.setActive(tests[i].index, tests[i].result);
    }
};

/**
 * Resolve
 *
 * @param {Number} index
 * @param {Boolean} pressed
 */
PlayerInput.prototype.setActive = function(index, pressed)
{
    if (this.active[index] !== pressed) {
        this.active[index] = pressed;
        this.resolve();
    }
};

/**
 * Resolve
 */
PlayerInput.prototype.resolve = function()
{
    var move = (this.active[0] !== this.active[1]) ? (this.active[0] ? -1 : 1) : false;

    if (this.move !== move) {
        this.setMove(move);
    }
};

/**
 * Use gamepad?
 *
 * @return {Boolean}
 */
PlayerInput.prototype.useGamepad = function()
{
    for (var i = this.binding.length - 1; i >= 0; i--) {
        if (new RegExp('^gamepad:').test(this.getBindingType(this.binding[i]))) {
            return true;
        }
    }

    return false;
};

/**
 * Set move
 *
 * @param {Boolean} move
 */
PlayerInput.prototype.setMove = function(move)
{
    this.move = move;
    this.emit('move', {avatar: this.avatar, move: move});
};

/**
 * Set width
 *
 * @param {Number} width
 */
PlayerInput.prototype.setWidth = function(width)
{
    this.width = width;
};
/**
 * Room
 */
function Room(name)
{
    BaseRoom.call(this, name);

    this.players.index = false;
}

Room.prototype = Object.create(BaseRoom.prototype);
Room.prototype.constructor = Room;

/**
 * Get local players
 *
 * @return {Collection}
 */
Room.prototype.getLocalPlayers = function()
{
    return this.players.filter(function () { return this.local; });
};

/**
 * Get player by client Id
 *
 * @param {Number} client
 *
 * @return {Player}
 */
Room.prototype.getPlayerByClient = function(client)
{
    return this.players.match(function () { return this.client.id === client; });
};

/**
 * Get url
 *
 * @return {String}
 */
Room.prototype.getUrl = function()
{
    return '/room/' + encodeURIComponent(this.name);
};

/**
 * Get game url
 *
 * @return {String}
 */
Room.prototype.getGameUrl = function()
{
    return '/game/' + encodeURIComponent(this.name);
};

/**
 * Close game
 */
Room.prototype.closeGame = function()
{
    for (var i = this.players.items.length - 1; i >= 0; i--) {
        if (!this.players.items[i].avatar.present) {
            this.removePlayer(this.players.items[i]);
        }
    }

    return BaseRoom.prototype.closeGame.call(this);
};
/**
 * Room Configuration
 *
 * @param {Room} room
 */
function RoomConfig(room)
{
    BaseRoomConfig.call(this, room);

    this.preset       = this.getDefaultPreset();
    this.customPreset = new CustomPreset();
}

RoomConfig.prototype = Object.create(BaseRoomConfig.prototype);
RoomConfig.prototype.constructor = RoomConfig;

/**
 * Bonus classes
 *
 * @type {Object}
 */
RoomConfig.prototype.bonusClasses = {
    BonusSelfSmall: 'bonus-self-small',
    BonusSelfSlow: 'bonus-self-slow',
    BonusSelfFast: 'bonus-self-fast',
    BonusSelfMaster: 'bonus-self-master',
    BonusEnemySlow: 'bonus-enemy-slow',
    BonusEnemyFast: 'bonus-enemy-fast',
    BonusEnemyBig: 'bonus-enemy-big',
    BonusEnemyInverse: 'bonus-enemy-inverse',
    BonusEnemyStraightAngle: 'bonus-enemy-straight-angle',
    BonusGameBorderless: 'bonus-game-borderless',
    BonusAllColor:'bonus-all-color',
    BonusGameClear: 'bonus-all-clear'
};

/**
 * Variables names
 *
 * @type {Object}
 */
RoomConfig.prototype.variablesNames = {
    bonusRate: 'Bonus quantity'
};

/**
 * Presets
 *
 * @type {Object}
 */
RoomConfig.prototype.presets = [
    new DefaultPreset(),
    new SpeedPreset(),
    new SizePreset(),
    new SoloPreset(),
    new EmptyPreset()
];

/**
 * Set open
 *
 * @param {String} open
 */
RoomConfig.prototype.setOpen = function(open)
{
    this.open = open;
};

/**
 * Set password
 *
 * @param {String} password
 */
RoomConfig.prototype.setPassword = function(password)
{
    this.password = password;
};

/**
 * Get available bonuses
 *
 * @return {Array}
 */
RoomConfig.prototype.getBonuses = function()
{
    var bonuses = [];

    for (var bonus in this.bonuses) {
        if (this.bonuses[bonus]) {
            bonuses.push(bonus);
        }
    }

    return bonuses.sort();
};

/**
 * Set bonus value
 *
 * @param {String} bonus
 * @param {Boolean} value
 *
 * @return {Boolean}
 */
RoomConfig.prototype.setBonus = function(bonus, value)
{
    BaseRoomConfig.prototype.setBonus.call(this, bonus, value);
    this.checkPresets();
};

/**
 * Check preset
 */
RoomConfig.prototype.checkPresets = function()
{
    var bonuses = this.getBonuses(),
        preset;

    for (var i = this.presets.length - 1; i >= 0; i--) {
        preset = this.presets[i];
        if (this.bonusesMatch(preset.bonuses, bonuses)) {
            this.preset = preset;

            return;
        }
    }

    this.preset = this.customPreset;
};

/**
 * Bonuses match
 *
 * @param {Array} listA
 * @param {Array} listB
 *
 * @return {Boolean}
 */
RoomConfig.prototype.bonusesMatch = function(listA, listB)
{
    if (typeof(listA) !== 'object' || typeof(listA) !== 'object') {
        return false;
    }

    return listA.length === listB.length && listA.sort().toString() === listB.sort().toString();
};

/**
 * IS default preset
 *
 * @return {Boolean}
 */
RoomConfig.prototype.isDefaultPreset = function()
{
    return this.preset === this.getDefaultPreset();
};

/**
 * Get default preset
 *
 * @return {Preset}
 */
RoomConfig.prototype.getDefaultPreset = function()
{
    return this.presets[0];
};

/**
 * Get custom preset
 *
 * @return {CustomPreset}
 */
RoomConfig.prototype.getCustomPreset = function()
{
    return this.customPreset;
};
/**
 * Room list item
 *
 * @param {String} name
 * @param {Number} players
 * @param {Boolean} game
 * @param {Boolean} open
 */
function RoomListItem(name, players, game, open)
{
    this.name     = name;
    this.players  = players;
    this.game     = game;
    this.open     = open;
    this.password = '';
}

/**
 * Get url
 *
 * @return {String}
 */
RoomListItem.prototype.getUrl = function()
{
    return '/room/' + encodeURIComponent(this.name);
};
/**
 * Trail
 */
function Trail(avatar)
{
    BaseTrail.call(this, avatar);

    this.clearAsked = false;
    this.queueX     = null;
    this.queueY     = null;
}

Trail.prototype = Object.create(BaseTrail.prototype);
Trail.prototype.constructor = Trail;

/**
 * Distance tolerance
 *
 * @type {Number}
 */
Trail.prototype.tolerance = 1;

/**
 * Get last segment
 *
 * @return {Array}
 */
Trail.prototype.getLastSegment = function()
{
    var length = this.points.length,
        points = null;

    if (length) {
        points = this.points.slice(0);

        if (this.clearAsked) {
            BaseTrail.prototype.clear.call(this);
            if (this.queueX !== null) {
                BaseTrail.prototype.addPoint.call(this, this.queueX, this.queueY);
                this.queueX = null;
                this.queueY = null;
            }
            this.clearAsked = false;
        } else if(length > 1) {
            this.points.splice(0, length - 1);
        }
    }

    return points;
};

/**
 * Add point
 *
 * @param {Number} x
 * @param {Number} y
 */
Trail.prototype.addPoint = function(x, y)
{
    if (this.lastX !== null && (Math.abs(this.lastX - x) > this.tolerance || Math.abs(this.lastY - y) > this.tolerance)) {
        this.clear();
        this.queueX = x;
        this.queueY = y;
    } else {
        BaseTrail.prototype.addPoint.call(this, x, y);
    }
};

/**
 * Clear
 *
 * @param {Array} point
 */
Trail.prototype.clear = function()
{
    this.clearAsked = true;
};
/**
 * Map Bonus
 *
 * @param {Number} id
 * @param {Number} x
 * @param {Number} y
 * @param {String} type
 * @param {Number} radius
 */
function MapBonus(id, x, y, type)
{
    BaseBonus.call(this, x, y);

    this.id         = id;
    this.asset      = this.assets[type];
    this.animation  = new BounceIn(300);
    this.changed    = true;
    this.drawRadius = 0;
    this.drawWidth  = 0;
    this.drawX      = 0;
    this.drawY      = 0;

    this.update();
}

MapBonus.prototype = Object.create(BaseBonus.prototype);
MapBonus.prototype.constructor = MapBonus;

/**
 * Assets
 *
 * @type {Object}
 */
MapBonus.prototype.assets = BonusManager.prototype.assets;

/**
 * Update bonus for drawing
 */
MapBonus.prototype.update = function()
{
    this.drawRadius = this.radius * this.animation.getValue();
    this.drawWidth  = this.drawRadius * 2;
    this.drawX      = this.x - this.drawRadius;
    this.drawY      = this.y - this.drawRadius;
};
/**
 * Stacked Bonus (for display in avatar's bonus stack)
 *
 * @param {Number} id
 * @param {String} type
 * @param {Number} duration
 */
function StackedBonus(id, type, duration)
{
    EventEmitter.call(this);

    this.id       = id;
    this.duration = duration;
    this.asset    = this.assets[type];
    this.changed  = true;

    this.setEnding     = this.setEnding.bind(this);
    this.toggleOpacity = this.toggleOpacity.bind(this);
}

StackedBonus.prototype = Object.create(EventEmitter.prototype);
StackedBonus.prototype.constructor = StackedBonus;

/**
 * Assets
 *
 * @type {Object}
 */
StackedBonus.prototype.assets = BonusManager.prototype.assets;

/**
 * Opacity
 *
 * @type {Number}
 */
StackedBonus.prototype.opacity = 1;

/**
 * Clear
 */
StackedBonus.prototype.clear = function()
{
    if (this.timeout) {
        this.timeout = clearInterval(this.timeout);
    }
};

/**
 * Set ending timeout
 *
 * @param {Number} warning
 */
StackedBonus.prototype.setEndingTimeout = function(warning)
{
    this.timeout = setTimeout(this.setEnding, this.duration - warning);
};

/**
 * Set ending
 */
StackedBonus.prototype.setEnding = function()
{
    this.timeout = setInterval(this.toggleOpacity, 100);
};

/**
 * Toggle opacity
 */
StackedBonus.prototype.toggleOpacity = function()
{
    this.opacity = this.opacity === 1 ? 0.5 : 1;
    this.changed = true;
    this.emit('change');
};
/**
 * Message
 *
 * @param {Number} creation
 */
function Message (creation)
{
    this.id       = null;
    this.creation = typeof(creation) === 'number' ? new Date(creation) : new Date();
    this.date     = this.getDate();
}

/**
 * Message type
 *
 * @type {String}
 */
Message.prototype.type = 'default';

/**
 * Default color
 *
 * @type {String}
 */
Message.prototype.color = '#75858c';

/**
 * Default name
 *
 * @type {String}
 */
Message.prototype.name = 'Anonymous';

/**
 * Default icon
 *
 * @type {String}
 */
Message.prototype.icon = null;

/**
 * Message max length
 *
 * @type {Number}
 */
Message.prototype.maxLength = 140;

/**
 * Get date to text
 *
 * @return {String}
 */
Message.prototype.getDate = function()
{
    if (!this.creation) { return ''; }

    var hours = this.creation.getHours().toString(),
        minutes = this.creation.getMinutes().toString();

    if (hours.length === 1) {
        hours = '0' + hours;
    }

    if (minutes.length === 1) {
        minutes = '0' + minutes;
    }

    return hours + ':' + minutes;
};
/**
 * Die message
 *
 * @param {Player} deadPlayer
 * @param {Player} killerPlayer
 * @param {Boolean} old
 */
function MessageDie(deadPlayer, killerPlayer, old)
{
    this.deadPlayer   = deadPlayer;
    this.killerPlayer = killerPlayer;
    this.old          = old;
    this.type         = this.resolveType();
}

/**
 * Resolve type
 *
 * @return {String}
 */
MessageDie.prototype.resolveType = function()
{
    if (!this.killerPlayer) {
        return 'wall';
    }

    if (this.deadPlayer.equal(this.killerPlayer)) {
        return 'suicide';
    }

    return this.old ? 'crash' : 'kill';
};
/**
 * Kick message
 *
 * @param {Player} target
 */
function MessageKick (target)
{
    Message.call(this);

    this.target = target;
}

MessageKick.prototype = Object.create(Message.prototype);
MessageKick.prototype.constructor = MessageKick;

/**
 * Message type
 *
 * @type {String}
 */
MessageKick.prototype.type = 'kick';

/**
 * Default icon
 *
 * @type {String}
 */
MessageKick.prototype.icon = 'icon-megaphone';
/**
 * Mute message
 *
 * @param {Number} client
 * @param {Player} player
 */
function MessageMute(client, player)
{
    Message.call(this);

    this.client = client;
    this.player = player;
}

MessageMute.prototype = Object.create(Message.prototype);
MessageMute.prototype.constructor = MessageMute;

/**
 * Message type
 *
 * @type {String}
 */
MessageMute.prototype.type = 'mute';

/**
 * Default icon
 *
 * @type {String}
 */
MessageMute.prototype.icon = 'icon-megaphone';
/**
 * Player Message
 *
 * @param {SocketClient} client
 * @param {String} content
 * @param {Player} player
 * @param {Number} creation
 */
function MessagePlayer(client, content, player, creation)
{
    Message.call(this, creation);

    this.client  = client;
    this.content = content;
    this.player  = player;
}

MessagePlayer.prototype = Object.create(Message.prototype);
MessagePlayer.prototype.constructor = MessagePlayer;

/**
 * Message type
 *
 * @type {String}
 */
MessagePlayer.prototype.type = 'player';

/**
 * Clear message
 */
MessagePlayer.prototype.clear = function()
{
    this.content = '';
};

/**
 * Room master message
 *
 * @param {SocketClient} client
 */
function MessageRoomMaster(client)
{
    Message.call(this);

    this.client = client;
    this.target = this.getPlayer();
}

MessageRoomMaster.prototype = Object.create(Message.prototype);
MessageRoomMaster.prototype.constructor = MessageRoomMaster;

/**
 * Message type
 *
 * @type {String}
 */
MessageRoomMaster.prototype.type = 'room-master';

/**
 * Default icon
 *
 * @type {String}
 */
MessageRoomMaster.prototype.icon = 'icon-megaphone';

/**
 * Get target
 *
 * @return {Player}
 */
MessageRoomMaster.prototype.getTarget = function()
{
    var player = this.getPlayer();

    return player ? player : this.target;
};

/**
 * Get player
 *
 * @return {Player}
 */
MessageRoomMaster.prototype.getPlayer = function()
{
    return this.client.players.getFirst();
};
/**
 * Tip message
 */
function MessageTip()
{
    Message.call(this);

    this.content = this.tips[Math.floor(Math.random() * this.tips.length)];
}

MessageTip.prototype = Object.create(Message.prototype);
MessageTip.prototype.constructor = MessageTip;

/**
 * Message type
 *
 * @type {String}
 */
MessageTip.prototype.type = 'tip';

/**
 * Default icon
 *
 * @type {String}
 */
MessageTip.prototype.icon = 'icon-megaphone';

/**
 * Tips
 *
 * @type {Array}
 */
MessageTip.prototype.tips = [
    'To customize your left/right controls, click the [←]/[→] buttons and press any key.',
    'Curvytron supports gamepads! Connect it, press A, then setup your controls.',
    'Yes, you can play Curvytron on your smartphone ;)',
    'You can add multiple players on the same computer.',
    'Green bonuses apply only to you.',
    'Red bonuses target your enemies.',
    'White bonuses affect everyone.',
    'Making a Snail™ is a sure way to win, but other players might hate you for it.',
    'The Enrichment Center regrets to inform you that this next test is impossible. Make no attempt to solve it.'
];
/**
 * New Kick vote message
 *
 * @param {Player} target
 */
function MessageVoteKick(target)
{
    Message.call(this);

    this.target = target;
}

MessageVoteKick.prototype = Object.create(Message.prototype);
MessageVoteKick.prototype.constructor = MessageVoteKick;

/**
 * Message type
 *
 * @type {String}
 */
MessageVoteKick.prototype.type = 'vote-kick';

/**
 * Default icon
 *
 * @type {String}
 */
MessageVoteKick.prototype.icon = 'icon-megaphone';
/**
 * Custom Preset
 */
function CustomPreset ()
{
    Preset.call(this);
}

CustomPreset.prototype = Object.create(Preset.prototype);
CustomPreset.prototype.constructor = CustomPreset;

/**
 * Name
 *
 * @type {String}
 */
CustomPreset.prototype.name = 'Custom';
/**
 * Default Preset
 */
function DefaultPreset ()
{
    Preset.call(this);
}

DefaultPreset.prototype = Object.create(Preset.prototype);
DefaultPreset.prototype.constructor = DefaultPreset;

/**
 * Name
 *
 * @type {String}
 */
DefaultPreset.prototype.name = 'All';

/**
 * Bonuses
 *
 * @type {Array}
 */
DefaultPreset.prototype.bonuses = [
    'BonusSelfSmall',
    'BonusSelfSlow',
    'BonusSelfFast',
    'BonusSelfMaster',
    'BonusEnemySlow',
    'BonusEnemyFast',
    'BonusEnemyBig',
    'BonusEnemyInverse',
    'BonusEnemyStraightAngle',
    'BonusGameBorderless',
    'BonusAllColor',
    'BonusGameClear'
];
/**
 * Empty Preset
 */
function EmptyPreset ()
{
    Preset.call(this);
}

EmptyPreset.prototype = Object.create(Preset.prototype);
EmptyPreset.prototype.constructor = EmptyPreset;

/**
 * Name
 *
 * @type {String}
 */
EmptyPreset.prototype.name = 'No bonuses';
/**
 * Size Preset
 */
function SizePreset ()
{
    Preset.call(this);
}

SizePreset.prototype = Object.create(Preset.prototype);
SizePreset.prototype.constructor = SizePreset;

/**
 * Name
 *
 * @type {String}
 */
SizePreset.prototype.name = 'Super size me';

/**
 * Bonuses
 *
 * @type {Array}
 */
SizePreset.prototype.bonuses = [
    'BonusEnemyBig'
];
/**
 * Solo Preset
 */
function SoloPreset ()
{
    Preset.call(this);
}

SoloPreset.prototype = Object.create(Preset.prototype);
SoloPreset.prototype.constructor = SoloPreset;

/**
 * Name
 *
 * @type {String}
 */
SoloPreset.prototype.name = 'Solo';

/**
 * Bonuses
 *
 * @type {Array}
 */
SoloPreset.prototype.bonuses = [
    'BonusSelfSmall',
    'BonusSelfSlow',
    'BonusSelfFast',
    'BonusSelfMaster',
    'BonusGameBorderless',
    'BonusGameClear'
];
/**
 * Speed Preset
 */
function SpeedPreset ()
{
    Preset.call(this);
}

SpeedPreset.prototype = Object.create(Preset.prototype);
SpeedPreset.prototype.constructor = SpeedPreset;

/**
 * Name
 *
 * @type {String}
 */
SpeedPreset.prototype.name = 'Speed of light';

/**
 * Bonuses
 *
 * @type {Array}
 */
SpeedPreset.prototype.bonuses = [
    'BonusSelfFast',
    'BonusEnemyFast'
];
/**
 * GameRepository
 *
 * @param {SocketClient} client
 * @param {RoomRepository} parent
 * @param {SoundManager} sound
 * @param {Notifier} notifier
 */
function GameRepository(client, parent, sound, notifier)
{
    EventEmitter.call(this);

    this.client     = client;
    this.parent     = parent;
    this.sound      = sound;
    this.compressor = new Compressor();
    this.game       = null;

    this.start        = this.start.bind(this);
    this.stop         = this.stop.bind(this);
    this.draw         = this.draw.bind(this);
    this.onGameStart  = this.onGameStart.bind(this);
    this.onGameStop   = this.onGameStop.bind(this);
    this.onBonusPop   = this.onBonusPop.bind(this);
    this.onBonusClear = this.onBonusClear.bind(this);
    this.onBonusStack = this.onBonusStack.bind(this);
    this.onPosition   = this.onPosition.bind(this);
    this.onAngle      = this.onAngle.bind(this);
    this.onPoint      = this.onPoint.bind(this);
    this.onDie        = this.onDie.bind(this);
    this.onProperty   = this.onProperty.bind(this);
    this.onRoundNew   = this.onRoundNew.bind(this);
    this.onRoundEnd   = this.onRoundEnd.bind(this);
    this.onClear      = this.onClear.bind(this);
    this.onBorderless = this.onBorderless.bind(this);
    this.onEnd        = this.onEnd.bind(this);
    this.onLeave      = this.onLeave.bind(this);
    this.onSpectate   = this.onSpectate.bind(this);
}

GameRepository.prototype = Object.create(EventEmitter.prototype);
GameRepository.prototype.constructor = GameRepository;

/**
 * Start
 */
GameRepository.prototype.start = function()
{
    if (this.parent.room) {
        this.game = this.parent.room.game;
        this.attachEvents();
        this.attachIdleEvents();
    }
};

/**
 * Pause
 */
GameRepository.prototype.stop = function()
{
    this.detachEvents();
    this.detachIdleEvents();
    this.game = null;
};

/**
 * Attach events
 */
GameRepository.prototype.attachEvents = function()
{
    this.client.on('game:start', this.onGameStart);
    this.client.on('game:stop', this.onGameStop);
    this.client.on('property', this.onProperty);
    this.client.on('position', this.onPosition);
    this.client.on('angle', this.onAngle);
    this.client.on('point', this.onPoint);
    this.client.on('die', this.onDie);
    this.client.on('bonus:pop', this.onBonusPop);
    this.client.on('bonus:clear', this.onBonusClear);
    this.client.on('bonus:stack', this.onBonusStack);
    this.client.on('round:new', this.onRoundNew);
    this.client.on('round:end', this.onRoundEnd);
    this.client.on('clear', this.onClear);
    this.client.on('borderless', this.onBorderless);
    this.client.on('end', this.onEnd);
    this.client.on('game:leave', this.onLeave);
    this.client.on('spectate', this.onSpectate);
};

/**
 * Attach events
 */
GameRepository.prototype.detachEvents = function()
{
    this.client.off('game:start', this.onGameStart);
    this.client.off('game:stop', this.onGameStop);
    this.client.off('property', this.onProperty);
    this.client.off('position', this.onPosition);
    this.client.off('angle', this.onAngle);
    this.client.off('point', this.onPoint);
    this.client.off('die', this.onDie);
    this.client.off('bonus:pop', this.onBonusPop);
    this.client.off('bonus:clear', this.onBonusClear);
    this.client.off('bonus:stack', this.onBonusStack);
    this.client.off('round:new', this.onRoundNew);
    this.client.off('round:end', this.onRoundEnd);
    this.client.off('clear', this.onClear);
    this.client.off('borderless', this.onBorderless);
    this.client.off('end', this.onEnd);
    this.client.off('game:leave', this.onLeave);
    this.client.off('spectate', this.onSpectate);
};

/**
 * Attach idle events
 */
GameRepository.prototype.attachIdleEvents = function()
{
    this.client.on('property', this.draw);
    this.client.on('position', this.draw);
    this.client.on('angle', this.draw);
};


/**
 * Detach idle events
 */
GameRepository.prototype.detachIdleEvents = function()
{
    this.client.off('property', this.draw);
    this.client.off('position', this.draw);
    this.client.off('angle', this.draw);
};

/**
 * Draw
 */
GameRepository.prototype.draw = function()
{
    if (!this.game.frame) {
        this.game.repaint();
    }
};

/**
 * On game start
 *
 * @param {Event} e
 */
GameRepository.prototype.onGameStart = function(e)
{
    this.game.start();
    this.detachIdleEvents();
    this.emit('game:start');
};

/**
 * On game stop
 *
 * @param {Event} e
 */
GameRepository.prototype.onGameStop = function(e)
{
    this.game.stop();
    this.attachIdleEvents();
    this.emit('game:stop');
};

/**
 * On property
 *
 * @param {Event} e
 */
GameRepository.prototype.onProperty = function(e)
{
    var data   = e.detail,
        avatar = this.game.avatars.getById(data[0]);

    if (avatar) {
        avatar.set(data[1], data[2]);
    }
};

/**
 * On position
 *
 * @param {Event} e
 */
GameRepository.prototype.onPosition = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.setPositionFromServer(
            this.compressor.decompress(e.detail[1]),
            this.compressor.decompress(e.detail[2])
        );
    }
};

/**
 * On point
 *
 * @param {Event} e
 */
GameRepository.prototype.onPoint = function(e)
{
    var avatar = this.game.avatars.getById(e.detail);

    if (avatar) {
        avatar.addPoint(avatar.x, avatar.y);
    }
};

/**
 * On angle
 *
 * @param {Event} e
 */
GameRepository.prototype.onAngle = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.setAngle(this.compressor.decompress(e.detail[1]));
    }
};

/**
 * On die
 *
 * @param {Event} e
 */
GameRepository.prototype.onDie = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.die();
        this.sound.play('death');
    }
};

/**
 * On bonus pop
 *
 * @param {Event} e
 */
GameRepository.prototype.onBonusPop = function(e)
{
    var bonus = new MapBonus(
        e.detail[0],
        this.compressor.decompress(e.detail[1]),
        this.compressor.decompress(e.detail[2]),
        e.detail[3]
    );

    this.game.bonusManager.add(bonus);
    this.sound.play('bonus-pop');
};

/**
 * On bonus clear
 *
 * @param {Event} e
 */
GameRepository.prototype.onBonusClear = function(e)
{
    var bonus = this.game.bonusManager.bonuses.getById(e.detail);

    if (bonus) {
        this.game.bonusManager.remove(bonus);
        this.sound.play('bonus-clear');
    }
};

/**
 * On bonus stack
 *
 * @param {Event} e
 */
GameRepository.prototype.onBonusStack = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar && avatar.local) {
        avatar.bonusStack[e.detail[1]](new StackedBonus(e.detail[2], e.detail[3], e.detail[4]));
    }
};

/**
 * On round new
 *
 * @param {Event} e
 */
GameRepository.prototype.onRoundNew = function(e)
{
    this.game.newRound();
    this.emit('round:new');
};

/**
 * On round new
 *
 * @param {Event} e
 */
GameRepository.prototype.onRoundEnd = function(e)
{
    this.game.endRound();
    this.game.roundWinner = e.detail ? this.game.avatars.getById(e.detail) : null;
    this.emit('round:end');
};

/**
 * On clear
 *
 * @param {Event} e
 */
GameRepository.prototype.onClear = function(e)
{
    this.game.clearTrails();
};

/**
 * On borderless
 *
 * @param {Event} e
 */
GameRepository.prototype.onBorderless = function(e)
{
    this.game.setBorderless(e.detail);
    this.emit('borderless');
};

/**
 * On game end
 *
 * @param {Event} e
 */
GameRepository.prototype.onEnd = function(e)
{
    this.game.end();
    this.sound.play('win');
    this.emit('end');
};

/**
 * On leave
 *
 * @param {Event} e
 */
GameRepository.prototype.onLeave = function(e)
{
    var avatar = this.game.avatars.getById(e.detail);

    if (avatar) {
        this.game.removeAvatar(avatar);
    }
};

/**
 * On spectate
 */
GameRepository.prototype.onSpectate = function(e)
{
    var data = e.detail;

    this.game.maxScore = data.maxScore;

    for (var i = this.game.avatars.items.length - 1; i >= 0; i--) {
        this.game.avatars.items[i].local = true;
        this.game.avatars.items[i].ready = true;
    }

    if (data.inRound) {
        if (data.rendered) {
            this.game.newRound(0);
        } else {
            this.game.newRound();
        }
    } else {
        this.game.start();
    }

    this.emit('spectate');
};
/**
 * RoomRepository
 *
 * @param {SocketCLient} client
 */
function RoomRepository(client)
{
    EventEmitter.call(this);

    this.client      = client;
    this.room        = null;
    this.master      = null;
    this.clients     = new Collection();
    this.playerCache = new Collection();

    this.start            = this.start.bind(this);
    this.onClientAdd      = this.onClientAdd.bind(this);
    this.onClientRemove   = this.onClientRemove.bind(this);
    this.onRoomMaster     = this.onRoomMaster.bind(this);
    this.onJoinRoom       = this.onJoinRoom.bind(this);
    this.onLeaveRoom      = this.onLeaveRoom.bind(this);
    this.onGameStart      = this.onGameStart.bind(this);
    this.onPlayerReady    = this.onPlayerReady.bind(this);
    this.onPlayerColor    = this.onPlayerColor.bind(this);
    this.onPlayerName     = this.onPlayerName.bind(this);
    this.onConfigOpen     = this.onConfigOpen.bind(this);
    this.onConfigMaxScore = this.onConfigMaxScore.bind(this);
    this.onConfigVariable = this.onConfigVariable.bind(this);
    this.onConfigBonus    = this.onConfigBonus.bind(this);
    this.onKick           = this.onKick.bind(this);
    this.onVote           = this.onVote.bind(this);
    this.onClientActivity = this.onClientActivity.bind(this);
    this.forwardEvent     = this.forwardEvent.bind(this);
}

RoomRepository.prototype = Object.create(EventEmitter.prototype);
RoomRepository.prototype.constructor = RoomRepository;

/**
 * Attach events
 */
RoomRepository.prototype.attachEvents = function()
{
    this.client.on('client:add', this.onClientAdd);
    this.client.on('client:remove', this.onClientRemove);
    this.client.on('room:master', this.onRoomMaster);
    this.client.on('room:join', this.onJoinRoom);
    this.client.on('room:leave', this.onLeaveRoom);
    this.client.on('room:game:start', this.onGameStart);
    this.client.on('player:ready', this.onPlayerReady);
    this.client.on('player:color', this.onPlayerColor);
    this.client.on('player:name', this.onPlayerName);
    this.client.on('room:config:open', this.onConfigOpen);
    this.client.on('room:config:max-score', this.onConfigMaxScore);
    this.client.on('room:config:variable', this.onConfigVariable);
    this.client.on('room:config:bonus', this.onConfigBonus);
    this.client.on('room:launch:start', this.forwardEvent);
    this.client.on('room:launch:cancel', this.forwardEvent);
    this.client.on('room:kick', this.onKick);
    this.client.on('vote:new', this.onVote);
    this.client.on('vote:close', this.onVote);
    this.client.on('client:activity', this.onClientActivity);
};

/**
 * Attach events
 */
RoomRepository.prototype.detachEvents = function()
{
    this.client.off('client:add', this.onClientAdd);
    this.client.off('client:remove', this.onClientRemove);
    this.client.off('room:master', this.onRoomMaster);
    this.client.off('room:join', this.onJoinRoom);
    this.client.off('room:leave', this.onLeaveRoom);
    this.client.off('room:game:start', this.onGameStart);
    this.client.off('player:ready', this.onPlayerReady);
    this.client.off('player:color', this.onPlayerColor);
    this.client.off('player:name', this.onPlayerName);
    this.client.off('room:config:open', this.onConfigOpen);
    this.client.off('room:config:max-score', this.onConfigMaxScore);
    this.client.off('room:config:variable', this.onConfigVariable);
    this.client.off('room:config:bonus', this.onConfigBonus);
    this.client.off('room:launch:start', this.forwardEvent);
    this.client.off('room:launch:cancel', this.forwardEvent);
    this.client.off('room:kick', this.onKick);
    this.client.off('vote:new', this.onVote);
    this.client.off('vote:close', this.onVote);
    this.client.off('client:activity', this.onClientActivity);
};

/**
 * Join room
 *
 * @param {String} name
 * @param {String} password
 * @param {Function} callback
 */
RoomRepository.prototype.join = function(name, password, callback)
{
    var repository = this;

    if (this.room && this.room.name === name) {
        return callback({success: true, room: repository.room});
    }

    this.client.addEvent('room:join', {name: name, password: password}, function (result) {
        if (result.success) {
            var clients  = repository.createClients(result.clients),
                master   = clients.getById(result.master),
                room     = repository.createRoom(result.room, clients),
                messages = result.messages.length;

            repository.setRoom(room, clients, master);
            callback({success: true, room: room});

            for (var m = 0; m < messages; m++) {
                repository.client.emit('room:talk', result.messages[m]);
            }

            for (var v = result.votes.length - 1; v >= 0; v--) {
                repository.client.emit('vote:new', result.votes[v]);
            }
        } else {
            callback({
                success: false,
                name: name,
                error: typeof(result.error) !== 'undefined' ? result.error : 'Unknown error'
            });
        }
    });
};

/**
 * Create clients
 *
 * @param {Array} data
 *
 * @return {return}
 */
RoomRepository.prototype.createClients = function(data)
{
    var clients = new Collection();

    for (var i = data.length - 1; i >= 0; i--) {
        clients.add(new Client(data[i].id, data[i].active));
    }

    return clients;
};

/**
 * Create room rom server data
 *
 * @param {Object} data
 * @param {Collection} clients
 *
 * @return {Room}
 */
RoomRepository.prototype.createRoom = function(data, clients)
{
    var room = new Room(data.name),
        length = data.players.length;

    for (var client, i =  0; i < length; i++) {
        client = clients.getById(data.players[i].client);

        if (client) {
            room.addPlayer(new Player(
                data.players[i].id,
                client,
                data.players[i].name,
                data.players[i].color,
                data.players[i].ready
            ));
        } else {
            console.error('Could not find a client:', data.players[i].client, clients);
        }
    }

    room.config.setOpen(data.config.open);
    room.config.setPassword(data.config.password);
    room.config.setMaxScore(data.config.maxScore);

    for (var variable in data.config.variables) {
        if (data.config.variables.hasOwnProperty(variable)) {
            room.config.setVariable(variable, data.config.variables[variable]);
        }
    }

    for (var bonus in data.config.bonuses) {
        if (data.config.bonuses.hasOwnProperty(bonus)) {
            room.config.setBonus(bonus, data.config.bonuses[bonus]);
        }
    }

    return room;
};

/**
 * Set current room
 *
 * @param {Room} room
 * @param {Collection} clients
 * @param {Client} master
 */
RoomRepository.prototype.setRoom = function(room, clients, master)
{
    if (!this.room || !this.room.equal(room)) {
        this.room    = room;
        this.clients = clients;
        this.emit(this.room ? 'room:join': 'room:leave');
        this.setRoomMaster(master);
    }
};

/**
 * Set room master
 *
 * @param {Client} master
 */
RoomRepository.prototype.setRoomMaster = function(master)
{
    if (this.master) {
        this.master.setMaster(false);
    }

    this.master = master;

    if (this.master) {
        this.master.setMaster(true);
    }

    this.emit('room:master', {master: this.master});
};

/**
 * Am I the room master?
 *
 * @return {Boolean}
 */
RoomRepository.prototype.amIMaster = function()
{
    var client = this.clients.getById(this.client.id);

    return client && client.master;
};

/**
 * Add player
 *
 * @param {String} name
 * @param {Function} callback
 */
RoomRepository.prototype.addPlayer = function(name, color, callback)
{
    this.client.addEvent('player:add', {
        name: name.substr(0, Player.prototype.maxLength),
        color: color ? color.substr(0, Player.prototype.colorMaxLength) : null
    }, callback);
};

/**
 * Remove player
 *
 * @param {Player} player
 * @param {Function} callback
 */
RoomRepository.prototype.removePlayer = function(player, callback)
{
    this.client.addEvent('player:remove', {player: player.id}, callback);
};

/**
 * Kick player
 *
 * @param {Player} player
 * @param {Function} callback
 */
RoomRepository.prototype.kickPlayer = function(player, callback)
{
    this.client.addEvent('player:kick', { player: player.id },
        function (result) {
            player.kicked = result.kicked;
            callback(result);
        }
    );
};

/**
 * Leave
 *
 * @param {Function} callback
 */
RoomRepository.prototype.leave = function()
{
    this.client.addEvent('room:leave');
    this.stop();
    this.emit('room:leave');
};

/**
 * Set color
 *
 * @param {Room} room
 * @param {Number} player
 * @param {String} color
 * @param {Function} callback
 */
RoomRepository.prototype.setColor = function(player, color, callback)
{
    this.client.addEvent('room:color', {
        player: player.id,
        color: color.substr(0, Player.prototype.colorMaxLength)
    }, function (result) {
        if (!result.success) {
            console.error('Could not set color %s for player %s', player.color, player.name);
        }
        player.color = result.color;
        callback(result);
    });
};

/**
 * Set name
 *
 * @param {Room} room
 * @param {Number} player
 * @param {String} name
 * @param {Function} callback
 */
RoomRepository.prototype.setName = function(player, name, callback)
{
    name = name.substr(0, Player.prototype.nameMaxLength).trim();

    if (name !== player.name) {
        this.client.addEvent('room:name', {player: player, name: name}, callback);
    }
};

/**
 * Set ready
 *
 * @param {Room} room
 * @param {Number} player
 * @param {Function} callback
 */
RoomRepository.prototype.setReady = function(player, callback)
{
    this.client.addEvent('room:ready', {player: player}, callback);
};

/**
 * Set config open
 *
 * @param {Boolean} open
 * @param {Function} callback
 */
RoomRepository.prototype.setConfigOpen = function(open, callback)
{
    this.client.addEvent('room:config:open', {open: open ? true : false}, callback);
};

/**
 * Set config max score
 *
 * @param {Number} maxScore
 * @param {Function} callback
 */
RoomRepository.prototype.setConfigMaxScore = function(maxScore, callback)
{
    this.client.addEvent('room:config:max-score', {maxScore: parseInt(maxScore, 10)}, callback);
};

/**
 * Set config speed
 *
 * @param {Number} speed
 * @param {Function} callback
 */
RoomRepository.prototype.setConfigVariable = function(variable, value, callback)
{
    this.client.addEvent('room:config:variable', {variable: variable, value: parseFloat(value)}, callback);
};

/**
 * Set config bonus
 *
 * @param {String} bonus
 * @param {Function} callback
 */
RoomRepository.prototype.setConfigBonus = function(bonus, callback)
{
    this.client.addEvent('room:config:bonus', {bonus: bonus}, callback);
};

/**
 * Launch
 */
RoomRepository.prototype.launch = function()
{
    this.client.addEvent('room:launch');
};

// EVENTS:

/**
 * On client add
 *
 * @param {Object} e
 */
RoomRepository.prototype.onClientAdd = function(e)
{
    this.clients.add(new Client(e.detail));
};

/**
 * On client remove
 *
 * @param {Object} e
 */
RoomRepository.prototype.onClientRemove = function(e)
{
    this.clients.removeById(e.detail);
};

/**
 * On join room
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomRepository.prototype.onJoinRoom = function(e)
{
    var data   = e.detail,
        player = new Player(
            data.player.id,
            this.clients.getById(data.player.client),
            data.player.name,
            data.player.color,
            data.player.ready
        );

    if (this.room.addPlayer(player)) {
        this.emit('player:join', {player: player});
    }
};

/**
 * On leave room
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomRepository.prototype.onLeaveRoom = function(e)
{
    var player = this.room.players.getById(e.detail.player);

    if (player && this.room.removePlayer(player)) {
        this.playerCache.add(player);
        this.emit('player:leave', {player: player});
    }
};

/**
 * On client changes activity
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomRepository.prototype.onClientActivity = function(e)
{
    var client = this.clients.getById(e.detail.client);

    if (client) {
        client.active = e.detail.active;
        this.emit('client:activity', {client: client, active: client.active});
    }
};

/**
 * On player change color
 *
 * @param {Event} e
 */
RoomRepository.prototype.onPlayerColor = function(e)
{
    var data = e.detail,
        player = this.room.players.getById(data.player);

    if (player) {
        player.setColor(data.color);
        this.emit('player:color', {player: player});
    }
};

/**
 * On player change name
 *
 * @param {Event} e
 */
RoomRepository.prototype.onPlayerName = function(e)
{
    var data = e.detail,
        player = this.room.players.getById(data.player);

    if (player) {
        player.setName(data.name);
        this.emit('player:name', {player: player});
    }
};

/**
 * On player toggle ready
 *
 * @param {Event} e
 */
RoomRepository.prototype.onPlayerReady = function(e)
{
    var data = e.detail,
        player = this.room.players.getById(data.player);

    if (player) {
        player.toggleReady(data.ready);
        this.emit('player:ready', {player: player});
    }
};

/**
 * On game master
 *
 * @param {Event} e
 */
RoomRepository.prototype.onRoomMaster = function(e)
{
    var master = this.clients.getById(e.detail.client);

    if (master) {
        this.setRoomMaster(master);
    }
};

/**
 * On config open
 *
 * @param {Event} e
 */
RoomRepository.prototype.onConfigOpen = function(e)
{
    var data = e.detail;

    this.room.config.setOpen(data.open);
    this.room.config.setPassword(data.password);

    this.emit('room:config:open', {open: data.open, password: data.password});
};

/**
 * On config max score
 *
 * @param {Event} e
 */
RoomRepository.prototype.onConfigMaxScore = function(e)
{
    var data = e.detail;

    this.room.config.setMaxScore(data.maxScore);
    this.emit('config:max-score', {maxScore: data.maxScore});
};

/**
 * On config variable
 *
 * @param {Event} e
 */
RoomRepository.prototype.onConfigVariable = function(e)
{
    var data = e.detail;

    this.room.config.setVariable(data.variable, data.value);
    this.emit('config:variable', {variable: data.variable, value: data.value});
};

/**
 * On config bonus
 *
 * @param {Event} e
 */
RoomRepository.prototype.onConfigBonus = function(e)
{
    var data = e.detail;

    this.room.config.setBonus(data.bonus, data.enabled);
    this.emit('config:bonus', {bonus: data.bonus, enabled: data.enabled});
};

/**
 * On room game start
 *
 * @param {Event} e
 */
RoomRepository.prototype.onGameStart = function(e)
{
    this.room.newGame();
    this.emit('room:game:start');
};

/**
 * On vote
 *
 * @param {Event} e
 */
RoomRepository.prototype.onVote = function(e)
{
    var player = this.room.players.getById(e.detail.target);

    if (!player) {
        player = this.playerCache.getById(e.detail.target);
    }

    if (player) {
        player.vote = e.type === 'vote:new';
        this.emit(e.type, {target: player, result: e.detail.result});
    }
};

/**
 * On kick
 *
 * @param {Event} e
 */
RoomRepository.prototype.onKick = function(e)
{
    var player = this.room.players.getById(e.detail);

    if (!player) {
        player = this.playerCache.getById(e.detail);
    }

    if (player) {
        this.emit(e.type, player);
    }
};

/**
 * Forward event
 *
 * @param {Event} e
 */
RoomRepository.prototype.forwardEvent = function(e)
{
    this.emit(e.type, e.detail);
};

/**
 * Start
 */
RoomRepository.prototype.start = function()
{
    if (this.client.connected) {
        this.attachEvents();
    } else {
        this.client.on('connected', this.start);
    }
};

/**
 * Pause
 */
RoomRepository.prototype.stop = function()
{
    this.detachEvents();
    this.playerCache.clear();
    this.setRoom(null, new Collection(), null);
};
/**
 * RoomsRepository
 *
 * @param {SocketCLient} client
 */
function RoomsRepository(client)
{
    EventEmitter.call(this);

    this.client = client;
    this.rooms  = new Collection([], 'name');

    this.start            = this.start.bind(this);
    this.onRoomOpen       = this.onRoomOpen.bind(this);
    this.onRoomClose      = this.onRoomClose.bind(this);
    this.onRoomPlayers    = this.onRoomPlayers.bind(this);
    this.onRoomGame       = this.onRoomGame.bind(this);
    this.onRoomConfigOpen = this.onRoomConfigOpen.bind(this);
}

RoomsRepository.prototype = Object.create(EventEmitter.prototype);
RoomsRepository.prototype.constructor = RoomsRepository;

/**
 * Attach events
 */
RoomsRepository.prototype.attachEvents = function()
{
    this.client.on('room:open', this.onRoomOpen);
    this.client.on('room:close', this.onRoomClose);
    this.client.on('room:players', this.onRoomPlayers);
    this.client.on('room:game', this.onRoomGame);
    this.client.on('room:config:open', this.onRoomConfigOpen);
};

/**
 * Attach events
 */
RoomsRepository.prototype.detachEvents = function()
{
    this.client.off('room:open', this.onRoomOpen);
    this.client.off('room:close', this.onRoomClose);
    this.client.off('room:players', this.onRoomPlayers);
    this.client.off('room:game', this.onRoomGame);
    this.client.off('room:config:open', this.onRoomConfigOpen);
};

/**
 * Get all
 *
 * @return {Array}
 */
RoomsRepository.prototype.all = function()
{
    return this.rooms;
};

/**
 * Get all
 *
 * @return {Array}
 */
RoomsRepository.prototype.get = function(name)
{
    return this.rooms.getById(name);
};

/**
 * Create
 *
 * @param {String} name
 * @param {Function} callback
 */
RoomsRepository.prototype.create = function(name, callback)
{
    if (typeof(name) === 'string') {
        name = name.substr(0, Room.prototype.maxLength).trim();
    }

    this.client.addEvent('room:create', {name: name}, callback);
};

/**
 * Create room proxy object from data
 *
 * @param {Object} data
 *
 * @return {Object}
 */
RoomsRepository.prototype.createRoom = function(data)
{
    return new RoomListItem(data.name, data.players,  data.game, data.open);
};

// EVENTS:

/**
 * On room open
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomOpen = function(e)
{
    var room = this.createRoom(e.detail);

    if(this.rooms.add(room)) {
        this.emit('room:open', {room: room});
    }
};

/**
 * On close room
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomClose = function(e)
{
    var room = this.get(e.detail.name);

    if(room && this.rooms.remove(room)) {
        this.emit('room:close', room);
    }
};

/**
 * On room config open change
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomConfigOpen = function(e)
{
    var room = this.get(e.detail.name);

    if(room) {
        room.open = e.detail.open;
        this.emit('room:config:open', room);
    }
};

/**
 * On room players change
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomPlayers = function(e)
{
    var room = this.get(e.detail.name);

    if(room) {
        room.players = e.detail.players;
        this.emit('room:players', room);
    }
};

/**
 * On room game change
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomsRepository.prototype.onRoomGame = function(e)
{
    var room = this.get(e.detail.name);

    if(room) {
        room.game = e.detail.game;
        this.emit('room:game', room);
    }
};

/**
 * Start
 */
RoomsRepository.prototype.start = function()
{
    if (this.client.connected) {
        this.attachEvents();
        this.client.addEvent('room:fetch');
    } else {
        this.client.on('connected', this.start);
    }
};

/**
 * Pause
 */
RoomsRepository.prototype.stop = function()
{
    this.detachEvents();
    this.rooms.clear();
};
/**
 * Activity watcher
 */
function ActivityWatcher(client)
{
    this.client       = client;
    this.focused      = true;
    this.active       = true;
    this.lastActivity = new Date().getTime();
    this.interval     = null;

    this.onFocus         = this.onFocus.bind(this);
    this.onBlur          = this.onBlur.bind(this);
    this.checkInactivity = this.checkInactivity.bind(this);

    window.addEventListener('focus', this.onFocus);
    window.addEventListener('mousemove', this.onFocus);
    window.addEventListener('click', this.onFocus);
    window.addEventListener('keypress', this.onFocus);
    gamepadListener.addEventListener('gamepad:axis', this.onFocus);
    gamepadListener.addEventListener('gamepad:button', this.onFocus);
    window.addEventListener('blur', this.onBlur);

    this.interval = setInterval(this.checkInactivity, this.checkInterval);
}

/**
 * Tolerated time away from keyboard
 *
 * @type {Number}
 */
ActivityWatcher.prototype.tolerance = 60000;

/**
 * Activity check interval
 *
 * @type {Number}
 */
ActivityWatcher.prototype.checkInterval = 10000;

/**
 * Set active
 *
 * @param {Boolean} active
 */
ActivityWatcher.prototype.setActive = function(active)
{
    active = active ? true : false;

    if (active) {
        this.lastActivity = new Date().getTime();
    }

    if (this.active !== active) {
        this.active = active;
        this.client.addEvent('activity', this.active);

        if (this.active) {
            this.interval = setInterval(this.checkInactivity, this.checkInterval);
        } else {
            clearInterval(this.interval);
        }
    }
};

/**
 * Set focused
 *
 * @param {Boolean} focused
 */
ActivityWatcher.prototype.setFocused = function(focused)
{
    if (this.focused !== focused) {
        this.focused = focused;
    }
};

/**
 * On focus
 *
 * @param {Event} event
 */
ActivityWatcher.prototype.onFocus = function(event)
{
    this.setFocused(true);
    this.setActive(true);
};

/**
 * On blur
 *
 * @param {Event} event
 */
ActivityWatcher.prototype.onBlur = function(event)
{
    this.setFocused(false);
};

/**
 * Is active?
 *
 * @return {Boolean}
 */
ActivityWatcher.prototype.isActive = function()
{
    return this.active;
};

/**
 * Is focused?
 *
 * @return {Boolean}
 */
ActivityWatcher.prototype.isFocused = function()
{
    return this.focused;
};

/**
 * Check inactivity
 */
ActivityWatcher.prototype.checkInactivity = function()
{
    var inactivity = new Date().getTime() - this.lastActivity;

    if (inactivity > this.tolerance) {
        this.setActive(false);
    }
};
/**
 * Analyser
 *
 * @param {Object} $rootScope
 */
function Analyser($rootScope)
{
    if (typeof(ga) === 'undefined') {
        return false;
    }

    this.$rootScope = $rootScope;

    this.onRouteChange = this.onRouteChange.bind(this);

    this.$rootScope.$on('$routeChangeSuccess', this.onRouteChange);
    this.$rootScope.$on('$routeUpdate', this.onRouteChange);
}

/**
 * On route changed
 *
 * @param {Event} event
 * @param {Object} currentScope
 * @param {Object} previousScope
 */
Analyser.prototype.onRouteChange = function(event, currentScope, previousScope)
{
    var path  = this.getPath(currentScope.originalPath, currentScope.pathParams),
        title = this.getTitle(currentScope.$$route.controller, currentScope.params);

    this.sendPageView(path, title);
};

/**
 * Get path
 *
 * @param {String} path
 * @param {Object} params
 *
 * @return {String}
 */
Analyser.prototype.getPath = function(path, params)
{
    for (var key in params) {
        if (Object.hasOwnProperty(key)) {
            path = path.replace(':' + key, params[key]);
        }
    }

    return path;
};

/**
 * Get title
 *
 * @param {String} controller
 * @param {Object} params
 *
 * @return {String}
 */
Analyser.prototype.getTitle = function(controller, params)
{
    if (controller === 'RoomsController') {
        return 'Home';
    }

    if (controller === 'RoomController') {
        return 'Room: ' + (typeof(params.name) !== 'undefined' ? params.name : null);
    }

    if (controller === 'GameController') {
        return 'Game: ' + (typeof(params.name) !== 'undefined' ? params.name : null);
    }
};

/**
 * Send page view
 *
 * @param {Object} data
 */
Analyser.prototype.sendPageView = function(page, title)
{
    ga('send', 'pageview', {page: page, title: title});
};
/**
 * Chat system
 *
 * @param {SocketClient} client
 * @param {RoomRepository} repository
 */
function Chat(client, repository)
{
    BaseChat.call(this);

    this.messages.index = false;

    this.client     = client;
    this.repository = repository;
    this.message    = new MessagePlayer(this.client);
    this.room       = null;
    this.element    = null;
    this.auto       = true;
    this.sources    = new Collection([], 'id', true);
    this.muted      = [];

    this.talk         = this.talk.bind(this);
    this.onTalk       = this.onTalk.bind(this);
    this.onVoteNew    = this.onVoteNew.bind(this);
    this.onKick       = this.onKick.bind(this);
    this.onRoomMaster = this.onRoomMaster.bind(this);
    this.scrollDown   = this.scrollDown.bind(this);
    this.onActivity   = this.onActivity.bind(this);
    this.setRoom      = this.setRoom.bind(this);

    this.attachEvents();
}

Chat.prototype = Object.create(BaseChat.prototype);
Chat.prototype.constructor = Chat;

/**
 * Attach events
 */
Chat.prototype.attachEvents = function()
{
    this.client.on('room:talk', this.onTalk);
    this.repository.on('room:join', this.setRoom);
    this.repository.on('room:leave', this.setRoom);
    this.repository.on('vote:new', this.onVoteNew);
    this.repository.on('room:kick', this.onKick);
    this.repository.on('room:master', this.onRoomMaster);
};

/**
 * Detach events
 */
Chat.prototype.detachEvents = function()
{
    this.client.off('room:talk', this.onTalk);
    this.repository.off('room:join', this.setRoom);
    this.repository.off('room:leave', this.setRoom);
    this.repository.off('vote:new', this.onVoteNew);
    this.repository.off('room:kick', this.onKick);
    this.repository.off('room:master', this.onRoomMaster);
};

/**
 * Set player
 *
 * @param {Player} player
 */
Chat.prototype.setPlayer = function(player)
{
    if (this.room) {
        this.message.player = player;
    }
};

/**
 * Set room
 *
 * @param {Room} room
 */
Chat.prototype.setRoom = function()
{
    this.room = this.repository.room;

    if (this.room) {
        this.clearMessages();
    } else {
        this.clear();
    }
};

/**
 * Set DOM element
 */
Chat.prototype.setElement = function(element)
{
    this.element = element;
    this.element.addEventListener('scroll', this.onActivity);
    setTimeout(this.scrollDown, 0);
};

/**
 * Add message
 *
 * @param {Message} message
 */
Chat.prototype.addMessage = function(message)
{
    this.sources.add(message);

    if (BaseChat.prototype.addMessage.call(this, message) && this.auto) {
        this.scrollDown();
    }
};

/**
 * Remove message
 *
 * @param {Message} message
 */
Chat.prototype.removeMessage = function(message)
{
    this.sources.remove(message);
    this.messages.remove(message);
};

/**
 * Scroll down
 */
Chat.prototype.scrollDown = function()
{
    if (this.element) {
        this.element.scrollTop = this.element.scrollHeight;
    }
};

/**
 * Talk
 */
Chat.prototype.talk = function()
{
    var chat = this;

    if (this.message.content.length) {
        this.client.addEvent(
            'room:talk',
            this.message.content.substr(0, Message.prototype.maxLength),
            function (result) {
                if (result.success) {
                    chat.message.clear();
                } else {
                    console.error('Could not send %s', chat.message);
                }
            }
        );
    }
};

/**
 * On talk
 *
 * @param {Event} e
 */
Chat.prototype.onTalk = function(e)
{
    if (typeof(e.detail) !== 'undefined' && e.detail) {
        this.addMessage(new MessagePlayer(
            e.detail.client,
            e.detail.content,
            this.getPlayer(e.detail),
            e.detail.creation
        ));
    }
};

/**
 * Get player from message data
 *
 * @param {Object} data
 *
 * @return {Player}
 */
Chat.prototype.getPlayer = function(data)
{
    var player = this.room.getPlayerByClient(data.client);

    if (player) {
        return player;
    }

    return {
        name: typeof(data.name) === 'string' ? data.name : Message.prototype.name + ' ' + data.client,
        color: typeof(data.color) === 'string' ? data.color : Message.prototype.color
    };
};

/**
 * On new vote
 *
 * @param {Event} e
 */
Chat.prototype.onVoteNew = function(e)
{
    this.addMessage(new MessageVoteKick(e.detail.target));
};

/**
 * On kick
 *
 * @param {Event} e
 */
Chat.prototype.onKick = function(e)
{
    this.addMessage(new MessageKick(e.detail));
};

/**
 * On room master
 *
 * @param {Event} e
 */
Chat.prototype.onRoomMaster = function(e)
{
    if (e.detail.master) {
        this.addMessage(new MessageRoomMaster(e.detail.master));
    }
};

/**
 * On activity
 *
 * @param {Event} e
 */
Chat.prototype.onActivity = function(e)
{
    if (this.element) {
        this.auto = this.element.scrollTop === this.element.scrollHeight - this.element.clientHeight;
    }
};

/**
 * Add tutorial message
 */
Chat.prototype.addTip = function()
{
    this.addMessage(new MessageTip());
};

/**
 * Is message valid
 *
 * @param {Message} message
 *
 * @return {Boolean}
 */
Chat.prototype.isValid = function(message)
{
    if (!(message instanceof MessagePlayer)) {
        return true;
    }

    return this.isAllowed(message.client);
};

/**
 * Clear messages
 */
Chat.prototype.clearMessages = function()
{
    BaseChat.prototype.clearMessages.call(this);
    this.sources.clear();
    this.addTip();
};

/**
 * Mute/Unmute a client
 *
 * @param {Number} clientId
 */
Chat.prototype.toggleMute = function(clientId)
{
    var index  = this.muted.indexOf(clientId),
        exists = index >= 0;

    if (exists) {
        this.muted.splice(index, 1);
    } else {
        this.muted.push(clientId);
    }

    this.filterMessages();

    return !exists;
};

/**
 * Is this client allowed to talk?
 *
 * @param {Number} clientId
 *
 * @return {Boolean}
 */
Chat.prototype.isAllowed = function(clientId)
{
    return this.muted.indexOf(clientId) < 0;
};

/**
 * Filter messages
 */
Chat.prototype.filterMessages = function()
{
    var length = this.sources.count();

    this.messages.clear();

    for (var message, i = 0; i < length; i++) {
        message = this.sources.items[i];
        if (!(message instanceof MessagePlayer) || this.isAllowed(message.client)) {
            this.messages.add(message);
        }
    }
};

/**
 * Clear
 */
Chat.prototype.clear = function()
{
    this.clearMessages();

    if (this.element) {
        this.element.removeEventListener('scroll', this.onActivity);
    }

    this.message.clear();
    this.muted.length = 0;
    this.room         = null;
    this.element      = null;
};
/**
 * FPS Logger
 */
function FPSLogger()
{
    BaseFPSLogger.call(this);
}

FPSLogger.prototype = Object.create(BaseFPSLogger.prototype);
FPSLogger.prototype.constructor = FPSLogger;

/**
 * Load FPS
 */
FPSLogger.prototype.log = function()
{
    BaseFPSLogger.prototype.log.call(this);
    this.emit('fps', this.frequency);
};
/**
 * Notifier
 *
 * @param {SoundManager} SoundManager
 * @param {ActivityWatcher} watcher
 */
function Notifier (sound, watcher)
{
    this.sound   = sound;
    this.watcher = watcher;
    this.element = document.getElementsByTagName('title')[0];
    this.title   = this.element.text;
    this.timeout = null;

    this.clear   = this.clear.bind(this);
}

/**
 * Default message duration
 *
 * @type {Number}
 */
Notifier.prototype.duration = 5000;

/**
 * Notify
 *
 * @param {String} message
 * @param {Number} duration
 * @param {String} sound
 */
Notifier.prototype.notify = function(message, duration, sound)
{
    if (!this.watcher.isActive() || !this.watcher.isFocused()) {
        this.display(message, duration);
    }

    this.sound.play(typeof(sound) === 'string' ? sound : 'notice');
};
/**
 * Notify inactive
 *
 * @param {String} message
 * @param {Number} duration
 * @param {String} sound
 */
Notifier.prototype.notifyInactive = function(message, duration, sound)
{
    if (!this.watcher.isActive() || !this.watcher.isFocused()) {
        this.display(message, duration);
        this.sound.play(typeof(sound) === 'string' ? sound : 'notice');
    }
};

/**
 * Set message
 *
 * @param {String} message
 * @param {Number} duration
 */
Notifier.prototype.display = function(message, duration)
{
    this.clearTimeout();
    this.write(message);
    setTimeout(this.clear, typeof(duration) === 'number' ? duration : this.duration);
};

/**
 * Write a message in the title
 *
 * @param {String} message
 */
Notifier.prototype.write = function(message)
{
    this.element.text = message + ' - ' + this.title;
};

/**
 * Clear the title
 */
Notifier.prototype.clear = function()
{
    this.clearTimeout();
    this.element.text = this.title;
};

/**
 * Clear timeout
 */
Notifier.prototype.clearTimeout = function()
{
    if (this.timeout) {
        clearTimeout(this.timeout);
    }
};
/**
 * Remembered profile
 */
function Profile()
{
    EventEmitter.call(this);

    this.name     = null;
    this.color    = null;
    this.sound    = true;
    this.radio    = false;
    this.loading  = false;
    this.controls = [
        new PlayerControl(37, 'icon-left-dir'),
        new PlayerControl(39, 'icon-right-dir')
    ];

    // Binding
    this.onControlChange = this.onControlChange.bind(this);

    var labels = ['Left', 'Right'];

    for (var i = this.controls.length - 1; i >= 0; i--) {
        this.controls[i].label = labels[i];
        this.controls[i].on('change', this.onControlChange);
    }

    this.load();
    this.persist();
}

Profile.prototype = Object.create(EventEmitter.prototype);
Profile.prototype.constructor = Profile;

/**
 * Local storage key
 *
 * @type {String}
 */
Profile.prototype.localKey = 'PROFILE';

/**
 * Get data
 *
 * @return {Object}
 */
Profile.prototype.serialize = function()
{
    return {
        name: this.name,
        color: this.color,
        sound: this.sound,
        radio: this.radio,
        controls: this.getMapping()
    };
};

/**
 * Unserialize
 *
 * @param {Object} data
 */
Profile.prototype.unserialize = function(data)
{
    if (typeof(data.name) !== 'undefined') {
        this.setName(data.name);
    }

    if (typeof(data.color) !== 'undefined') {
        this.setColor(data.color);
    }

    if (typeof(data.sound) !== 'undefined') {
        this.setSound(data.sound);
    }

    if (typeof(data.radio) !== 'undefined') {
        this.setRadio(data.radio);
    }

    if (typeof(data.controls) !== 'undefined') {
        this.setControls(data.controls);
    }
};

/**
 * Persist
 */
Profile.prototype.persist = function()
{
    if (this.loading) { return; }

    if (this.isValid()) {
        window.localStorage.setItem(this.localKey, JSON.stringify(this.serialize()));
        this.emit('change');
    } else {
        this.load();
    }
};

/**
 * Persist
 */
Profile.prototype.load = function()
{
    this.loading = true;

    var data = window.localStorage.getItem(this.localKey);

    if (data) {
        this.unserialize(JSON.parse(data));
        this.emit('change');
    }

    if (!this.color) {
        this.setColor(BasePlayer.prototype.getRandomColor());
    }

    this.loading = false;
};

/**
 * Get mapping
 *
 * @return {Array}
 */
Profile.prototype.getMapping = function()
{
    var mapping = new Array(this.controls.length);

    for (var i = this.controls.length - 1; i >= 0; i--) {
        mapping[i] = this.controls[i].getMapping();
    }

    return mapping;
};

/**
 * Set name
 *
 * @param {Name} name
 */
Profile.prototype.setName = function(name)
{
    name = name.trim();

    if (name.length && this.name !== name) {
        this.name = name;
        this.persist();
    }
};

/**
 * Set color
 *
 * @param {String} color
 */
Profile.prototype.setColor = function(color)
{
    if (BasePlayer.prototype.validateColor(color)) {
        this.color = color;
        this.persist();
    }
};

/**
 * Set controls
 *
 * @param {Object} controls
 */
Profile.prototype.setControls = function(controls)
{
    for (var i = controls.length - 1; i >= 0; i--) {
        this.controls[i].loadMapping(controls[i]);
    }
    this.persist();
};

/**
 * Set sound
 *
 * @param {Boolean} sound
 */
Profile.prototype.setSound = function(sound)
{
    if (this.sound !== sound) {
        this.sound = sound;
        this.persist();
    }
};

/**
 * Set radio
 *
 * @param {Boolean} radio
 */
Profile.prototype.setRadio = function(radio)
{
    if (this.radio !== radio) {
        this.radio = radio;
        this.persist();
    }
};

/**
 *
 * Profile
 *
 * @param {Event} e
 */
Profile.prototype.onControlChange = function(e)
{
    this.persist();
};

/**
 * Is profile complete?
 *
 * @return {Boolean}
 */
Profile.prototype.isComplete = function()
{
    return this.name && this.color;
};

/**
 * Is profile valid?
 *
 * @return {Boolean}
 */
Profile.prototype.isValid = function()
{
    if (!this.name || !this.name.trim().length) { return false; }
    if (!this.color || !BasePlayer.prototype.validateColor(this.color)) { return false; }

    return true;
};
/**
 * Radio
 *
 * @param {Profile} profile
 */
function Radio (profile)
{
    this.profile = profile;
    this.active  = false;
    this.enabled = this.profile.radio;
    this.element = this.getVideo();

    this.toggle = this.toggle.bind(this);

    this.resolve();
}

/**
 * Source URL
 *
 * @type {String}
 */
Radio.prototype.source = 'http://streaming.radionomy.com/Curvyradio';

/**
 * Volume
 *
 * @type {Number}
 */
Radio.prototype.volume = 0.8;

/**
 * Get video
 *
 * @param {String} src
 *
 * @return {DOMElement}
 */
Radio.prototype.getVideo = function()
{
    var video  = document.createElement('video'),
        source = document.createElement('source');

    video.appendChild(source);

    video.name     = 'media';
    video.autoplay = true;
    video.volume   = this.volume;
    source.type    = 'audio/mpeg';

    return video;
};

/**
 * Toggle enabled
 */
Radio.prototype.toggle = function ()
{
    this.setEnabled(!this.enabled);
};

/**
 * Set enabled/disabled (controlled by the user)
 *
 * @param {Boolean} enabled
 */
Radio.prototype.setEnabled = function(enabled)
{
    this.enabled = enabled ? true : false;

    this.profile.setRadio(this.enabled);
    this.resolve();
};

/**
 * Set active/inactive (controlled by the game)
 *
 * @param {Boolean} enabled
 */
Radio.prototype.setActive = function(active)
{
    this.active = active ? true : false;

    this.resolve();
};

/**
 * Set volume
 *
 * @param {Number} volume
 */
Radio.prototype.setVolume = function(volume)
{
    this.element.volume = typeof(volume) !== 'undefined' ? volume : this.volume;
};

/**
 * Resolve radio status
 */
Radio.prototype.resolve = function()
{
    if (this.active && this.enabled) {
        this.play();
    } else {
        this.stop();
    }
};

/**
 * Play
 */
Radio.prototype.play = function()
{
    this.element.src = this.source;
};

/**
 * Stop
 */
Radio.prototype.stop = function()
{
    this.element.src = '';
};
/**
 * Sound Manager
 *
 * @param {Profile} profile
 */
function SoundManager (profile)
{
    this.profile = profile;
    this.active  = this.profile.sound;

    this.toggle = this.toggle.bind(this);

    createjs.Sound.alternateExtensions = ['mp3'];
    createjs.Sound.registerSounds(this.sounds, this.directory);
    createjs.Sound.setVolume(this.active ? this.volume : 0);
}

/**
 * Volume
 *
 * @type {Number}
 */
SoundManager.prototype.volume = 0.5;

/**
 * Sounds
 *
 * @type {Array}
 */
SoundManager.prototype.sounds = [
    {id:'death', src:'death.ogg'},
    {id:'win', src:'win.ogg'},
    {id:'notice', src:'notice.ogg'},
    {id:'bonus-clear', src:'bonus-clear.ogg'},
    {id:'bonus-pop', src:'bonus-pop.ogg'}
];

/**
 * Directory
 *
 * @type {String}
 */
SoundManager.prototype.directory = 'sounds/';

/**
 * Play a sound
 *
 * @param {String} sound
 */
SoundManager.prototype.play = function(sound)
{
    if (this.active) {
        createjs.Sound.play(sound);
    }
};

/**
 * Sound manager
 *
 * @param {String} sound
 */
SoundManager.prototype.stop = function(sound)
{
    createjs.Sound.stop(sound);
};

/**
 * Toggle active
 */
SoundManager.prototype.toggle = function ()
{
    this.setActive(!this.active);
};

/**
 * Set active/inactive
 *
 * @param {Boolean} active
 */
SoundManager.prototype.setActive = function(active)
{
    this.active = active ? true : false;
    this.setVolume(this.active ? this.volume : 0);
    this.profile.setSound(this.active);
};

/**
 * Set volume
 *
 * @param {Number} volume
 */
SoundManager.prototype.setVolume = function(volume)
{
    createjs.Sound.setVolume(typeof(volume) !== 'undefined' ? volume : this.volume);
};
var curvytronApp = angular.module('curvytronApp', ['ngRoute', 'ngCookies', 'colorpicker.module']),
    gamepadListener = new GamepadListener({analog: false, deadZone: 0.4});

curvytronApp.service('SocketClient', SocketClient);
curvytronApp.service('Profile', ['$rootScope', Profile]);
curvytronApp.service('SoundManager', ['Profile', SoundManager]);
curvytronApp.service('ActivityWatcher', ['SocketClient', ActivityWatcher]);
curvytronApp.service('RoomRepository', ['SocketClient', RoomRepository]);
curvytronApp.service('GameRepository', ['SocketClient', 'RoomRepository', 'SoundManager', GameRepository]);
curvytronApp.service('Chat', ['SocketClient', 'RoomRepository', Chat]);
curvytronApp.service('Radio', ['Profile', Radio]);
curvytronApp.service('Notifier', ['SoundManager', 'ActivityWatcher', Notifier]);
curvytronApp.service('Analyser', ['$rootScope', Analyser]);

curvytronApp.controller(
    'CurvytronController',
    ['$scope', '$window', '$location', 'Profile', 'Analyser', 'ActivityWatcher', 'SocketClient', CurvytronController]
);

curvytronApp.controller(
    'RoomsController',
    ['$scope', '$location', 'SocketClient', RoomsController]
);
curvytronApp.controller(
    'RoomController',
    ['$scope', '$routeParams', '$location', 'SocketClient', 'RoomRepository', 'Profile', 'Chat', 'Notifier', RoomController]
);
curvytronApp.controller(
    'RoomConfigController',
    ['$scope', 'RoomRepository', RoomConfigController]
);
curvytronApp.controller(
    'GameController',
    ['$scope', '$routeParams', '$location', 'SocketClient', 'GameRepository', 'Chat', 'Radio', 'SoundManager', GameController]
);
curvytronApp.controller(
    'ChatController',
    ['$scope', 'Chat', ChatController]
);
curvytronApp.controller(
    'PlayerListController',
    ['$scope', '$element', 'SocketClient', PlayerListController]
);
curvytronApp.controller(
    'RoundController',
    ['$scope', 'GameRepository', 'Notifier', RoundController]
);
curvytronApp.controller(
    'MetricController',
    ['$scope', 'SocketClient', MetricController]
);
curvytronApp.controller(
    'WaitingController',
    ['$scope', 'SocketClient', WaitingController]
);
curvytronApp.controller(
    'KillLogController',
    ['$scope', '$interpolate', 'SocketClient', KillLogController]
);
curvytronApp.controller(
    'ProfileController',
    ['$scope', 'Profile', 'Radio', 'SoundManager', ProfileController]
);

curvytronApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    $routeProvider
        .when('/', {
            templateUrl: 'js/views/rooms/list.html',
            controller: 'RoomsController'
        })
        .when('/about', {
            templateUrl: 'js/views/pages/about.html'
        })
        .when('/room/:name', {
            templateUrl: 'js/views/rooms/detail.html',
            controller: 'RoomController',
            reloadOnSearch: false
        })
        .when('/game/:name', {
            templateUrl: 'js/views/game/play.html',
            controller: 'GameController'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);
