const artefact_format = require('./artefacts.js');

const LECTURE_FIELDS = [
  'location',
  'start_date',
  'end_date',
  'booking_url',
  'event_type'
];

function format_lecture(lecture, url_helper) {
  return artefact_format(lecture, url_helper, LECTURE_FIELDS);
} // format_lecture

module.exports = format_lecture;
