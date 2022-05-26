/* global Automerge */

/* So this class is kind of terrible because we have to be careful to preserve a 1:1
 * relationship between handles and documentIds or else we have split-brain on listeners.
 * It would be easier just to have one repo object to pass around but that means giving
 * total repo access to everything which seems gratuitous to me.
 */
export default class DocHandle extends EventTarget {
  #doc

  documentId

  constructor(documentId) {
    super()
    if (!documentId) { throw new Error('Need a document ID for this RepoDoc.') }
    this.documentId = documentId
  }

  // should i move this?
  change(callback) {
    const doc = Automerge.change(this.#doc, callback)
    this.replace(doc)
  }

  replace(doc) {
    this.#doc = doc
    const { documentId } = this
    const latestChange = Automerge.getLastLocalChange(doc)
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          handle: this,
          documentId,
          doc,
          latestChange,
        },
      }),
    )
  }

  /* hmmmmmmmmmmm */
  async value() {
    if (!this.#doc) {
      /* this bit of jank blocks anyone else getting the value
         before the first time data gets set into here */
      await new Promise((resolve) => {
        this.addEventListener('change', resolve, {
          once: true,
        })
      })
    }
    return this.#doc
  }
}