const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');
const artefacts_collection = db.get('artefacts');
const editions_collection = db.get('editions');

const external_links =  [
  { 'title': 'Fooey', 'url': 'http://fooey.com/' },
  { 'title': 'Gooey', 'url': 'http://fooey.com/gooey' },
  { 'title': 'Kablooie', 'url': 'http://chunky.com/kablooie' },
];


describe('Artefact external links', () => {
  test_artefact('has external links', 'with-external-links', body => {
    equal(body.related_external_links.length, external_links.length);
    for (let i = 0; i != external_links.length; ++i) {
      equal(body.related_external_links[i].title, external_links[i].title);
      equal(body.related_external_links[i].url, external_links[i].url);
    };
  });
  test_artefact('empty array if no external links', 'without-external-links', body => {
    equal(body.related_external_links.length, 0);
  });

  before(async() => {
    // this date munging is so horrible
    const the_future = new Date();
    the_future.setTime(Date.now() + (24*60*60*1000));
    await artefacts_collection.insert([
      {
	'name': 'with-external-links',
	'slug': 'with-external-links',
	'state': 'live',
	'tag_ids': ['odi'],
	'external_links': external_links
      },
      {
	'name': 'without-external-links',
	'slug': 'without-external-links',
	'state': 'live',
	'tag_ids': ['odi']
      }
    ]);
    await editions_collection.insert([
      {
	'title': 'External links',
	'slug': 'with-external-links',
	'state': 'published'
      },
      {
	'title': 'Without External links',
	'slug': 'without-external-links',
	'state': 'published'
      }
    ])
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
