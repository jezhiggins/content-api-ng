const expect = require('./request_tests.js');

const assert = require('assert');
const equal = assert.equal;
const monk = require('monk');
const mongo_config = require('config').get('mongo');

const db = monk(`${mongo_config.hostname}:${mongo_config.port}/${mongo_config.database}`);
const tags_collection = db.get('tags');

describe("Tag Types", () => {
  test_tag_types("display a list of tag types", body => {
    equal(body.description, "All tag types");
    equal(body.total, 13);
    equal(body.start_index, 1);
    equal(body.page_size, 13);
    equal(body.current_page, 1);
    equal(body.pages, 1);
    for (const result of body.results) {
      assert(result.id, "Result must have an id");
      assert(result.type, "Result must have a type");
      assert(isNumber(result.total),"Result must have a total, and it must be numeric");
    } // for ...
  }); // list_of_tag_types

  test_tag_types("links to tag type url", body => {
    const section = body.results.find(s => s.type == "section");
    equal(section.id, "http://example.org/tags/sections.json");
  });

  test_tag_types("include the number of tags of each type", body => {
    for (const [type, expected] of [['person',2],['section',1],['article',0]]) {
      const tag_type = body.results.find(s => s.type == type);
      equal(tag_type.total, expected);
    } // for ...
  });

  ////////////////////////////
  before(async() => {
    await tags_collection.insert([
      {
	"title": "Team",
	"tag_type": "person",
	"tag_id": "writers"
      },
      {
	"title": "About",
	"tag_type": "section",
	"tag_id": "about"
      },
      {
	"title": "Jez",
	"tag_type": "person",
	"tag_id": "jez"
      }
    ]);
  }); // before

  after(async() => {
    await tags_collection.remove({});
  }); // after
});

/////////////////////////////////////////
function test_tag_types(label, test) {
  expect.ok(label, '/tag_types.json', test);
}

function isNumber(v){
   return typeof v === 'number' && isFinite(v);
}
