const error_404 = require('./error_404.js');
const error_503 = require('./error_503.js');
const Tags = require('../mongo_documents/tags.js');
const Tag_types = require('../mongo_documents/tag_types.js');

function handle_tag_type(tag_type, req, res, db, url_helper) {
  // original code has additional handling for parent_id and root_sections
  // query parameters, which involves searching by parent_id - however,
  // there are no tags in the db with that field
  const tag_type_name = tag_type.singular;

  const label = `All '${tag_type_name}' tags`;

  Tags.by_type(tag_type_name, db).
    then(ts => res.tags(req, ts, label, url_helper)).
    catch(err => {
      console.log(err);
      error_503(res);
    });
} // handle_tag_type

async function redirect_to_tag(type_or_id, res, db, url_helper) {
  const tag_type = Tag_types.from_singular(type_or_id);
  if (tag_type)
    return res.redirect(url_helper.tag_type_url(tag_type));

  // Tags used to be accessed through /tags/tag_id.json, so we check here
  // whether one exists to avoid breaking the Web. We only check for section
  // tags, as at the time of change sections were the only tag type in use
  // in production
  const section = await Tags.by_type_and_id('section', type_or_id, db);
  if (!section)
    return error_404(res);

  res.redirect(url_helper.tag_url(section));
} // redirect_to_tag

function tags_type_or_id_formatter(req, res, db, url_helper) {
  const type_or_id = req.params['tag_type_or_id'];
  const tag_type = Tag_types.from_plural(type_or_id);

  if (tag_type)
    return handle_tag_type(tag_type, req, res, db, url_helper);

  return redirect_to_tag(type_or_id, res, db, url_helper);
} // tags_type_or_id_formatter

function make_tags_type_or_id_formatter(db, url_helper) {
  return (req, res) =>
    tags_type_or_id_formatter(req, res, db, url_helper);
} // make_tags_type_or_id_formatter

module.exports = make_tags_type_or_id_formatter;
