const expect = require('./request_tests.js');

const app = require('../../app');
const request = require('supertest')(app);
const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');
const artefacts_collection = db.get('artefacts');
const editions_collection = db.get('editions');

describe('Course instance', () => {
  expect_404("No params given");
  expect_404("No date given", "potato-peeling");
  expect_404("No course given", undefined, "2017-06-29");
  expect_404("Non-existant course", "fish-frying", "2017-05-04");
  expect_404("Course exists but date is wrong", "potato-peeling", "1975-05-29");
  expect_404("Course exists but date is bad", "potato-peeling", "2013-05-95");
  ok("Fetch course", "potato-peeling", "2017-06-01", (body) => {
    equal(body.slug, 'advanced-potato-peeling');
    equal(body.title, 'Advanced Spud Bashing');
    equal(body.details.course, 'potato-peeling');
  });
  ok("Fetch course", "potato-peeling", "2017-05-01", (body) => {
    equal(body.slug, 'intro-potato-peeling');
    equal(body.title, 'Introductory Potato Peeling');
    equal(body.details.course, 'potato-peeling');
  });

  ///////////////////////////////////////////
  before(async() => {
    await artefacts_collection.insert([
      {
	'name': 'Advanced Potato Peeling',
	'owning_app': 'publisher',
	'description': 'How to peel especially nobbly potatoes',
	'state': 'live',
	'kind': 'article',
	'slug': 'advanced-potato-peeling',
	'tag_ids': []
      },
      {
	'name': 'Introduction to Potato Peeling',
	'owning_app': 'publisher',
	'description': 'What is a potato, and how do we peel it?',
	'state': 'live',
	'kind': 'article',
	'slug': 'intro-potato-peeling',
	'tag_ids': []
      }
    ]);
    await editions_collection.insert([
      {
	'title': 'Advanced Spud Bashing',
	'_type': 'CourseInstanceEdition',
	'state': 'published',
	'date': new Date(2017, 5, 1, 8, 30), // actually June
	'slug': 'advanced-potato-peeling',
	'course': 'potato-peeling'
      },
      {
	'title': 'Introductory Potato Peeling',
	'_type': 'CourseInstanceEdition',
	'state': 'published',
	'date': new Date(2017, 4, 1, 8, 30), // actually May
	'slug': 'intro-potato-peeling',
	'course': 'potato-peeling'
      }
    ]);
  });

  after(async() => {
    await artefacts_collection.remove({});
    await editions_collection.remove({});
  });
});

function expect_404(label, course, date) {
  expect._404(label, build_path(course, date));
} // expect_404

function ok(label, course, date, test) {
  expect.ok(label, build_path(course, date), test);
} // ok

function build_path(course, date) {
  let path = '/course-instance.json?';
  if (date)
    path += `date=${date}`;
  if (date && course)
    path += '&';
  if (course)
    path += `course=${course}`;
  return path;
} // build_path
