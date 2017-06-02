const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');
const artefacts_collection = db.get('artefacts');
const editions_collection = db.get('editions');

describe('Artefact', () => {
  expect_404('artefact does not exist', 'unleash-the-hounds');
  expect_404('if artefact is in draft', 'a-draft-artefact');
  expect_404('if live date is in the future', 'future-live');
  expect_410('if artefact is archived', 'archived-artefact');

  before(async() => {
    // this date munging is so horrible
    const the_future = new Date();
    the_future.setTime(Date.now() + (24*60*60*1000));
    await artefacts_collection.insert([
      {
	'name': 'a-draft-artefact',
	'slug': 'a-draft-artefact',
	'state': 'draft',
	'tag_ids': ['odi']
      },
      {
	'name': 'future-live',
	'slug': 'future-live',
	'state': 'published',
	'live_at': the_future,
	'tag_ids': ['odi']
      },
      {
	'name': 'archived-artefact',
	'slug': 'archived-artefact',
	'state': 'archived',
	'tag_ids': ['odi']
      }

    ]);
  });

  after(async() => {
    await artefacts_collection.remove({});
    await editions_collection.remove({});
  });
});

//////////////////////////
function expect_404(label, slug) {
  expect._404(`404 when ${label}`, `/${slug}.json`);
} // expect_404

function expect_410(label, slug) {
  expect._410(`410 when ${label}`, `/${slug}.json`);
} // expect_410
