const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const singular = require('pluralize').singular;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');

describe('Tags Type Or Id', () => {
  expect_404('Made up type', 'chuckle');
  expect_404('Tag but not a section', 'writers');

  redirect('From section to sections', 'section', 'tags/sections.json');
  redirect('From section tag to /sections/tag.json', 'about', 'tags/sections/about.json');

  for (const [type, expected] of [['sections', 3], ['person', 1], ['article', 0]])
    ok(`/tags/${type}.json`, `${type}`, body => {
      const singular_type = singular(type);
      equal(body.description, `All '${singular_type}' tags`);
      equal(body.results.length, expected);
      assert(body.results.every(r => r.details.type == singular_type), `all tags should be have type=${type}`);
    });

  /////////////////////////////////////////
  before(async() => {
    await tags_collection.insert(test_tag_data);
  });

  after(async() => {
    await tags_collection.remove({});
  });
});

////////////////////////
//////////////////////////
function ok(label, type_or_id, test) {
  expect.ok(label, `/tags/${type_or_id}.json`, test);
} // ok

function expect_404(label, nonsense) {
  expect._404(`404 when ${label}`, `/tags/${nonsense}.json`);
} // expect_404
function redirect(label, singular, destination) {
  expect.redirect(`302 when ${label}`, `/tags/${singular}.json`, `http://example.org/${destination}`);
} // redirect


const test_tag_data = [
  {
    'title': 'Team',
    'tag_type': 'person',
    'tag_id': 'writers'
  },
  {
    'title': 'CRIME!',
    'tag_type': 'section',
    'tag_id': 'crime',
    'description': 'Wants crimes? Read on',
    'short_description': 'crime index'
  },
  {
    'title': 'About',
    'tag_type': 'section',
    'tag_id': 'about'
  },
  {
    'title': 'Membership',
    'tag_type': 'section',
    'tag_id': 'membership'
  }
];
