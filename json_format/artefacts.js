const stream_of = require('rillet').of;
const stream_from = require('rillet').from;
const tag_format = require('./tags.js');
const showdown = require('showdown');

function edition_or_artefact(artefact, edition_field, artefact_field) {
  if (artefact.edition && artefact.edition[edition_field])
    return artefact.edition[edition_field];
  return artefact[artefact_field];
} // edition_field

function basic_artefact_format(artefact, url_helper) {
  return {
    'id': url_helper.artefact_url(artefact),
    'web_url': url_helper.artefact_web_url(artefact),
    'slug': artefact.slug,
    'title': edition_or_artefact(artefact, 'title', 'name'),
    'format': underscorify(edition_or_artefact(artefact, 'format', 'kind')),
    'updated_at': updated_date(artefact),
    'created_at': created_date(artefact),
    'tag_ids': artefact.tag_ids
  };
} // basic_artefact_format

function related_artefacts_format(artefact, url_helper) {
  const related = artefact.related_artefacts;
  if (!related)
    return;

  return stream_from(related).
    map(r => related_artefact_format(r, url_helper)).
    toArray();
} // related_artefacts_format

function related_artefact_format(related_artefact, url_helper) {
  const pretty = basic_artefact_format(related_artefact, url_helper);

  if (related_artefact.type == "Event") {
    pretty.extras = {};
    merge_fields(pretty.extras,
		 ['start_date', 'end_date', 'location'],
		 related_artefact.edition);
  } // if ...

  return pretty;
} // related_artefact_format

function external_links_format(artefact, url_helper) {
  return stream_from(artefact.external_links).
    map(l => { return { 'title': l.title, 'url': l.url }; }).
    toArray();
} // external_links_format

function author_format(artefact, url_helper) {
  const author = artefact.author_artefact;
  if (!author || !author.edition)
    return {}

  return {
    'name': author.edition.title,
    'slug': author.slug,
    'state': author.edition.state,
    'web_url': url_helper.artefact_web_url(author),
    'tag_ids': author.tag_ids
  }
} // author_format

function artist_format(artefact, url_helper) {
  const artist = artefact.artist;
  if (!artist)
    return;

  return {
    "artist": {
      "name": artist.name,
      "slug": artist.slug
    }
  };
} // artist_format

function organization_format(artefact, url_helper) {
  const organizations = artefact.organizations;
  if (!organizations || organizations.length == 0)
    return [];

  return organizations.map(o => {
    return {
      'name': o.edition.title,
      'slug': o.slug,
      'url_helper': url_helper.artefact_web_url(o)
    }
  });
} // organization_format

function asset_format(asset) {
  if (!asset)
    return {};
  return {
    "web_url": asset["file_url"],
    "versions": asset["file_versions"],
    "content_type": asset["content_type"],
    "title": asset["title"],
    "source": asset["source"],
    "description": asset["description"],
    "creator": asset["creator"],
    "attribution": asset["attribution"],
    "subject": asset["subject"],
    "license": asset["license"],
    "spatial": asset["spatial"]
   };
} // asset_format

//////////////////////////////////
function format(artefact, url_helper) {
  const pretty = basic_artefact_format(artefact, url_helper);

  pretty.tags = tag_format(artefact.tags, url_helper);

  // populate the details
  pretty.details = {}

  merge_fields(pretty.details, BASE_FIELDS, artefact);
  merge_fields(pretty.details, OPTIONAL_FIELDS, artefact.edition);
  merge_fields(pretty.details, ODI_FIELDS, artefact.edition);

  pretty.related_external_links = external_links_format(artefact, url_helper);
  pretty.related = related_artefacts_format(artefact, url_helper);
  pretty.details.organizations = pretty.organizations = organization_format(artefact, url_helper);
  pretty.details.author = pretty.author = author_format(artefact, url_helper);
  pretty.details.artist = artist_format(artefact, url_helper);

  if (artefact.asset_ids)
    for (const {field} of artefact.asset_ids)
      pretty.details[field] = asset_format(artefact.assets[field]);

  return pretty;
} // format

module.exports = format;

///////////////////////////////////////////////
function underscorify(str) {
  if (!str)
    return str;
  return str.replace(/ /g, '_');
} // underscorify

function merge(object1, object2) {
  for (const [k,v] of Object.entries(object2))
    object1[k] = v;
  return object1;
} // merge

