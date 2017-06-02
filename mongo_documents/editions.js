const stream_from = require('rillet').from;
const wrap_edition = require('./edition_classes.js');

async function find(db, query, projection) {
  const editions = [];
  const editions_collection = db.get('editions');
  await editions_collection.find(query).
        each((edition, {close, pause, resume}) => {
	  editions.push(wrap_edition(edition));
	  resume();
	});
  return editions;
} // find
async function findOne(db, query, projection) {
  const editions = await find(db, query, projection);
  return editions.length ? editions[0] : null;
} // findOne

async function for_artefacts(db, artefacts, state = 'published') {
  if (artefacts.length == 0)
    return [];

  const slugs = artefacts.map(a => a.slug);
  const query = {
    'slug': { '$in': slugs },
    'state': state
  };
  const editions = await find(db, query);

  const slug_edition = {};
  editions.forEach(e => slug_edition[e.slug] = e);
  return slug_edition;
} // for_artefacts

async function for_artefact(db, artefact, version_number = null) {
  if (version_number)
    return findOne(db, { 'slug': artefact.slug, 'version_number': Number(version_number) });

  return await findOne(db, {'slug': artefact.slug, 'state': 'published'});
  if (!edition)
    edition = await findOne(db, {'slug': artefact.slug }, { 'sort': {'version_number': -1} });
  return edition;
} // for_artefact

async function map_onto(db, artefacts) {
  const editions = await for_artefacts(db, artefacts);

  // plug editions into artefacts, discarding any artefacts without editions
  const results = stream_from(artefacts).
	//filter(a => a.owning_app == 'publisher').
	filter(a => editions[a.slug]).
	map(a => (a.edition = editions[a.slug], a)).
	toArray();

  return results;
} // map_onto

async function attach_edition(db, artefact, version_number) {
  const edition = await for_artefact(db, artefact, version_number);
  artefact.edition = edition;
  return edition;
} // attach_edition

exports.find = find;
exports.map_onto = map_onto;
exports.for_artefact = attach_edition;
