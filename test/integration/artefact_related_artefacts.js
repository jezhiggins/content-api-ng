const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');
const artefacts_collection = db.get('artefacts');
const editions_collection = db.get('editions');

const related_a = {
    'name': 'related a',
    'slug': 'related-a',
    'state': 'live',
    'tag_ids': ['odi']
};
const related_b = {
    'name': 'related b',
    'slug': 'related-b',
    'state': 'live',
    'tag_ids': ['odi']
};
const related_artefacts = [
  related_b,
  related_a
];

describe('Artefact related artefacts', () => {
  test_artefact('has related artefacts', 'with-related-artefacts', body => {
    equal(body.related.length, related_artefacts.length);
  });

  test_artefact('artefacts are in related order', 'with-related-artefacts', body => {
    equal(body.related[0].slug, related_b.slug);
    equal(body.related[1].slug, related_a.slug);
  });

  before(async() => {
    await artefacts_collection.insert(related_artefacts);
    const a = await artefacts_collection.findOne({'slug': related_a.slug});
    const b = await artefacts_collection.findOne({'slug': related_b.slug});

    await artefacts_collection.insert(
      {
	'name': 'With Related Artefacts',
	'slug': 'with-related-artefacts',
	'state': 'live',
	'tag_ids': ['odi'],
	'related_artefact_ids': [b._id, a._id]
      });
    await editions_collection.insert(
      {
	'slug': 'with-related-artefacts',
	'state': 'published'
      });
  });

  after(async() => {
    await artefacts_collection.remove({});
    await editions_collection.remove({});
  });
});

//////////////////////////
function test_artefact(label, artefact, test) {
  expect.ok(label, `/${artefact}.json`, test);
}
