const tags = require('../mongo_documents/tags.js');
const error_503 = require('./error_503.js');

function tags_formatter(req, res, db, url_helper) {
  const tag_type = req.query['type'];
  const label = tag_type ? `${tag_type} tags` : "All tags";

  tags.by_type(tag_type, db).
    then(ts => res.tags(req, ts, label, url_helper)).
    catch(err => {
      console.log(err);
      error_503(res);
    });
} // tags_formatter

function make_tag_formatter(db, url_helper) {
  return (req, res) =>
    tags_formatter(req, res, db, url_helper);
} // make_tag_formatter

module.exports = make_tag_formatter;
