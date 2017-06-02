function format_tag(tag, url_helper) {
  if (!tag)
    return { };

  return {
    'id': url_helper.tag_url(tag),
    'title': tag.title,
    'description': tag.description,
    'type': tag.tag_type,
    'web_url': url_helper.tag_web_url(tag),
    'slug': tag.tag_id
  };
} // format_tag

module.exports = format_tag;
