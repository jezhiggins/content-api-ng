const express = require('express');
const csv = require('csv-express');
const odi = require('./odi-express');
const make_url_helper = require('./lib/url_helper.js');
const make_asset_api_client = require('./lib/asset_api.js');
const config = require('config');
const monk = require('monk');
const asset_api = require('./lib/asset_api.js');

const app = express();
const app_env = app.get('env');

const dev_mode = (app_env === 'development');
const test_mode = (app_env === 'test');

if (!test_mode) {
  const logger = require('morgan');
  app.use(logger('dev'));
} // if ...

const url_helper = make_url_helper(app_env);
const asset_api_client = make_asset_api_client(app_env);

const db = open_mongo(config.get('mongo'));
if (!test_mode)
  db.asset_api_client = asset_api_client;

//////////////////////
const tags = require('./routes/tags.js');
const tag_types = require('./routes/tag_types.js');
const tags_type_or_id = require('./routes/tags_type_or_id.js');
const tags_type_and_id = require('./routes/tags_type_id.js');
const with_tag = require('./routes/with_tag.js');
const latest = require('./routes/latest.js');
const course_instance = require('./routes/course_instance.js');
const lecture_list = require('./routes/lecture_list.js');
const section = require('./routes/section.js');
const artefact = require('./routes/artefact.js');
const artefact_image = require('./routes/image.js');
const legacy_proxy = require('./routes/legacy_proxy.js');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get('/', (req, res) => res.send('Hello World'));
app.get('/hello.json', (req, res) => res.json({ greeting: 'Hello World' }));

app.get('/search.json', legacy_proxy('/search.json'));
app.get('/tags.:ext', tags(db, url_helper));
app.get('/tag_types.:ext', tag_types(db, url_helper));
app.get('/tags/:tag_type_or_id.:ext', tags_type_or_id(db, url_helper));
app.get('/tags/:tag_type/:tag_id.:ext', tags_type_and_id(db, url_helper));
app.get('/with_tag.:ext', with_tag(db, url_helper));
app.get('/latest.:ext', latest(db, url_helper));
app.get('/upcoming.json', legacy_proxy());
app.get('/course-instance.:ext', course_instance(db, url_helper));
app.get('/lecture-list.:ext', lecture_list(db, url_helper));
app.get('/section.:ext', section(db, url_helper));
app.get('/related.json', legacy_proxy());
app.get('/artefacts.json', legacy_proxy());
app.get('/:artefactSlug.:ext', artefact(db, url_helper));
app.get('/:artefactSlug/image', artefact_image(db));

console.log("Available endpoints are " + app._router.stack.filter(r => r.route).map(r => r.route.path).join(', '));

////////////////////////////////////////////
// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/////////////////////////////////////////////
// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
  if (!test_mode)
    console.log(err);
});

//////////////////////////////////////////////
function open_mongo(mongo_config) {
  const mongo_url = find_mongo_url(mongo_config);
  const db = monk(mongo_url);

  if (!test_mode)
    console.log(`Connected to mongo at ${mongo_url}`);

  return db;
} // open_mongo

function find_mongo_url(mongo_config) {
  if (process.env.MONGODB_URI) {
    console.log("Using MONGODB_URI environment variable");
    return process.env.MONGODB_URI;
  } // find_mongo_url

  const hostname = mongo_config.hostname;
  const port = mongo_config.port;
  const database = mongo_config.database;
  return `${hostname}:${port}/${database}`;
} // find_mongo_url

module.exports = app;
