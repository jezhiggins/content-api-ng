const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');

describe('Tag List', () => {
  expect.ok('list of tags', '/tags.json', body => {
    equal(body.description, 'All tags');
    equal(body.total, test_tag_data.length);
    equal(body.start_index, 1);
    equal(body.page_size, test_tag_data.length);
    equal(body.current_page, 1);
    equal(body.pages, 1);
    equal(body.results.length, test_tag_data.length);
  });

  // filter by type
  for (const [type, expected] of [['section', 3], ['person', 1], ['article', 0]])
    expect.ok(`filter by type=${type}`, `/tags.json?type=${type}`, body => {
      equal(body.description, `${type} tags`);
      equal(body.results.length, expected);
      assert(body.results.every(r => r.details.type == type), `all tags should be have type=${type}`);
    });

  expect.ok('fully formatted', '/tags.json', body => {
    const tag = body.results.find(t => t.content_with_tag.slug == 'crime');
    equal(tag.id, 'http://example.org/tags/sections/crime.json');
    equal(tag.web_url, null);
    equal(tag.title, 'CRIME!');
    equal(tag.details.description, 'Wants crimes? Read on');
    equal(tag.details.short_description, 'crime index');
    equal(tag.details.type, 'section');
    equal(tag.content_with_tag.id, 'http://example.org/with_tag.json?section=crime');
    equal(tag.content_with_tag.web_url, 'http://theodi.test/tags/crime');
    equal(tag.content_with_tag.slug, 'crime');
    equal(tag.parent, null);
  });

  /////////////////////////////////////////
  before(async() => {
    await tags_collection.insert(test_tag_data);
  });

  after(async() => {
    await tags_collection.remove({});
  });
});

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
