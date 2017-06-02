const error_404 = require('./error_404.js');
const error_503 = require('./error_503.js');
const content_types = require('../mongo_documents/content_types.js');
const Tags = require('../mongo_documents/tags.js');
const Tag_types = require('../mongo_documents/tag_types.js').tag_types;
const Artefacts = require('../mongo_documents/artefacts.js');
const Editions = require('../mongo_documents/editions.js');
const singular = require('pluralize').singular;
const stream_from = require('rillet').from;

//////////////////////////////////////////////////////////////
async function tag_param(req, res, db, url_helper) {
  const tag = req.query["tag"];
  const tags = (await Tags.by_ids(tag, db)).filter(t => t.tag_type != 'keyword');

  const modifiers = modifier_params(req);
  const possible_tags = tags.filter(uniq_by_tag_type());

  // If we can unambiguously determine the tag type, redirect to its correct URL
  if (possible_tags.length == 1)
    res.redirect(url_helper.with_tag_url(tags, modifiers));
  else if (content_types.some(ct => ct == singular(tag)))
    res.redirect(url_helper.with_type_url(tag, modifiers));
  else
    error_404(res);
} // tag_param

function type_param(req, res, db, url_helper) {
  const type = singular(req.query["type"]);
  const description = `All content with the ${type} type`;
  const params = { sort: 'slug' }
  if (req.query["sort"])
    params.sort = req.query["sort"];
  if (req.query["page"]) {
    params.limit = 30;
    params.skip = (req.query["page"]-1) * 30;
  } // if ...
  const artefacts = Artefacts.by_type(db, type, req.query["role"], params);

  send_artefacts(req, res, artefacts, description, db, url_helper);
} // type_param

async function handle_params(req, res, db, url_helper) {
  const request_tags = stream_from(Tag_types).
	map(t => req.query[t.singular]).
	filter(q => q).
	join();

  // nothing requested, so bail
  if (request_tags == '')
    return error_404(res);

  // so are what we've been asked for real tags?
  const tags = await Tags.by_ids(request_tags, db);
  if (tags.length == 0) // nope!
    return error_404(res);

  const tag_ids = stream_from(tags).map(t => t.tag_id).uniq().join(',');

  const sort_order = req.query['sort'] ? req.query['sort'] : 'slug';

  const description = `All content with the '${tag_ids}' ${tags[0].tag_type}`;
  const artefacts = Artefacts.by_tags(db, tag_ids, req.query["role"],
				      { sort: sort_order,
					filter: tag_extra_params(req) });

  send_artefacts(req, res, artefacts, description, db, url_helper);
} // handle_params

function send_artefacts(req, res, artefacts, description, db, url_helper) {
  if (!artefacts)
    return error_404(res);

  artefacts.then(as => res.artefacts(req, as, description, url_helper));
} // artefacts

function with_tag_formatter(req, res, db, url_helper) {
  if (req.query["tag"])
    return tag_param(req, res, db, url_helper);

  if (req.query["type"])
    return type_param(req, res, db, url_helper);

  return handle_params(req, res, db, url_helper);
} // with_tags_formatter

function make_with_tag_formatter(db, url_helper) {
  return (req, res) =>
    with_tag_formatter(req, res, db, url_helper);
} // make_with_tag_formatter

module.exports = make_with_tag_formatter;

///////////////////////////
///////////////////////////
const modifiers = [
  'sort',
  'author',
  'node',
  'organization_name',
  'role',
  'whole_body',
  'page',
  'order_by',
  'summary'
];

const tag_extras = [
  'author',
  'node',
  'organization_name'
];

function tag_extra_params(req) {
  return grab_request_params(req, tag_extras);
} // tag_extras

function modifier_params(req) {
  return grab_request_params(req, modifiers);
} // modifiers

function grab_request_params(req, names) {
  const m = {};
  for (const p of names)
    if (req.query[p])
      m[p] = req.query[p];
  return m;
} // grab_request_params

function uniq_by_tag_type() {
  const seen = {};
  return (tag) => {
    if (seen[tag.tag_type])
      return false;
    return seen[tag.tag_type] = true;
  };
} // uniq
