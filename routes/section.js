const error_404 = require('./error_404.js');
const error_503 = require('./error_503.js');
const Sections = require('../mongo_documents/sections.js');

async function section_formatter(req, res, db, url_helper) {
  const section_id = req.query['id'];

  if (!section_id)
    return error_404(res);

  const section = await Sections.by_id(db, section_id);
  if (!section)
    return error_404(res);

  res.section(req, section, url_helper);
} // section_formatter

function make_section_formatter(db, url_helper) {
  return (req, res) =>
    section_formatter(req, res, db, url_helper);
} // make_section_formatter

module.exports = make_section_formatter
