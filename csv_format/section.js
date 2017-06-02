const section_json_formatter = require('../json_format/section.js');

function format_section(section, url_helper) {
  const json = section_json_formatter(section, url_helper);
  return json.modules;
} // format_section

module.exports = format_section;
