const error_404 = require('./error_404.js');
const error_503 = require('./error_503.js');
const Tags = require('../mongo_documents/tags.js');
const Tag_types = require('../mongo_documents/tag_types.js');
const format_tag = require('../json_format/tags.js');

async function tag_type_and_id_formatter(req, res, db, url_helper) {
  const tag_type = Tag_types.from_plural(req.params['tag_type']);
  if (!tag_type)
    return error_404(res);

  const tag = await Tags.by_type_and_id(tag_type.singular, req.params['tag_id'], db);
  if (!tag)
    return error_404(res);

  res.tag(req, tag, url_helper);
} // tag_type_and_id_formatter

function make_tag_type_and_id_formatter(db, url_helper) {
  return (req, res) =>
    tag_type_and_id_formatter(req, res, db, url_helper);
} // make_tag_type_and_id_formatter

module.exports = make_tag_type_and_id_formatter;
