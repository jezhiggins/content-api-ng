const config = require('config');
const construct_url = require('./config_helper.js').construct_url;
const httpGet = require('simple-get').concat;
const lru = require('lru');

class asset_api_client {
  constructor(asset_api_url, bearer_token, cache_size) {
    this.asset_api_url_ = asset_api_url;
    this.bearer_token_ = bearer_token;
    this.cache_ = new lru(cache_size);
  } // constructor

  get(asset_id_or_ids) {
    if (!Array.isArray(asset_id_or_ids))
      return this.fetch(asset_id_or_ids);

    const gets = [];
    for (const id of asset_id_or_ids)
      gets.push(this.fetch(id));
    return Promise.all(gets);
  } // get


  fetch(asset_id) {
    const cache = this.cache_;
    const cached = cache.get(asset_id);

    return new Promise((resolve, reject) => {
      if (cached)
	return resolve(asset_to_json(cached));

      const asset_url = `${this.asset_api_url_}/assets/${asset_id}`;
      httpGet({
	url: asset_url,
	method: 'GET',
	headers: {
	  'Authorization': `Bearer ${this.bearer_token_}`,
	  'Accept': 'application/json',
	  'User-Agent': 'content-api-ng'
	}
      }, function (err, res, data) {
	if (err)
	  return reject(err);

	const json = asset_to_json(data);

	if (json)
	  cache.set(asset_id, data);
	resolve(json);
      });
    });
  } // get
} // class asset_api_client


function asset_to_json(data) {
  try {
    const json = JSON.parse(data);
    const full_id = json.id;
    const abbrev_id = full_id.substr(full_id.lastIndexOf('/') + 1);
    json.id = abbrev_id;
    return json;
  } catch (err) {
    console.log(`Error parsing asset JSON: ${err}`);
    return null;
  } // catch
} // asset_to_json

function asset_api_url(asset_api_config) {
  const url = construct_url(asset_api_config);
  console.log(`Asset-api URL is ${url}`);
  return url;
} // asset_api_url

function asset_api_bearer_token(asset_api_config) {
  if (process.env['CONTENTAPI_ASSET_MANAGER_BEARER_TOKEN']) {
    console.log(`Asset-api bearer token found in environment`);
    return process.env['CONTENTAPI_ASSET_MANAGER_BEARER_TOKEN'];
  } // if ...

  const bearer = config.has('bearer-token') ? config.get('bearer-token') : undefined;
  if (!bearer)
    console.log(`Asset-api bearer token not set`);
  return bearer;
} // asset_api_bearer_token

function asset_api_cache(asset_api_config) {
  const size = config.has('cache-size') ? config.get('cache-size') : 100;
  console.log(`Asset-api cache size set to ${size}`);
  return size;
} // asset_api_cache

function default_asset_api() {
  const asset_api_config = config.get('asset-api');

  return new asset_api_client(
    asset_api_url(asset_api_config),
    asset_api_bearer_token(asset_api_config),
    asset_api_cache(asset_api_config)
  );
} // default_asset_api

module.exports = default_asset_api;
