/**
 * Options that are supplied on initialization.
 * @class
 */
class ClientOptions {
    /**
     * @param {Object} newObj The new client options.
     * @param {Object} [oldObj=ClientOptions.default] The preset or default client options.
     */
    constructor(newObj, oldObj = ClientOptions.default) {
        /**
         * Whether or not to save all bots and guilds into an array.
         * @type {Boolean}
         */
        this.cache = newObj.hasOwnProperty('cache') ? newObj.cache !== 'none' ? newObj.cache : false : oldObj.cache;

        /**
         * The API token, required for some functions to work properly.
         * @type {String|Boolean}
         */
        this.token = newObj.hasOwnProperty('token') ? newObj.token !== 'none' ? newObj.token : false : oldObj.token;

        /**
         * The Bot ID, used for self actions and posting guild count.
         * @type {String|Boolean}
         */
        this.botID = newObj.hasOwnProperty('botID') ? newObj.botID !== 'none' ? newObj.botID : false : oldObj.botID;

        /**
         * The discord.js#Client object.
         * @type {Client}
         */
        this.client = newObj.hasOwnProperty('client') ? newObj.client !== 'none' ? newObj.client : false : oldObj.token;

        /**
         * Whether or not to log everything when fetching something.
         * @type {Boolean}
         */
        this.log = newObj.hasOwnProperty('log') ? newObj.log !== 'none' ? newObj.log : false : oldObj.log;
    }

    /**
     * The default client options.
     * @static
     */
    static get default() {
        return {
            cache: false,
            client: 'none',
            botID: 'none',
            token: 'none',
            log: false
        };
    }
}

exports.ClientOptions = ClientOptions;