const Tags = require('./tags.js');
const Editions = require('./editions.js');
const stream_from = require('rillet').from;
const wrap_artefact = require('./artefact_class.js');

function by_type(db, type, role = 'odi', { sort, summary = false, limit, skip } = {}) {
  const query = {
    'kind': type,
    'tag_ids': role,
    'state': 'live'
  };

  return find(db, query, { sort: sort, summary: summary, limit: limit, skip: skip });
} // by_type

function format_filter(filter = {}) {
  const query = {};

  for (const [k,v] of Object.entries(filter)) {
    const f = (v != "all") ? v : { "$nin" : ['', null] };
    query[k] = f;
  } // for ...

  return query;
} // format_filter

function by_ids_or_slugs(db, ids, slugs) {
  const ids_query = { '_id': {'$in': ids } };
  const slug_query = { 'slug': {'$in': slugs } };

  const query = { '$or': [ ids_query, slug_query ] };

  return find(db, query, { sort: '<not-set>', summary: true });
} // by_ids_or_slugs

function by_tags(db, tags, role = 'odi',
		 { sort, filter = {}, summary = false, limit, skip } = {}) {
  const tag_query = tags.split(',').map(t => { return {'tag_ids': t}; });

  const query = format_filter(filter);
  query['$and'] = [
    {'$or': tag_query },
    { 'tag_ids': role },
  ];
  query['state'] = 'live';

  return find(db, query, { sort: sort, summary: summary, limit: limit, skip: skip });
} // by_tags

async function by_slug(db, slug, role = 'odi', { summary = false } = {}) {
  const query = {
    'slug': slug
  };

  const results = await find(db, query, { summary: summary });
  return results.length ? results[0] : null;
} // by_slug

async function find(db, query, { sort, summary = false, limit, skip }) {
  const projection = { }
  if (sort == 'date')
    projection.sort = {'created_at': -1};
  if (sort == 'slug')
    projection.sort = {'slug': 1};
  if (projection && limit)
    projection.limit = limit;
  if (projection && skip)
    projection.skip = skip;
  const artefacts = await do_find(db, query, projection);

  await populate_tags(db, artefacts);

  if (summary)
    return artefacts;

  await populate_related(db, artefacts);
  await populate_assets(db, artefacts);

  return artefacts;
} // find

async function do_find(db, query, projection) {
  const artefacts_collection = db.get('artefacts');
  const artefacts = [];
  await artefacts_collection.find(query, projection).
    each((artefact, {close, pause, resume}) => {
      artefacts.push(wrap_artefact(artefact));
      resume();
    });

  await Editions.map_onto(db, artefacts);

  return artefacts;
} // do_find

exports.by_type = by_type;
exports.by_tags = by_tags;
exports.by_slug = by_slug;

///////////////////////////
async function populate_tags(db, artefacts) {
  const all_tag_ids =
	stream_from(artefacts).
    	map(a => a.tag_ids).
	flatten().
	filter(id => id != 'odi').  // content_api is not return odi tags, either role or keyword, can't work out why
	uniq().
	toArray();

  const all_tags = await fetch_all_tags(all_tag_ids, db);
  artefacts.forEach(a => populate_artefact_tags(a, all_tags));
  return artefacts;
} // populate_tags

async function fetch_all_tags(all_tag_ids, db) {
  const tags = {};
  for (const tag of await Tags.scoped(all_tag_ids, db)) {
    if (tags[tag.tag_id])
      continue;
    tags[tag.tag_id] = tag;
  } // for ...
  return tags;
} // all_tags

function populate_artefact_tags(artefact, all_tags) {
  const tags = [];
  const tag_ids = [];

  for (const tag_id of artefact.tag_ids) {
    if (!all_tags[tag_id])
      continue;
    tag_ids.push(tag_id);
    tags.push(all_tags[tag_id]);
  } // for ...

  artefact.tag_ids = tag_ids;
  artefact.tags = tags;
} // populate_tags

//////////////////////////////////////
async function populate_related(db, artefacts) {
  const all_related_ids =
	stream_from(artefacts).
	filter(a => a.related_artefact_ids).
	map(a => a.related_artefact_ids).
	flatten().
	uniq().
	toArray();
  const all_related_slugs =
	stream_from(artefacts).
	map(a => [a.author, a.organization_name, a.edition ? a.edition.artist : undefined]).
	flatten().
	filter(a => a).
	uniq().
	toArray();

  if ((all_related_ids.length == 0) && (all_related_slugs.length == 0))
    return;

  const all_related = await fetch_all_related(db, all_related_ids, all_related_slugs);
  artefacts.forEach(a => populate_artefact_related(a, all_related));
  return artefacts;
} // populate_related

async function fetch_all_related(db, all_related_ids, all_related_slugs) {
  const related_artefacts = await by_ids_or_slugs(db, all_related_ids, all_related_slugs);

  const related = {};
  for (const artefact of related_artefacts) {
    related[artefact._id.toString()] = artefact;
    related[artefact.slug] = artefact;
  } // for ...
  return related;
} // fetch_all_related

function populate_artefact_related(artefact, all_related) {
  const related = [];
  if (artefact.related_artefact_ids)
    for (const related_id of artefact.related_artefact_ids) {
      const related_artefact = all_related[related_id.toString()];
      if (related_artefact)
	related.push(related_artefact);
    } // for ...
  artefact.related_artefacts = gather_related(all_related, artefact.related_artefact_ids);

  if (artefact.author && all_related[artefact.author])
    artefact.author_artefact = all_related[artefact.author];

  artefact.organizations = gather_related(all_related, artefact.organization_name).filter(o => o.edition);

  if (artefact.edition && artefact.edition.artist && all_related[artefact.edition.artist])
    artefact.artist = all_related[artefact.edition.artist];
} // populate_related

function gather_related(all_related, ids_or_slugs) {
  const related = [];
  if (ids_or_slugs)
    for (const related_id of ids_or_slugs) {
      const related_artefact = all_related[related_id.toString()];
      if (related_artefact)
	related.push(related_artefact);
    } // for ...
  return related;
} // gather_related

/////////////////////////////////////////////////
async function populate_assets(db, artefacts) {
  if (!db.asset_api_client)
    return;

  const all_asset_ids =
	stream_from(artefacts).
	map(a => a.asset_ids).
	flatten().
	filter(a => a).
	map(a => a.id).
	filter(a => a).
	uniq().
	toArray();

  if (all_asset_ids.length == 0)
    return;

  const all_assets = await fetch_all_assets(db.asset_api_client, all_asset_ids);
  artefacts.forEach(a => populate_artefact_assets(a, all_assets));
  return artefacts;
} // populate_assets

async function fetch_all_assets(asset_api_client, asset_ids) {
  const assets = {};

  const fetched_assets = await asset_api_client.get(asset_ids);
  for (const asset of fetched_assets)
    if (asset)
      assets[asset.id] = asset;

  return assets;
} // fetch_all_assets

function populate_artefact_assets(artefact, all_assets) {
  if (!artefact.asset_ids)
    return;

  const assets = { }
  for (const {field, id} of artefact.asset_ids) {
    const asset = all_assets[id];
    assets[field] = asset;
  } // for ...

  artefact.assets = assets;
} // populate_artefact_assets
