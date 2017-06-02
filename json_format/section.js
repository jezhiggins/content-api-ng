const stream_from = require('rillet').from;

function format_section(section, url_helper) {
  return {
    'title': section.title,
    'link': section.link,
    'description': section.description,
    'hero': asset_image(section, 'hero_image'),
    'modules': modules(section)
  };
} // format_section

function format_module(module) {
  switch (module.type) {
  case 'Text':
    return format_text_module(module);
  case 'Image':
    return format_image_module(module);
  case 'Frame':
    return format_frame_module(module);
  } // switch
} // format_module

function format_text_module(module) {
  return {
    'title': module.title,
    'type': module.type,
    'text': module.text,
    'colour': module.colour,
    'link': module.link
  };
} // format_text_module

function format_image_module(module) {
  return {
    'title': module.title,
    'type': module.type,
    'image': asset_image(module, 'image'),
    'link': module.link
  };
} // format_image_module

function format_frame_module(module) {
  return {
    'title': module.title,
    'type': module.type,
    'frame': module.frame
  };
} // format_frame_module

module.exports = format_section;

///////////////////////////
function asset_image(obj, field) {
  return (obj.assets && obj.assets[field]) ?
    obj.assets[field].file_url :
    null;
} // asset_image

function modules(section) {
  return stream_from(section.modules).
    map(m => format_module(m)).
    toArray();
} // modules
