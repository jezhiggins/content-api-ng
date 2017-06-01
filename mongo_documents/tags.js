function find_tags(db, options) {
  const tags_collection = db.get('tags');
  return tags_collection.find(options);
} // all_tags

function tags(db) {
  return find_tags(db, {});
} // tags

function by_type(type = '<all>', db) {
  if (type == '<all>')
    return tags(db);
  return find_tags(db, {'tag_type': type});
} // by_type

function by_ids(tag_ids, db) {
  // find tags matching the supplied ids, ignoring keywords
  const query = {
    '$and': [
      { 'tag_id': { '$in': tag_ids.split(',') } },
      { 'tag_type': { '$nin': ['keyword'] } }
    ]
  };
  return find_tags(db, query);
} // by_ids

function scoped(tag_id_array, db) {
  // find tags matching the supplied ids, including keywords, but excluding roles
  const query = {
    '$and': [
      { 'tag_id': { '$in': tag_id_array } },
      { 'tag_type': { '$nin': ['role'] } }
    ]
  };

  return find_tags(db, query);
} // scoped

module.exports = tags;
tags.by_type = by_type;
tags.by_ids = by_ids;
tags.scoped = scoped;
tags.find = find_tags;
