const stream_of = require('rillet').of;

function format(artefact, url_helper, extra_fields = []) {
  const formatted = {
    'title': edition_or_artefact(artefact, 'title', 'name'),
    'url': url_helper.artefact_web_url(artefact),
    'author': author_name(artefact),
    'tags': artefact.tag_ids.join(),
    'created_at': artefact.created_at.toISOString(),
    'updated_at': artefact.updated_at.toISOString(),
    'excerpt': artefact.excerpt
  };

  merge_fields(formatted, extra_fields, artefact.edition);

  return formatted;
} // format

module.exports = format;

////////////////////////////////////
function merge_fields(destination, field_names, source) {
  if (!source)
    return;
  stream_of(field_names).flatten().
    map(f => [f, source[f]]).
    map(fv => convertIfDate(...fv)).
    forEach(([f, v]) => destination[f] = v);
} // merge_fields

function convertIfDate(f, v) {
  if (!f.endsWith('date') || (typeof(v) == 'string') || (!v))
    return [f, v];

  return [f, v.toISOString()];
} // convertIfDate

function author_name(artefact) {
  const author = artefact.author_artefact;
  if (!author || !author.edition)
    return '';

  return author.edition.title;
} // author_name

function edition_or_artefact(artefact, edition_field, artefact_field) {
  if (artefact.edition && artefact.edition[edition_field])
    return artefact.edition[edition_field];
  return artefact[artefact_field];
} // edition_field
