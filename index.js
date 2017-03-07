'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkProofSolidityFactory = exports.merkleRoot = exports.checkProof = undefined;

var _ethereumjsUtil = require('ethereumjs-util');

// Expects elements to be Buffers of length 32
// empty string elements will be removed prior to the buffer check
function MerkleTree(elements) {
  this.elements = Array.from(new Set(elements.filter(a => a)));
  if (this.elements.some(e => !(e.length == 32 && Buffer.isBuffer(e)))) {
    throw new Error('elements must be 32 byte buffers');
  }
  this.elements.sort(Buffer.compare);
  this.layers = getLayers(this.elements);
  return this;
} // https://github.com/raiden-network/raiden/blob/master/raiden/mtree.py
// Create a merkle root from a list of elements
// Elements are assumed to be 32 bytes hashes (Buffers)
//  (but may be expressed as 0x prefixed hex strings of length 66)
// The bottom layer of the tree (leaf nodes) are the elements
// All layers above are combined hashes of the element pairs
// When combining hashes, we respect character ordering
// If an element in a pair doesn't exist (because odd), keep that element in
//  the next layer

// The MerkleTree is a 2d array of layers
// [ elements, combinedHashes1, combinedHashes2, ... root]
// root is a length 1 array

MerkleTree.prototype.getRoot = function () {
  return this.layers[this.layers.length - 1][0];
};

MerkleTree.prototype.getProof = function (element) {
  const index = this.elements.indexOf(element);
  if (index == -1) {
    throw new Error('element not found in merkle tree');
  }
  return getProof(index, this.layers);
};

const checkProof = function checkProof(proof, root, element) {
  return root.equals(proof.reduce((hash, pair) => {
    return combinedHash(hash, pair);
  }, element));
};

const merkleRoot = function merkleRoot(elements) {
  return new MerkleTree(elements).getRoot();
};

// converts buffers from MerkleRoot functions into hex strings
// merkleProof is the contract abstraction for MerkleProof.sol
const checkProofSolidityFactory = function checkProofSolidityFactory(checkProofContractMethod) {
  return function (proof, root, hash) {
    proof = '0x' + proof.map(e => e.toString('hex')).join('');
    root = bufToHex(root);
    hash = bufToHex(hash);
    return checkProofContractMethod(proof, root, hash);
  };
};

exports.default = MerkleTree;
exports.checkProof = checkProof;
exports.merkleRoot = merkleRoot;
exports.checkProofSolidityFactory = checkProofSolidityFactory;


function combinedHash(first, second) {
  if (!second) {
    return first;
  }
  if (!first) {
    return second;
  }
  return (0, _ethereumjsUtil.sha3)(bufSortJoin(first, second));
}

function getNextLayer(elements) {
  return elements.reduce((layer, element, index, arr) => {
    if (index % 2 == 0) {
      layer.push(combinedHash(element, arr[index + 1]));
    }
    return layer;
  }, []);
}

function getLayers(elements) {
  if (elements.length == 0) {
    return [['']];
  }
  const layers = [];
  layers.push(elements);
  while (layers[layers.length - 1].length > 1) {
    layers.push(getNextLayer(layers[layers.length - 1]));
  }
  return layers;
}

function getProof(index, layers) {
  return layers.reduce((proof, layer) => {
    let pair = getPair(index, layer);
    if (pair) {
      proof.push(pair);
    }
    index = Math.floor(index / 2);
    return proof;
  }, []);
}

function getPair(index, layer) {
  let pairIndex = index % 2 ? index - 1 : index + 1;
  if (pairIndex < layer.length) {
    return layer[pairIndex];
  } else {
    return null;
  }
}

function bufToHex(element) {
  return Buffer.isBuffer(element) ? '0x' + element.toString('hex') : element;
}

