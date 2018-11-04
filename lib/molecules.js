
const grpc = require('./../atom_grpc')
const decoder = new TextDecoder("utf-8")
const encoder = new TextEncoder("utf-8")
const dict = {}

const id = atom.config.get('molecules.RaftID')

module.exports = class molecules {

  constructor (options){
      const {config} = options
      this.config = config
  }

    //const settings = {config: packageConfig}

    activate() {
        console.log("We starting");
        this.editor = atom.workspace.getActiveTextEditor()
        this.onChange = this.onChange.bind(this)
        this.raft_put = this.raft_put.bind(this)
        this.raft_get = this.raft_get.bind(this)
        this.sleep = this.sleep.bind(this)
        this.encode = this.encode.bind(this)
        this.dude = this.dude.bind(this)
        this.decode = this.decode.bind(this)
        this.getRandomColor = this.getRandomColor.bind(this)
        this.subscription = this.editor.getBuffer().onDidChange(this.onChange)

        this.dude()

    }

    async dude() {
        await this.raft_get(this)
    }

    async onChange(e) {

        // get last change
        let range = e.changes['0'].newRange
        // mark the change
        let marker = this.editor.markBufferRange(range)
        // decorate the change with a color
        this.editor.decorateMarker(marker, {
            type: 'text',
            class: 'eri'
        })
        // encode change into hash
        let hash = this.encode(e)
        // save hash+marker in dictionary(map?)
        if((hash in dict)) {
            dict[hash].destroy()
            delete dict[hash]
            console.log(Object.keys(dict).length);
        }

        dict[hash] = marker

        // remove the color after raft has synced the change
        await this.raft_put(marker, hash, this)

    }


    raft_put(marker, e, outer) {

        return new Promise(function(resolve) {

            grpc.put(e).then(() => {
                resolve()
            }).catch(error => {
                // not synced, redo
                //marker.destroy()
                console.log('error:', error)
                outer.onChange(e)
            });

        });
    }

    raft_get(outer) {

        return new Promise(function(resolve) {

            grpc.poll(id).then(result => {

                // decode change from nytes.
                var change = outer.decode(result)

                // re-encode to get JS-native hash
                var hash = outer.encode(change)

                // destroy marker corresponding to change
                // 'the change has been replicated'
                if (hash in dict) {
                    dict[hash].destroy()
                    //delete dict[hash]
                } else { // Received someone elses change

                    // disable on-change subscription to not trigger on change
                    outer.subscription.dispose()

                    // get the change element from change object
                    change = change.changes[0]

                    // apply change to buffer
                    outer.editor.setTextInBufferRange(change.oldRange, change.newText)


                    //enable on-change subscription to trigger on changes
                    outer.subscription = outer.editor.getBuffer().onDidChange(outer.onChange)
                }



                outer.raft_get(outer)
            })
        });

    }

    encode(e) {
        return encoder.encode(JSON.stringify(e))
    }

    decode(e) {
        return JSON.parse(decoder.decode(new Uint8Array(e)))
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomColor() {

        return {
            type: 'text',
            class: 'looprandom'
        }
    }

    deactivate() {
      console.log("wikllll");
      atom.reload()
    }
    serialize() {}
};
