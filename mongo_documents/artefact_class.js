function wrap_artefact(artefact) {
  return new Artefact(artefact);
} // wrap_artefact

module.exports = wrap_artefact;

//////////////////////////////////////////////////////
class Artefact {
  constructor(artefact) {
    for (const [k,v] of Object.entries(artefact))
      this[k] = v;
  } // constructor

  get type() {
    return this.edition_ ? this.edition_._type.replace('Edition', '') : 'Unknown';
  } // type
  get edition() { return this.edition_; }

  get asset_ids() { return this.edition_ ? this.edition_.asset_ids : undefined }

  set edition(edition) {
    this.edition_ = edition;
    if (edition)
      this.edition_.artefact = this;
  } // set edition

  get excerpt() {
    const whole_body = this.edition ? this.edition.whole_body : '';
    if (!whole_body)
      return '';
    const first_line_md = whole_body.substr(0, whole_body.indexOf('\n'));
    const first_line = first_line_md.replace(/[#_\\*]/g, ''); // strip markdown
    return first_line;
  } // excerpt

  get rendering_path() {
    return (this.edition_) ? this.edition_.rendering_path : `/${this.slug}`;
  } // rendering_path
}// class Artefact
