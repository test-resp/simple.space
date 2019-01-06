const Fetch = require('node-fetch').default; // Literally only for linting
const util = require('util'); // eslint-disable-line no-unused-vars
const { isObject, check } = require('./util/');

const ok = /2\d\d/;

/**
 * @external Store
 * @see {@link https://github.com/iREDMe/red-store}
 */
const Store = require('@ired_me/red-store');
const { Bot, User, Upvote, Stats,
	ClientOptions, FetchOptions, PostOptions, MultiFetchOptions,
	Ratelimit, FetchError, } = require('./structures/');

/**
 * Main client class for interacting to botlist.space
 */
class Client {
	/**
	 * @param {ClientOptions} options The options to configure.
	 */
	constructor(options = ClientOptions) {
		/**
		 * The ClientOptions.
		 * @type {ClientOptions}
		 */
		this.options = ClientOptions;

		this.edit(Object.assign(ClientOptions, options), true);

		/**
		 * Every bot cached, mapped by their IDs.
		 * @type {Store<string, Bot>}
		 */
		this.bots = new Store();

		/**
		 * Every user cached, mapped by their IDs.
		 * **This store does not automatically cache like the others, and only caches upon a user fetch.**
		 * @type {Store<string, User>}
		 */
		this.users = new Store();

		/**
		 * An array of the last three fetched Statistics, the first being the oldest.
		 * @type {Stats[]}
		 */
		this.stats = [];
	}

	async get(point, version, ...headers) {
		const i = await Fetch(this.endpoint + version + point + headers.join(''));
		if (i.status === 429) throw new Ratelimit(i.headers, version + point);
		const contents = await i.json();
		if (contents.code && !ok.test(contents.code)) throw new FetchError(i, contents.message);
		else return contents;
	}

	async authGet(point, version, Authorization, ...headers) {
		const i = await Fetch(this.endpoint + version + point + headers.join(''), { headers: { Authorization } });
		if (i.status === 429) throw new Ratelimit(i.headers, version + point);
		const contents = await i.json();
		if (contents.code && !ok.test(contents.code)) throw new FetchError(i, contents.message);
		else return contents;
	}

