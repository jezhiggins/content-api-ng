const Tags = require('./tags.js');

async function by_id(db, section_id) {
  const section_tag = await find_section(db, section_id);
  if (!section_tag)
    return;

  await attach_image(db, section_tag, 'hero_image');

  section_tag.modules = await find_modules(db, section_tag.modules);

  return section_tag;
} // by_id

exports.by_id = by_id;

///////////////////////////////
async function find_section(db, section_id) {
  const query = {
    'tag_id': section_id,
    'tag_type': 'section'
  };
  const tags = await Tags.find(db, query);
  return tags.length ? tags[0] : undefined;
} // find_section

async function find_modules(db, module_ids) {
  const modules = [];
  const module_collection = db.get('section_modules');
  // do in turn because we need to maintain order, and there aren't many anyway
  for (const id of module_ids) {
    const module = await module_collection.findOne({'_id': id});
    await attach_image(db, module, 'image');
    modules.push(module);
  } // for ...
  return modules;
} // find_modules

async function attach_image(db, obj, field) {
  if (!db.asset_api_client)
    return;

  const image_id = obj[`${field}_id`];
  if (!image_id)
    return;

  const image = await db.asset_api_client.get(image_id);
  obj.assets = { };
  obj.assets[field] = image;
} // attach_image
