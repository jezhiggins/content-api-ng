const expect = require('./request_tests.js');

const equal = require('assert').equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');
const artefacts_collection = db.get('artefacts');
const editions_collection = db.get('editions');

describe('With Tag, type param', () => {
  for (const [type, count] of [['job', 5], ['case_study', 35]])
    test_with_tag(
      `return live artefacts of type ${type}`,
      `?type=${type}`,
      body => equal(body.results.length, count)
    );

  for (const [type, count] of [['jobs', 5], ['case_studies', 35]])
    test_with_tag(
      `return live artefacts of plural type ${type}`,
      `?type=${type}`,
      body => equal(body.results.length, count)
    );

  test_with_tag(
    "return zero-length list if no artefacts of type",
    "?type=article",
    body => equal(body.results.length, 0)
  );

  for (const [role, title] of [['foo', 'course foo'], ['bar', 'course bar']])
    test_with_tag(
      `return artefacts for role ${role}`,
      `?type=course&role=${role}`,
      body => {
	equal(body.results.length, 1);
	equal(body.results[0].title, title);
      }
    );

  /////////////////////////////////////////
  before(async () => {
    const test_artefacts = [];
    const test_editions = [];

    for (let i = 0; i != 5; ++i) {
      test_artefacts.push({
	'title': `job ${i}`,
	'state': 'live',
	'kind': 'job',
	'slug': `job-${i}`,
	'tag_ids': ['odi', 'job']
      });
      test_editions.push({
	'title': `job ${i}`,
	'slug': `job-${i}`,
	'state': 'published'
      });
    } // for ...
    test_artefacts.push({
      'title': `job not live`,
      'state': 'pending',
      'kind': 'job',
      'slug': 'job-not',
      'tag_ids': ['odi', 'job']
    });
    test_editions.push({
      'title': `job dead`,
      'slug': 'job-not',
      'state': 'published'
    });
    for (let i = 0; i != 35; ++i) {
      test_artefacts.push({
	'title': `case study ${i}`,
	'state': 'live',
	'kind': 'case_study',
	'slug': `case-study-${i}`,
	'tag_ids': ['odi', 'case_studies']
      });
      test_editions.push({
	'title': `study ${i}`,
	'slug': `case-study-${i}`,
	'state': 'published'
      });
    }
    test_artefacts.push({
      'title': `case study cancelled`,
      'state': 'cancelled',
      'kind': 'case_study',
      'slug': 'case-study-not',
      'tag_ids': ['odi', 'case_studies']
    });
    test_editions.push({
      'title': `study not`,
      'slug': `case-study-not'}`,
      'state': 'published'
    });

    for (const r of ['foo', 'bar']) {
      test_artefacts.push({
	'title': `course ${r}`,
	'state': 'live',
	'slug': `course-${r}`,
	'kind': 'course',
	'tag_ids': [r, 'course']
      });
      test_editions.push({
	'title': `course ${r}`,
	'slug': `course-${r}`,
	'state': 'published'
      });
    }

    await artefacts_collection.insert(test_artefacts);
    await editions_collection.insert(test_editions);
  });

  after(async() => {
    await artefacts_collection.remove({});
    await editions_collection.remove({});
  });
});

function test_with_tag(label, query, test) {
  expect.ok(label, `/with_tag.json${query}`, test);
}
