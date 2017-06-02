const tag_types = require('../mongo_documents/tag_types.js');
const error_503 = require('./error_503.js');

function tag_types_formatter(req, res, db, url_helper) {
  tag_types.with_counts(db).
    then(tts => res.tag_types(req, tts, url_helper)).
    catch(err => {
      console.log(err);
      error_503(res);
    });
} // tag_types_formatter

function make_tag_types_formatter(db, url_helper) {
  return (req, res) =>
    tag_types_formatter(req, res, db, url_helper);
} // make_tag_types_json_formatter

module.exports = make_tag_types_formatter;
