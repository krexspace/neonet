'use strict'
var gridster;

$(function () { //DOM Ready
    gkernel.init();

    gridster = $(".gridster ul").gridster({
        widget_margins: [10, 10],
        widget_base_dimensions: [500, 500]
    }).data('gridster');

    setTimeout(function() {
      gu_close_by_id('gbot_ad1');
    }, 3000)
});

//----------VIZ GRAPH DEMO----------------//
function transfromGraphData(input) {
  let out_nodes = [];
  let out_edges = [];
  for(var node of input.nodes) {
    out_nodes.push({id: node, label: node});
  }
  for(var conn of input.conns) {
    out_edges.push({from: conn.src, to: conn.dest});
  }
  return {nodes:out_nodes, edges: out_edges};
}

var seed = 2;
var graph_map = {
}
function destroy(graph_id) {
    if(graph_map[graph_id]) {
        graph_map[graph_id].destroy();
        graph_map[graph_id] = null;
        delete graph_map[graph_id];
    }
}

function createGraph(containerJQElem, graph_id, gdata) {
  let data = transfromGraphData(gdata);
  destroy(graph_id);

  // create a network
  var container = containerJQElem.get(0);
  var options = {
    nodes: {
        shape: 'box',
        color: {background:'#eeaa99', border:'#ffbb00'}
    },
    layout: {randomSeed:seed}, // just to make sure the layout is the same when the locale is changed
    /*physics: {
        "barnesHut": {
          "avoidOverlap": 0.8
        }
      },*/
    manipulation: {
      addNode: function (data, callback) {
        // filling in the popup DOM elements
        document.getElementById('operation').innerHTML = "Add Node";
        document.getElementById('node-id').value = data.id;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = clearPopUp.bind();
        document.getElementById('network-popUp').style.display = 'block';
      },
      editNode: function (data, callback) {
        // filling in the popup DOM elements
        document.getElementById('operation').innerHTML = "Edit Node";
        document.getElementById('node-id').value = data.id;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
        document.getElementById('network-popUp').style.display = 'block';
      },
      addEdge: function (data, callback) {
        if (data.from === data.to) {
          var r = confirm("Do you want to connect the node to itself?");
          if (r === true) {
            callback(data);
          }
        }
        else {
          callback(data);
        }
      }
    }
  };
  graph_map[graph_id] = new vis.Network(container, data, options);
}

function clearPopUp() {
  document.getElementById('saveButton').onclick = null;
  document.getElementById('cancelButton').onclick = null;
  document.getElementById('network-popUp').style.display = 'none';
}

function cancelEdit(callback) {
  clearPopUp();
  callback(null);
}

function saveData(data, callback) {
  data.id = document.getElementById('node-id').value;
  data.label = document.getElementById('node-label').value;
  clearPopUp();
  callback(data);
}
//--end graph demo--//