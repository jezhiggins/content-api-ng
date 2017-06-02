const error_404 = require('./error_404.js');
const Artefacts = require('../mongo_documents/artefacts.js');

async function image_redirector(req, res, db) {
  const slug = req.params['artefactSlug'];
  const role = req.query['role'];
  const version = req.query['version'];

  const artefact = await Artefacts.by_slug(db, slug, role);
  if (!artefact)
    return error_404(res);

  const image = artefact.assets.image;
  if (!image)
    return error_404(res);

  const image_url = version ? image['file_versions'][version] : image['file_url'];
  res.redirect(image_url);
} // image_redirector

function make_artefact_image_redirector(db) {
  return (req, res) =>
    image_redirector(req, res, db);
} // make_artefact_image_redirector

module.exports = make_artefact_image_redirector;