	async post(point, version, Authorization, body) {
		const i = await Fetch(this.endpoint + version + point, {
			method: 'post',
			headers: { Authorization, 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (i.status === 429) throw new Ratelimit(i.headers, version + point);
		const contents = await i.json();
		if (contents.code && !ok.test(contents.code)) throw new FetchError(i, contents.message);
		else return contents;
	}

	/**
	 * The endpoint to use for interaction with botlist.space.
	 * The version number is missing; Fulfilled only when fetching/posting.
	 * @readonly
	 * @type {string}
	 */
	get endpoint() {
		return 'https://api.botlist.space/v';
	}

	/**
	 * Edit the options of the Client.
	 * @param {ClientOptions} [options={}] The options to change.
	 * @param {boolean} [preset=false] If true, uses the default ClientOptions as a target copy. Otherwise, {@link Client#options} is used.
	 */
	edit(options = {}, preset = false) {
		if (!isObject(options)) throw new TypeError('options must be an object.');
		const toCheck = Object.assign(preset ? ClientOptions : this.options, options);
		check(toCheck);

		// Give some properties of the ClientOptions
		FetchOptions.cache = MultiFetchOptions.cache = toCheck.cache;
		FetchOptions.version = MultiFetchOptions.version = PostOptions.version = toCheck.version;
		FetchOptions.userToken = MultiFetchOptions.userToken = PostOptions.userToken = toCheck.userToken;
		FetchOptions.botToken = MultiFetchOptions.botToken = PostOptions.botToken = toCheck.botToken;

		return this.options = toCheck;
	}

	/**
	 * Fetch botlist.space statistics.
	 * @param {FetchOptions} [options={}] Options to pass. (Ignores cache)
	 * @returns {Promise<Stats>} The statistics.
	 */
	async fetchStats(options = {}) {
		const { cache, raw, version } = Object.assign(FetchOptions, options);
		if (!isObject(options)) throw new TypeError('options must be an object.');
		const contents = await this.get('/statistics', version);

		if (cache) {
			this.stats.push(new Stats(contents));
			if (this.stats.length >= this.options.statsLimit) {
				while (this.stats.length >= this.options.statsLimit) this.stats.splice(0, 1);
			}
		}
		return raw ? contents : new Stats(contents);
	}

	/**
	 * Fetch all bots listed on botlist.space.
	 * @param {MultiFetchOptions} [options={}] Options to pass.
	 * @returns {Promise<Bot[] | Store<string, Bot>>}
	 * @deprecated Use {@link Client#fetchBots} instead.
	 */
	async fetchAllBots(options = {}) {
		const { cache, mapify, raw, version, page } = Object.assign(MultiFetchOptions, options);
		if (typeof page !== 'number') throw new TypeError('page must be a number.');
		if (!isObject(options)) throw new TypeError('options must be an object.');

		const contents = await this.get('/bots', version, `?page=${page}`);
		if (cache) this.bots = this.bots.concat(new Store(contents.bots.map(bot => [bot.id, new Bot(bot, this)])));
		if (mapify) return new Store(contents.bots.map(bot => [bot.id, new Bot(bot, this)]));
		else return raw ? contents : contents.bots.map(c => new Bot(c.bots, this));
	}

	/**
	 * Fetch all bots listed on botlist.space.
	 * @param {MultiFetchOptions} [options={}] Options to pass.
	 * @returns {Promise<Bot[] | Store<string, Bot>>}
	 */
	async fetchBots(options = {}) {
		const { cache, mapify, raw, version, page } = Object.assign(MultiFetchOptions, options);
		if (typeof page !== 'number') throw new TypeError('page must be a number.');
		if (!isObject(options)) throw new TypeError('options must be an object.');

		const contents = await this.get('/bots', version, `?page=${page}`);
		if (cache) this.bots = this.bots.concat(new Store(contents.bots.map(bot => [bot.id, new Bot(bot, this)])));
		if (mapify) return new Store(contents.bots.map(bot => [bot.id, new Bot(bot, this)]));
		else return raw ? contents : contents.bots.map(c => new Bot(c.bots, this));
	}

	/**
	 * Fetch a bot listed on botlist.space.
	 * @param {string | FetchOptions} [id=this.options.botID] The ID of the bot to fetch. Not required if this.options.botID is set.
	 * Can be {@link FetchOptions}, uses [options.botID]({@link ClientOptions#bot}) if so
	 * @param {FetchOptions} [options={}] Options to pass.
	 * @returns {Promise<Bot>} A bot object.
	 */
	async fetchBot(id = this.options.botID, options = {}) {
		if (isObject(id)) {
			options = id;
			id = this.options.botID;
		}
		const { cache, raw, version } = Object.assign(FetchOptions, options);

		if (typeof id === 'undefined' || id === null) throw new ReferenceError('id must be defined.');
		if (typeof id !== 'string' && !isObject(id)) throw new TypeError('id must be a string.');
		if (!isObject(options)) throw new TypeError('options must be an object.');

		const contents = await this.get(`/bots/${id}`, version);
		if (cache) this.bots.set(contents.id, new Bot(contents));
		return raw ? contents : new Bot(contents);
	}

	/**
	 * Fetch a bot's upvotes from the past month; Requires Bot Token
	 * @param {string | MultiFetchOptions} [id=this.options.botID] The bot ID to fetch upvotes from.
	 * Can be {@link FetchOptions}, uses [options.botID]({@link ClientOptions#bot}) if so
	 * @param {MultiFetchOptions} [options={}] Options to pass.
	 * @returns {Promise<Upvote[] | Store<string, Upvote>>} An array of upvotes.s
	 */
	async fetchUpvotes(id = this.options.botID, options = {}) {
		if (isObject(id)) {
			options = id;
			id = this.options.botID;
		}
		const { cache, raw, version, botToken, page, mapify } = Object.assign(MultiFetchOptions, options);
		if (!botToken) throw new ReferenceError('options.botToken must be defined.');

		if (typeof id === 'undefined' || id === null) throw new ReferenceError('id must be defined.');
		if (typeof id !== 'string' && !isObject(id)) throw new TypeError('id must be a string.');
		if (!isObject(options)) throw new TypeError('options must be an object.');

		const contents = await this.get(`/bots/${id}/upvotes`, version, botToken, `?page=${page}`);
		if (cache) this.users = this.users.concat(new Store(contents.upvotes.map(c => [c.user.id, new User(c.user)])));
		if (mapify) return new Store(contents.upvotes.map(c => [c.user.id, new Upvote(c)]));
		else return raw ? contents : contents.upvotes.map(c => new Upvote(c));
	}

	/**
	 * Fetch a user logged onto botlist.space.
	 * @param {string} id The user ID to fetch from the API.
	 * @param {FetchOptions} [options={}] Options to pass.
	 * @returns {Promise<User>} A user object.
	 */
	async fetchUser(id, options = {}) {
		const { cache, raw, version } = Object.assign(FetchOptions, options);
		if (typeof id === 'undefined' || id === null) throw new ReferenceError('id must be defined.');
		if (typeof id !== 'string') throw new TypeError('id must be a string.');
		if (!isObject(options)) throw new TypeError('options must be an object.');

		const contents = await this.get(`/users/${id}`, version);
		if (cache) this.users.set(contents.id, new User(contents));
		return raw ? contents : new User(contents);
	}

	/**
	 * Fetches all bots that a user owns.
	 * @param {string} id A user ID to fetch bots from.
	 * @param {MultiFetchOptions} [options={}] Options to pass.
	 * @returns {Promise<Bot[]>}
	 */
	async fetchBotsOfUser(id, options = {}) {
		const { cache, raw, version, mapify, page } = Object.assign(MultiFetchOptions, options);
		if (typeof id === 'undefined' || id === null) throw new ReferenceError('id must be defined.');
		if (typeof id !== 'string') throw new TypeError('id must be a string.');
		if (!isObject(options)) throw new TypeError('options must be an object.');

		const contents = await this.get(`/users/${id}/bots`, version, `?page=${page}`);
		if (cache) this.bots = this.bots.concat(new Store(contents.bots.map(b => [b.id, new Bot(b)])));
		if (mapify) return new Store(contents.bots.map(b => [b.id, new Bot(b)]));
		else return raw ? contents : contents.bots.map(b => new Bot(b));
	}

	/**
	 * Post your server count to botlist.space.
	 * @param {string | PostOptions | number | number[]} [id=this.options.botID]
	 * The bot ID to post server count for.
	 * Not required if a bot ID was supplied.
	 * Can be PostOptions if using the bot ID supplied from ClientOptions.
	 * Can also be {@link PostOptions#countOrShards} if a number/array of numbers.
	 * @param {PostOptions} [options={}]
	 * Options to pass.
	 * Overriden by the `id` parameter if `id` is PostOptions/number/array of numbers
	 * @returns {object} An object that satisfies your low self-esteem reminding you it was successive on post.
	 */
	async postCount(id = this.options.botID, options = {}) {
		if (isObject(id)) {
			options = id;
			id = this.options.botID;
		} else if (typeof id === 'number' || Array.isArray(id)) {
			options.countOrShards = id;
			id = this.options.botID;
		}
		if (typeof id === 'undefined' || id === null) throw new ReferenceError('id must be defined.');
		if (typeof id !== 'string' && !isObject(id)) throw new TypeError('id must be a string.');
		if (!isObject(options)) throw new TypeError('options must be an object.');
		const { version, botToken, countOrShards } = Object.assign(PostOptions, options);

		if (typeof botToken === 'undefined') throw new ReferenceError('options.botToken must be defined, or in ClientOptions.');
		if (typeof botToken !== 'string') throw new TypeError('options.botToken must be a string.');
		if (typeof countOrShards === 'undefined') throw new ReferenceError('options.countOrShards must be defined.');
		if (typeof options.countOrShards !== 'number' && !Array.isArray(options.countOrShards)) throw new TypeError('options.countOrShards must be a number or array of numbers.'); // eslint-disable-line max-len

		const body = Array.isArray(options.countOrShards) ? { shards: options.countOrShards } : { server_count: options.countOrShards };
		const contents = await this.post(`/bots/${id}`, version, botToken, body);
		return contents;
	}
}

Client.prototype.fetchAllBots = util.deprecate(Client.prototype.fetchAllBots, 'Client#fetchAllBots - Deprecated; Use Client#fetchBots instead.');

module.exports = Client;