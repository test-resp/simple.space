/**
 * Options that are supplied on initialization.
 * @class
 */
class ClientOptions {
    /**
     * @param {object} newObj The new client options.
     * @param {object} [oldObj=ClientOptions.default] The preset or default client options.
     */
    constructor(newObj, oldObj = ClientOptions.default) {
        /**
         * Whether or not to cache every bot, emoji, and guild existing on the site.
         * @type {?boolean}
         */
        this.cache = newObj.hasOwnProperty('cache') ? newObj.cache !== 'none' ? newObj.cache : null : oldObj.cache;

        /**
         * The number of milliseconds to wait until the cache is automatically updated.
         * Set to ``0`` to disable automatic cache updating. Note that updating may not
         * be consistent, and may be later than intended.
         * @type {?number}
         */
        this.cacheUpdateTimer = newObj.hasOwnProperty('cacheUpdateTimer') ? newObj.cacheUpdateTimer !== 'none' ? newObj.cacheUpdateTimer : oldObj.cacheUpdateTimer : oldObj.cacheUpdateTimer;

        /**
         * The API token, required for some functions to work properly.
         * @type {?string}
         */
        this.token = newObj.hasOwnProperty('token') ? newObj.token !== 'none' ? newObj.token : null : oldObj.token;

        /**
         * The Bot ID, used for self actions and posting guild count.
         * @type {?string}
         */
        this.botID = newObj.hasOwnProperty('botID') ? newObj.botID !== 'none' ? newObj.botID : null : oldObj.botID;

        /**
         * The discord.js#Client object.
         * @type {?*}
         */
        this.client = newObj.hasOwnProperty('client') ? newObj.client !== 'none' ? newObj.client : null : oldObj.token;

        /**
         * Whether or not to log everything when fetching something.
         * @type {?boolean}
         */
        this.log = newObj.hasOwnProperty('log') ? newObj.log !== 'none' ? newObj.log : null : oldObj.log;
    }

    /**
     * The default client options.
     * @readonly
     * @static
     */
    static get default() {
        return {
            cache: false,
            cacheUpdateTimer: 180000,
            client: null,
            botID: null,
            token: null,
            log: false
        };
    }
}

exports.ClientOptions = ClientOptions;