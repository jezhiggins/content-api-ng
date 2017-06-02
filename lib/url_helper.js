const config = require('config');
const pluralize = require('pluralize');
const querystring = require('querystring').stringify;
const construct_url = require('./config_helper.js').construct_url;

class url_helper {
  constructor(api_url, frontend = 'not-set') {
    this.apiroot_ = api_url;

    if (frontend[frontend.length-1] == '/')
      frontend = frontend.slice(0, -1);
    this.webroot_ = frontend;
  } // constructor

  make_url(root, path = '') {
    if (!path)
      path = '/';
    if (path[0] != '/')
      path = '/' + path;
    return root + path;
  } // api_url

  api_url(path) {
    return this.make_url(this.apiroot_, path);
  } // api_url

  public_web_url(path) {
    return this.make_url(this.webroot_, path);
  } // public_web_url

  tag_type_url(tag_type) {
    const tt = plural_tag_type(tag_type);
    return this.api_url(`/tags/${encodeURIComponent(tt)}.json`);
  } // tag_type_url

  tag_url(tag) {
    const plural = plural_tag_type(tag.tag_type);
    return this.api_url(`/tags/${encodeURIComponent(plural)}/${encodeURIComponent(tag.tag_id)}.json`);
  } // tag_url

  with_tag_url(tag_or_tags, params = {}) {
    const tags = Array.isArray(tag_or_tags) ? tag_or_tags : Array.of(tag_or_tags);
    const query = {}
    for (const tag of tags) {
      if (!query[tag.tag_type])
	query[tag.tag_type] = tag.tag_id;
      else
	query[tag.tag_type] += ',' + tag.tag_id;
    } // for ...
    for (const [k,v] of Object.entries(params))
      query[k] = v;

    return this.api_url(`with_tag.json?${querystring(query)}`);
  } // with_tag_url

  with_type_url(type, params = {}) {
    const pseudo_tag = {
      'tag_id': type,
      'tag_type': 'type'
    };
    return this.with_tag_url(pseudo_tag, params);
  } // with_type_url

  tag_web_url(tag) {
    return this.public_web_url(`/tags/${encodeURIComponent(tag.tag_id)}`);
  } // with_tag_web_url

  artefact_url(artefact) {
    return this.api_url(`/${encodeURIComponent(artefact.slug)}.json`);
  } // artefact_url

  artefact_web_url(artefact) {
    const path = artefact.rendering_path ? artefact.rendering_path : `/${encodeURIComponent(artefact.slug)}`;
    return this.public_web_url(path);
  } // artefact_web_url
};

function plural_tag_type(tag_type) {
  return tag_type.plural ? tag_type.plural : pluralize(tag_type);
} // plural_tag_type

function default_url_helper() {
  const api_config = config.get('api');
  const api_url = construct_url(api_config);
  console.log(`Content-api URL is ${api_url}`);
  const frontend = config.get('frontend.webroot');
  return new url_helper(api_url, frontend);
} // default_url_helper

function make_url_helper(hostname, port, prefix, secure, frontend) {
  const localConfig = {
    'hostname': hostname,
    'port': port,
    'prefix': prefix,
    'secure': secure,
    'has': function(field) { return this[field]; },
    'get': function(field) { return this[field]; }
  };

  return new url_helper(construct_url(localConfig), frontend);
} // make_url_helper

exports = module.exports = default_url_helper;
exports.custom = make_url_helper;