function bufSortJoin() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return Buffer.concat([...args].sort(Buffer.compare));
}

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL21lcmtsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBY0E7O0FBRUE7QUFDQTtBQUNBLFNBQVMsVUFBVCxDQUFvQixRQUFwQixFQUE4QjtBQUM1QixPQUFLLFFBQUwsR0FBZ0IsTUFBTSxJQUFOLENBQVcsSUFBSSxHQUFKLENBQVEsU0FBUyxNQUFULENBQWdCLEtBQUssQ0FBckIsQ0FBUixDQUFYLENBQWhCO0FBQ0EsTUFBSSxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW9CLENBQUQsSUFBTyxFQUFFLEVBQUUsTUFBRixJQUFZLEVBQVosSUFBa0IsT0FBTyxRQUFQLENBQWdCLENBQWhCLENBQXBCLENBQTFCLENBQUosRUFBd0U7QUFDdEUsVUFBTSxJQUFJLEtBQUosQ0FBVSxrQ0FBVixDQUFOO0FBQ0Q7QUFDRCxPQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLE9BQU8sT0FBMUI7QUFDQSxPQUFLLE1BQUwsR0FBYyxVQUFVLEtBQUssUUFBZixDQUFkO0FBQ0EsU0FBTyxJQUFQO0FBQ0QsQyxDQTFCRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQWdCQSxXQUFXLFNBQVgsQ0FBcUIsT0FBckIsR0FBK0IsWUFBVztBQUN4QyxTQUFPLEtBQUssTUFBTCxDQUFZLEtBQUssTUFBTCxDQUFZLE1BQVosR0FBcUIsQ0FBakMsRUFBb0MsQ0FBcEMsQ0FBUDtBQUNELENBRkQ7O0FBSUEsV0FBVyxTQUFYLENBQXFCLFFBQXJCLEdBQWdDLFVBQVMsT0FBVCxFQUFrQjtBQUNoRCxRQUFNLFFBQVEsS0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixPQUF0QixDQUFkO0FBQ0EsTUFBSSxTQUFTLENBQUMsQ0FBZCxFQUFpQjtBQUNmLFVBQU0sSUFBSSxLQUFKLENBQVUsa0NBQVYsQ0FBTjtBQUNEO0FBQ0QsU0FBTyxTQUFTLEtBQVQsRUFBZ0IsS0FBSyxNQUFyQixDQUFQO0FBQ0QsQ0FORDs7QUFRQSxNQUFNLGFBQWEsU0FBYixVQUFhLENBQVMsS0FBVCxFQUFnQixJQUFoQixFQUFzQixPQUF0QixFQUErQjtBQUNoRCxTQUFPLEtBQUssTUFBTCxDQUFZLE1BQU0sTUFBTixDQUFhLENBQUMsSUFBRCxFQUFPLElBQVAsS0FBZ0I7QUFDOUMsV0FBTyxhQUFhLElBQWIsRUFBbUIsSUFBbkIsQ0FBUDtBQUNELEdBRmtCLEVBRWhCLE9BRmdCLENBQVosQ0FBUDtBQUdELENBSkQ7O0FBTUEsTUFBTSxhQUFhLFNBQWIsVUFBYSxDQUFTLFFBQVQsRUFBbUI7QUFDcEMsU0FBUSxJQUFJLFVBQUosQ0FBZSxRQUFmLENBQUQsQ0FBMkIsT0FBM0IsRUFBUDtBQUNELENBRkQ7O0FBSUE7QUFDQTtBQUNBLE1BQU0sNEJBQTRCLFNBQTVCLHlCQUE0QixDQUFTLHdCQUFULEVBQW1DO0FBQ25FLFNBQU8sVUFBUyxLQUFULEVBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBQTRCO0FBQ2pDLFlBQVEsT0FBTyxNQUFNLEdBQU4sQ0FBVSxLQUFLLEVBQUUsUUFBRixDQUFXLEtBQVgsQ0FBZixFQUFrQyxJQUFsQyxDQUF1QyxFQUF2QyxDQUFmO0FBQ0EsV0FBTyxTQUFTLElBQVQsQ0FBUDtBQUNBLFdBQU8sU0FBUyxJQUFULENBQVA7QUFDQSxXQUFPLHlCQUF5QixLQUF6QixFQUFnQyxJQUFoQyxFQUFzQyxJQUF0QyxDQUFQO0FBQ0QsR0FMRDtBQU1ELENBUEQ7O2tCQVNlLFU7UUFDTixVLEdBQUEsVTtRQUFZLFUsR0FBQSxVO1FBQVkseUIsR0FBQSx5Qjs7O0FBRWpDLFNBQVMsWUFBVCxDQUFzQixLQUF0QixFQUE2QixNQUE3QixFQUFxQztBQUNuQyxNQUFJLENBQUMsTUFBTCxFQUFhO0FBQUUsV0FBTyxLQUFQO0FBQWM7QUFDN0IsTUFBSSxDQUFDLEtBQUwsRUFBWTtBQUFFLFdBQU8sTUFBUDtBQUFlO0FBQzdCLFNBQU8sMEJBQUssWUFBWSxLQUFaLEVBQW1CLE1BQW5CLENBQUwsQ0FBUDtBQUNEOztBQUVELFNBQVMsWUFBVCxDQUFzQixRQUF0QixFQUFnQztBQUM5QixTQUFPLFNBQVMsTUFBVCxDQUFnQixDQUFDLEtBQUQsRUFBUSxPQUFSLEVBQWlCLEtBQWpCLEVBQXdCLEdBQXhCLEtBQWdDO0FBQ3JELFFBQUksUUFBUSxDQUFSLElBQWEsQ0FBakIsRUFBb0I7QUFBRSxZQUFNLElBQU4sQ0FBVyxhQUFhLE9BQWIsRUFBc0IsSUFBSSxRQUFRLENBQVosQ0FBdEIsQ0FBWDtBQUFtRDtBQUN6RSxXQUFPLEtBQVA7QUFDRCxHQUhNLEVBR0osRUFISSxDQUFQO0FBSUQ7O0FBRUQsU0FBUyxTQUFULENBQW1CLFFBQW5CLEVBQTZCO0FBQzNCLE1BQUksU0FBUyxNQUFULElBQW1CLENBQXZCLEVBQTBCO0FBQ3hCLFdBQU8sQ0FBQyxDQUFDLEVBQUQsQ0FBRCxDQUFQO0FBQ0Q7QUFDRCxRQUFNLFNBQVMsRUFBZjtBQUNBLFNBQU8sSUFBUCxDQUFZLFFBQVo7QUFDQSxTQUFPLE9BQU8sT0FBTyxNQUFQLEdBQWdCLENBQXZCLEVBQTBCLE1BQTFCLEdBQW1DLENBQTFDLEVBQTZDO0FBQzNDLFdBQU8sSUFBUCxDQUFZLGFBQWEsT0FBTyxPQUFPLE1BQVAsR0FBZ0IsQ0FBdkIsQ0FBYixDQUFaO0FBQ0Q7QUFDRCxTQUFPLE1BQVA7QUFDRDs7QUFFRCxTQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUIsTUFBekIsRUFBaUM7QUFDL0IsU0FBTyxPQUFPLE1BQVAsQ0FBYyxDQUFDLEtBQUQsRUFBUSxLQUFSLEtBQWtCO0FBQ3JDLFFBQUksT0FBTyxRQUFRLEtBQVIsRUFBZSxLQUFmLENBQVg7QUFDQSxRQUFJLElBQUosRUFBVTtBQUFFLFlBQU0sSUFBTixDQUFXLElBQVg7QUFBa0I7QUFDOUIsWUFBUSxLQUFLLEtBQUwsQ0FBVyxRQUFRLENBQW5CLENBQVI7QUFDQSxXQUFPLEtBQVA7QUFDRCxHQUxNLEVBS0osRUFMSSxDQUFQO0FBTUQ7O0FBRUQsU0FBUyxPQUFULENBQWlCLEtBQWpCLEVBQXdCLEtBQXhCLEVBQStCO0FBQzdCLE1BQUksWUFBWSxRQUFRLENBQVIsR0FBWSxRQUFRLENBQXBCLEdBQXdCLFFBQVEsQ0FBaEQ7QUFDQSxNQUFJLFlBQVksTUFBTSxNQUF0QixFQUE4QjtBQUM1QixXQUFPLE1BQU0sU0FBTixDQUFQO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsV0FBTyxJQUFQO0FBQ0Q7QUFDRjs7QUFFRCxTQUFTLFFBQVQsQ0FBa0IsT0FBbEIsRUFBMkI7QUFDekIsU0FBTyxPQUFPLFFBQVAsQ0FBZ0IsT0FBaEIsSUFBMkIsT0FBTyxRQUFRLFFBQVIsQ0FBaUIsS0FBakIsQ0FBbEMsR0FBNEQsT0FBbkU7QUFDRDs7QUFFRCxTQUFTLFdBQVQsR0FBOEI7QUFBQSxvQ0FBTixJQUFNO0FBQU4sUUFBTTtBQUFBOztBQUM1QixTQUFPLE9BQU8sTUFBUCxDQUFjLENBQUMsR0FBRyxJQUFKLEVBQVUsSUFBVixDQUFlLE9BQU8sT0FBdEIsQ0FBZCxDQUFQO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBodHRwczovL2dpdGh1Yi5jb20vcmFpZGVuLW5ldHdvcmsvcmFpZGVuL2Jsb2IvbWFzdGVyL3JhaWRlbi9tdHJlZS5weVxuLy8gQ3JlYXRlIGEgbWVya2xlIHJvb3QgZnJvbSBhIGxpc3Qgb2YgZWxlbWVudHNcbi8vIEVsZW1lbnRzIGFyZSBhc3N1bWVkIHRvIGJlIDMyIGJ5dGVzIGhhc2hlcyAoQnVmZmVycylcbi8vICAoYnV0IG1heSBiZSBleHByZXNzZWQgYXMgMHggcHJlZml4ZWQgaGV4IHN0cmluZ3Mgb2YgbGVuZ3RoIDY2KVxuLy8gVGhlIGJvdHRvbSBsYXllciBvZiB0aGUgdHJlZSAobGVhZiBub2RlcykgYXJlIHRoZSBlbGVtZW50c1xuLy8gQWxsIGxheWVycyBhYm92ZSBhcmUgY29tYmluZWQgaGFzaGVzIG9mIHRoZSBlbGVtZW50IHBhaXJzXG4vLyBXaGVuIGNvbWJpbmluZyBoYXNoZXMsIHdlIHJlc3BlY3QgY2hhcmFjdGVyIG9yZGVyaW5nXG4vLyBJZiBhbiBlbGVtZW50IGluIGEgcGFpciBkb2Vzbid0IGV4aXN0IChiZWNhdXNlIG9kZCksIGtlZXAgdGhhdCBlbGVtZW50IGluXG4vLyAgdGhlIG5leHQgbGF5ZXJcblxuLy8gVGhlIE1lcmtsZVRyZWUgaXMgYSAyZCBhcnJheSBvZiBsYXllcnNcbi8vIFsgZWxlbWVudHMsIGNvbWJpbmVkSGFzaGVzMSwgY29tYmluZWRIYXNoZXMyLCAuLi4gcm9vdF1cbi8vIHJvb3QgaXMgYSBsZW5ndGggMSBhcnJheVxuXG5pbXBvcnQgeyBzaGEzIH0gZnJvbSAnZXRoZXJldW1qcy11dGlsJ1xuXG4vLyBFeHBlY3RzIGVsZW1lbnRzIHRvIGJlIEJ1ZmZlcnMgb2YgbGVuZ3RoIDMyXG4vLyBlbXB0eSBzdHJpbmcgZWxlbWVudHMgd2lsbCBiZSByZW1vdmVkIHByaW9yIHRvIHRoZSBidWZmZXIgY2hlY2tcbmZ1bmN0aW9uIE1lcmtsZVRyZWUoZWxlbWVudHMpIHtcbiAgdGhpcy5lbGVtZW50cyA9IEFycmF5LmZyb20obmV3IFNldChlbGVtZW50cy5maWx0ZXIoYSA9PiBhKSkpXG4gIGlmICh0aGlzLmVsZW1lbnRzLnNvbWUoKGUpID0+ICEoZS5sZW5ndGggPT0gMzIgJiYgQnVmZmVyLmlzQnVmZmVyKGUpKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VsZW1lbnRzIG11c3QgYmUgMzIgYnl0ZSBidWZmZXJzJylcbiAgfVxuICB0aGlzLmVsZW1lbnRzLnNvcnQoQnVmZmVyLmNvbXBhcmUpXG4gIHRoaXMubGF5ZXJzID0gZ2V0TGF5ZXJzKHRoaXMuZWxlbWVudHMpXG4gIHJldHVybiB0aGlzXG59XG5cbk1lcmtsZVRyZWUucHJvdG90eXBlLmdldFJvb3QgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMubGF5ZXJzW3RoaXMubGF5ZXJzLmxlbmd0aCAtIDFdWzBdXG59XG5cbk1lcmtsZVRyZWUucHJvdG90eXBlLmdldFByb29mID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICBjb25zdCBpbmRleCA9IHRoaXMuZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KVxuICBpZiAoaW5kZXggPT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VsZW1lbnQgbm90IGZvdW5kIGluIG1lcmtsZSB0cmVlJylcbiAgfVxuICByZXR1cm4gZ2V0UHJvb2YoaW5kZXgsIHRoaXMubGF5ZXJzKVxufVxuXG5jb25zdCBjaGVja1Byb29mID0gZnVuY3Rpb24ocHJvb2YsIHJvb3QsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIHJvb3QuZXF1YWxzKHByb29mLnJlZHVjZSgoaGFzaCwgcGFpcikgPT4ge1xuICAgIHJldHVybiBjb21iaW5lZEhhc2goaGFzaCwgcGFpcilcbiAgfSwgZWxlbWVudCkpXG59XG5cbmNvbnN0IG1lcmtsZVJvb3QgPSBmdW5jdGlvbihlbGVtZW50cykge1xuICByZXR1cm4gKG5ldyBNZXJrbGVUcmVlKGVsZW1lbnRzKSkuZ2V0Um9vdCgpXG59XG5cbi8vIGNvbnZlcnRzIGJ1ZmZlcnMgZnJvbSBNZXJrbGVSb290IGZ1bmN0aW9ucyBpbnRvIGhleCBzdHJpbmdzXG4vLyBtZXJrbGVQcm9vZiBpcyB0aGUgY29udHJhY3QgYWJzdHJhY3Rpb24gZm9yIE1lcmtsZVByb29mLnNvbFxuY29uc3QgY2hlY2tQcm9vZlNvbGlkaXR5RmFjdG9yeSA9IGZ1bmN0aW9uKGNoZWNrUHJvb2ZDb250cmFjdE1ldGhvZCkge1xuICByZXR1cm4gZnVuY3Rpb24ocHJvb2YsIHJvb3QsIGhhc2gpIHtcbiAgICBwcm9vZiA9ICcweCcgKyBwcm9vZi5tYXAoZSA9PiBlLnRvU3RyaW5nKCdoZXgnKSkuam9pbignJylcbiAgICByb290ID0gYnVmVG9IZXgocm9vdClcbiAgICBoYXNoID0gYnVmVG9IZXgoaGFzaClcbiAgICByZXR1cm4gY2hlY2tQcm9vZkNvbnRyYWN0TWV0aG9kKHByb29mLCByb290LCBoYXNoKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1lcmtsZVRyZWVcbmV4cG9ydCB7IGNoZWNrUHJvb2YsIG1lcmtsZVJvb3QsIGNoZWNrUHJvb2ZTb2xpZGl0eUZhY3RvcnkgfVxuXG5mdW5jdGlvbiBjb21iaW5lZEhhc2goZmlyc3QsIHNlY29uZCkge1xuICBpZiAoIXNlY29uZCkgeyByZXR1cm4gZmlyc3QgfVxuICBpZiAoIWZpcnN0KSB7IHJldHVybiBzZWNvbmQgfVxuICByZXR1cm4gc2hhMyhidWZTb3J0Sm9pbihmaXJzdCwgc2Vjb25kKSlcbn1cblxuZnVuY3Rpb24gZ2V0TmV4dExheWVyKGVsZW1lbnRzKSB7XG4gIHJldHVybiBlbGVtZW50cy5yZWR1Y2UoKGxheWVyLCBlbGVtZW50LCBpbmRleCwgYXJyKSA9PiB7XG4gICAgaWYgKGluZGV4ICUgMiA9PSAwKSB7IGxheWVyLnB1c2goY29tYmluZWRIYXNoKGVsZW1lbnQsIGFycltpbmRleCArIDFdKSkgfVxuICAgIHJldHVybiBsYXllclxuICB9LCBbXSlcbn1cblxuZnVuY3Rpb24gZ2V0TGF5ZXJzKGVsZW1lbnRzKSB7XG4gIGlmIChlbGVtZW50cy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBbWycnXV1cbiAgfVxuICBjb25zdCBsYXllcnMgPSBbXVxuICBsYXllcnMucHVzaChlbGVtZW50cylcbiAgd2hpbGUgKGxheWVyc1tsYXllcnMubGVuZ3RoIC0gMV0ubGVuZ3RoID4gMSkge1xuICAgIGxheWVycy5wdXNoKGdldE5leHRMYXllcihsYXllcnNbbGF5ZXJzLmxlbmd0aCAtIDFdKSlcbiAgfVxuICByZXR1cm4gbGF5ZXJzXG59XG5cbmZ1bmN0aW9uIGdldFByb29mKGluZGV4LCBsYXllcnMpIHtcbiAgcmV0dXJuIGxheWVycy5yZWR1Y2UoKHByb29mLCBsYXllcikgPT4ge1xuICAgIGxldCBwYWlyID0gZ2V0UGFpcihpbmRleCwgbGF5ZXIpXG4gICAgaWYgKHBhaXIpIHsgcHJvb2YucHVzaChwYWlyKSB9XG4gICAgaW5kZXggPSBNYXRoLmZsb29yKGluZGV4IC8gMilcbiAgICByZXR1cm4gcHJvb2ZcbiAgfSwgW10pXG59XG5cbmZ1bmN0aW9uIGdldFBhaXIoaW5kZXgsIGxheWVyKSB7XG4gIGxldCBwYWlySW5kZXggPSBpbmRleCAlIDIgPyBpbmRleCAtIDEgOiBpbmRleCArIDFcbiAgaWYgKHBhaXJJbmRleCA8IGxheWVyLmxlbmd0aCkge1xuICAgIHJldHVybiBsYXllcltwYWlySW5kZXhdXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5mdW5jdGlvbiBidWZUb0hleChlbGVtZW50KSB7XG4gIHJldHVybiBCdWZmZXIuaXNCdWZmZXIoZWxlbWVudCkgPyAnMHgnICsgZWxlbWVudC50b1N0cmluZygnaGV4JykgOiBlbGVtZW50XG59XG5cbmZ1bmN0aW9uIGJ1ZlNvcnRKb2luKC4uLmFyZ3MpIHtcbiAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoWy4uLmFyZ3NdLnNvcnQoQnVmZmVyLmNvbXBhcmUpKVxufVxuXG4iXX0=