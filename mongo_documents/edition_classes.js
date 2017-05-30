const stream_from = require('rillet').from;

function wrap_edition(edition) {
  switch (edition._type) {
  case 'ArticleEdition':
    return new ArticleEdition(edition);
  case 'CaseStudyEdition':
    return new CaseStudyEdition(edition);
  case 'CourseEdition':
    return new CourseEdition(edition);
  case 'CourseInstanceEdition':
    return new CourseInstanceEdition(edition);
  case 'EventEdition':
    return new EventEdition(edition);
  case 'JobEdition':
    return new JobEdition(edition);
  case 'NodeEdition':
    return new NodeEdition(edition);
  case 'OrganizationEdition':
    return new OrganizationEdition(edition);
  case 'PersonEdition':
    return new PersonEdition(edition);
  case 'ReportEdition':
    return new ReportEdition(edition);
  case 'TimedItemEdition':
    return new TimedItemEdition(edition);
  default:
    if (edition._type)
      console.log(`No wrapper class for ${edition._type}`);
    return new Edition(edition);
  } // switch ...
} // wrap_edition

module.exports = wrap_edition;

////////////////////////////////////////////////
class Edition {
  constructor(edition) {
    this.business_propostion = false;
    for (const [k,v] of Object.entries(edition))
      this[k] = v;
  } // constructor


  ////////////////////
  tag_to_rendering_path(url_map) {
    let section = stream_from(this.artefact.tags).
	map(t => url_map[t.tag_id]).
	filter(t => t).
	uniq().
	join();
    if (!section && url_map['default'])
      section = url_map['default'];

    return section ? `/${section}/${this.slug}` : `${this.slug}`;
  } // tag_to_rendering_path
  /*
    def tag_to_rendering_path(url_map)
      section = artefact.tags.map{|x| url_map[x.tag_id]}.compact.uniq.join
      section = url_map[:default] if section.blank? && url_map[:default]
      "#{'/' unless section.blank?}#{section}/#{slug}"
    end
  */
} // class Edition

class ArticleEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.content; }

  get rendering_path() {
    return this.tag_to_rendering_path({
      'news': 'news',
      'blog': 'blog',
      'guide': 'guides',
      'media': 'media'
    });
  } // rendering_path
} // ArticleEdition

class CaseStudyEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.content; }

  get rendering_path() { return `/case-studies/${this.slug}`; }
} // CaseStudyEdition

class CourseEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() { return `/courses/${this.slug}`; }
} // class CourseEdition

class CourseInstanceEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() {
    const date_string = this.date.getUTCFullYear() +
          '-' + pad(this.date.getUTCMonth() + 1) +
          '-' + pad(this.date.getUTCDate());
    return `/courses/${this.course}/${date_string}`;
  } // rendering_path
} // class CourseInstanceEdition

function pad(n) { return (n < 10) ? `0${n}` : n; }

class CreativeWorkEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() { return `/culture/${this.slug}`; }
} // CreativeWorkEdition

class EventEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() {
    return this.tag_to_rendering_path({
      'event:lunchtime-lecture': 'lunchtime-lectures',
      'event:meetup': 'meetups',
      'event:research-afternoon': 'research-afternoons',
      'event:open-data-challenge-series': 'challenge-series',
      'event:roundtable': 'roundtables',
      'event:workshop': 'workshops',
      'event:networking-event': 'networking-events',
      'event:panel-discussion': 'panel-discussions',
      'event:summit': 'summit',
      'event:summit-session-2016': 'summit/2016/sessions',
      'event:summit-training-day-session-2016': 'summit/2016/training-day/sessions',
      'default': 'events'
    });
  } // rendering_path
} // EventEdition

class JobEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() { return `/jobs/${this.slug}`; }
} // class JobEdition

class NodeEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() { return `/nodes/${this.slug}`; }

  get latlng() { return [location[0], location[1]].join(','); }
} // class NodeEdition

class OrganizationEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() {
    return this.tag_to_rendering_path({
      'start-up': 'start-ups',
      'member': 'members'
    });
  } // rendering_path
} // class OrganizationEdition

class PersonEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.description; }

  get rendering_path() {
    return this.tag_to_rendering_path({
      'team': 'team',
      'summit-speaker-2016': 'summit/2016/speakers'
    });
  } // render_path
} // class PersonEdition

class ReportEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return ''; }

  get rendering_path() { return `/reports/${this.slug}`; }
} // class ReportEdition

class TimedItemEdition extends Edition {
  constructor(edition) {
    super(edition);
  } // constructor

  get whole_body() { return this.content; }

  get rendering_path() {
    return this.tag_to_rendering_path({
      'consultation-response': 'consultation-responses',
      'procurement': 'procurement'
    });
  } // rendering_path
} // class TimedItemEdition
