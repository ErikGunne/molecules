var PROTO_PATH = __dirname + '/Atom.proto';

const host = atom.config.get('molecules.RaftHost')
const port = atom.config.get('molecules.RaftPort')

var grpc = require('./node_modules/grpc');
var protoLoader = require('./node_modules/@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });

var atom_proto = grpc.loadPackageDefinition(packageDefinition).atom;


function put(input){

    return new Promise(resolve => {
        var client = new atom_proto.AtomService(host + ":" + port,
            grpc.credentials.createInsecure());

        //base-64 string or Uint8 array

        client.put({bytes: input}, function(err, response) {
            resolve();
        });
    })
}

function poll(id){

    return new Promise(resolve => {
        var client = new atom_proto.AtomService(host + ":" + port,
            grpc.credentials.createInsecure());

        //base-64 string or Uint8 array

        client.poll({name: id}, function(err, response) {
            resolve(response.bytes);
        });
    })
}

exports.put=put;
exports.poll=poll;
