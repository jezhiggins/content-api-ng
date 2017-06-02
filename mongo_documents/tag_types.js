const stream_from = require('rillet').from;
const singular = require('pluralize').singular;

const known_tag_types = [
  // from odi_content_models/app/decorators/models/artefact_decorator
  'sections',
  'writing_teams',
  'propositions',
  'featured',
  'keywords',
  'legacy_sources',
  'team',
  'person',
  'timed_item',
  'asset',
  'article',
  'organization',
  'event'
].map(tt => create_tag_type(tt));

function create_tag_type(tt_plural) {
  return {
    'singular': singular(tt_plural),
    'plural': tt_plural
  };
} // create_tag_type

//////////////////////////////////////
function count_tag_type(collection, tag_type, results) {
  return collection.count({'tag_type': tag_type.singular}).
    then(count => results[tag_type.singular] = count);
} // count_tag_type

async function all_tag_type_counts(db) {
  const tags_collection = db.get('tags');

  const counts = {};
  const countQueries = [];
  for (const tt of known_tag_types)
    countQueries.push(count_tag_type(tags_collection, tt, counts));
  await Promise.all(countQueries);

  return counts;
} // all_tag_type_counts

function tag_type_with_count(tt, counts) {
  return {
    'singular': tt.singular,
    'plural': tt.plural,
    'total': counts[tt.singular]
  };
} // tag_type_with_count

async function with_counts(db) {
  const counts = await all_tag_type_counts(db);
  return known_tag_types.map(tt => tag_type_with_count(tt, counts));
} // tag_types

function from_plural(plural) {
  return stream_from(known_tag_types).
    filter(t => t.plural == plural).
    firstOrDefault();
} // from_plural

function from_singular(singular) {
  return stream_from(known_tag_types).
    filter(t => t.singular == singular).
    firstOrDefault();
} // from_singular

exports.with_counts = with_counts;
exports.tag_types = known_tag_types;
exports.from_plural = from_plural;
exports.from_singular = from_singular;
