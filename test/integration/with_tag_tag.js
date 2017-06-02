const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');
const artefacts_collection = db.get('artefacts');

describe('With Tag, tag param', () => {
  expect_404('no tag query param');
  expect_404('empty tag query param', '?tag=');
  expect_404('unknown tag', '?tag=monkeypunks');
  expect_404('multiple tag instances found', '?tag=ambiguity');

  expect_redirect('to typed url', '?tag=trout', '?article=trout');
  expect_redirect('to typed url', '?tag=farmers', '?section=farmers');
  expect_redirect('to typed url with sort', '?tag=trout&sort=date', '?article=trout&sort=date');
  expect_redirect('to typed url with order by', '?tag=trout&order_by=date', '?article=trout&order_by=date');
  expect_redirect('to typed url with author', '?tag=trout&author=jez', '?article=trout&author=jez');
  expect_redirect('to content type', '?tag=job', '?type=job');
  expect_redirect('when filtering by multiple tags', '?tag=crime,business', '?section=crime%2Cbusiness');

  /////////////////////////////////////////
  before(async() => {
    await tags_collection.insert(test_tag_data);
  });

  after(async() => {
    await tags_collection.remove({});
  });
});

////////////////////////////////////////
function expect_404(label, query = '') {
  expect._404(`404 when ${label}`, `/with_tag.json${query}`);
} // expect_404

function expect_redirect(label, query, location) {
  expect.redirect(`redirect ${label}`,
		  `/with_tag.json${query}`,
		  `http://example.org/with_tag.json${location}`);
} // expect redirect

////////////////////////////////////////////
const test_tag_data = [
  // ambiguous tag
  {
    'title': 'Ambiguity',
    'tag_type': 'section',
    'tag_id': 'ambiguity'
  },
  {
    'title': 'Ambiguity',
    'tag_type': 'article',
    'tag_id': 'ambiguity'
  },

  // unambiguous, keywords are ignored
  {
    'title': 'Farmers',
    'tag_type': 'section',
    'tag_id': 'farmers'
  },
  {
    'title': 'Farmers',
    'tag_type': 'keyword',
    'tag_id': 'farmers'
  },

  //
  {
    'title': 'Trout',
    'tag_type': 'article',
    'tag_id': 'trout'
  },

  //
  {
    'title': 'Crime',
    'tag_type': 'section',
    'tag_id': 'crime'
  },
  {
    'title': 'Business',
    'tag_type': 'section',
    'tag_id': 'business'
  }

];
