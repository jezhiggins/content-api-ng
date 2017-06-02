const error_404 = require('./error_404.js');
const error_503 = require('./error_503.js');
const Editions = require('../mongo_documents/editions.js');
const single_artefact = require('./single_artefact.js');
const stream_from = require('rillet').from;

async function course_instance_formatter(req, res, db, url_helper) {
  const course = req.query['course'];
  const on_day = parse_date(req.query['date']);
  const edition = req.query['edition'];
  const role = req.query['role'];

  if (!course || !on_day)
    return error_404(res);

  const course_edition = await find_course(db, course, on_day);
  if (!course_edition)
    return error_404(res);

  single_artefact(course_edition.slug, req, res, db, url_helper).
    catch(err => {
      console.log(err);
      error_503(res);
    });
} // course_instance_formatter

function make_course_instance_formatter(db, url_helper) {
  return (req, res) =>
    course_instance_formatter(req, res, db, url_helper);
} // make_course_instance_formatter

module.exports = make_course_instance_formatter;

//////////////////////////////////////////////
async function find_course(db, course, on_day) {
  const next_day = new Date(on_day.getTime() + (24*60*60*1000));

  const query = {
    'course': course,
    '_type': 'CourseInstanceEdition',
    'state': 'published'
  };

  // can't seem to get date querying working properly in mongo
  const editions = await Editions.find(db, query);
  return stream_from(editions).
    filter(e => e.date.getTime() >= on_day.getTime()).
    filter(e => e.date.getTime() < next_day.getTime()).
    firstOrDefault();
} // find_course

function parse_date(date_str) {
  const date = new Date(date_str);
  return !isNaN(date) ? new Date(date.toISOString()) : undefined;
} // parse_date