function merge_fields(destination, field_names, source) {
  if (!source)
    return;
  stream_of(field_names).flatten().
    filter(f => source[f] !== undefined).
    map(f => [f, source[f]]).
    map(fv => convertIfGovspeak(...fv)).
    map(fv => convertIfDate(...fv)).
    map(fv => attachmentToImage(...fv)).
    forEach(([f, v]) => destination[f] = v);
} // merge_fields

function attachmentToImage(f,v) {
  return[f, attachmentImage(v)];
}

function attachmentImage(v) {
  const str_replace = require('str_replace');
  var pattern = /attachment\[([^,;]*),([^,;]*),([^,;]*),([^\]]*)]/gm;
  while (match = pattern.exec(v)) {
    match[2] = str_replace('<em>','_',match[2]);
    match[2] = str_replace('</em>','_',match[2]);
    v = str_replace(match[0].trim(),'<img src="'+match[2].trim()+'" alt="'+match[3].trim()+'" class="'+match[4].trim()+'" id="'+match[1].trim()+'">',v);
  }
  var pattern = /attachment\[([^,;]*),([^,;]*),([^,;]*)]/gm;
  while (match = pattern.exec(v)) {
      match[2] = str_replace('<em>','_',match[2]);
      match[2] = str_replace('</em>','_',match[2]);
      v = str_replace(match[0].trim(),'<img src="'+match[2].trim()+'" alt="'+match[3].trim()+'" id="'+match[1].trim()+'">',v);
  }
  return v;
}

function convertIfGovspeak(f, v) {
  if (GOVSPEAK.indexOf(f) == -1)
    return [f, v];
  converter = new showdown.Converter();
  return [f, converter.makeHtml(v)];
} // convertIfGovspeak

function convertIfDate(f, v) {
  if (!f.endsWith('date') || (typeof(v) == 'string') || (!v))
    return [f, v];

  return [f, content_api_date(v)];
} // convertIfDate

function updated_date(artefact) {
  try {
    const ud = stream_of(artefact.updated_at, artefact.edition ? artefact.edition.updated_at : undefined).
  	filter(d => d).
 	max();
    return ud ? content_api_date(ud) : '';
  } catch(err) {
    return '';
  } // catch
} // updated_date


function created_date(artefact) {
  return artefact.created_at ? content_api_date(artefact.created_at) : '';
} // created_date

// if javascripts toISOString is ok, we can use that instead
function content_api_date(date) {
  return date.getUTCFullYear() +
        '-' + pad(date.getUTCMonth() + 1) +
        '-' + pad(date.getUTCDate()) +
        'T' + pad(date.getUTCHours()) +
        ':' + pad(date.getUTCMinutes()) +
        ':' + pad(date.getUTCSeconds()) +
        '+00:00';
} // content_api_date

function pad(n) {
  return (n < 10) ? `0${n}` : n;
} // pad

const BASE_FIELDS = [
  'need_id',
  'business_proposition',
  'description',
  'excerpt',
  'language',
  'need_extended_font'
];

const OPTIONAL_FIELDS = [
  'additional_information',
  'alternate_methods',
  'alternative_title',
  'body',
  'change_description',
  'introduction',
  'link',
  'more_information',
  'organiser',
  'place_type',
  'reviewed_at',
  'short_description',
  'summary',
  'video_summary',
  'video_url'
];

const ODI_FIELDS = [
  'honorific_prefix',
  'honorific_suffix',
  'role',
  'description',
  'affiliation',
  'url',
  'telephone',
  'twitter',
  'linkedin',
  'github',
  'email',
  'length',
  'outline',
  'outcomes',
  'audience',
  'prerequisites',
  'requirements',
  'materials',
  'subtitle',
  'content',
  'end_date',
  'media_enquiries_name',
  'media_enquiries_email',
  'media_enquiries_telephone',
  'location',
  'salary',
  'closing_date',
  'joined_at',
  'graduated',
  'tagline',
  'involvement',
  'want_to_meet',
  'case_study',
  'date_published',
  'course',
  'date',
  'price',
  'trainers',
  'start_date',
  'booking_url',
  'hashtag',
  'level',
  'region',
  'end_date',
  'beta',
  'join_date',
  'area',
  'host',
  'event_type'
];

const GOVSPEAK = [
  'content',
  'description',
  'license_overview',
  'body'
];
