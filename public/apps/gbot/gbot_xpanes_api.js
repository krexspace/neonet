'use strict'
/*------------------------------------------------------
XPANES is the GUI API for GBOT
It is based on display ports and decorators
-------------------------------------------------------*/
let xpanes_map = {
}

let xpanes = {};

// =============================
// DISPLAY PORT 
// =============================
xpanes.pushTo_XPBUS_RECVHUB = function(data, dtype) {
    l.trace('[XPBUS_RECVHUB] received data type:', dtype);
    // Determine the display port based on data type
    switch(dtype) {
        case 'str': 
        xpanes.pushStringData(data, 'DISP_PORT_MSG');
        break;
        case 'json':
        if(data.view_id) {
            switch(data.view_id) {
                case 'node_graph':
                openGridsterPane(data);
                break;
                default:
                xpanes.pushJSONData(data, 'DISP_PORT_MSG');
                break;
            }
        }
        break;
        case 'list':
        xpanes.pushListData(data, 'DISP_PORT_A');
        break;
        case 'err':
        xpanes.pushStringData(data, 'DISP_PORT_MSG');
        break;
    }
}
xpanes.pushListData = function(list_data, displayPort) {
    l.trace('[pushListData]',list_data);
    if(!xpanes_map[displayPort]) {
        xpanes.buildAndDisplayNewPane(displayPort)
    }
    let pane = xpanes_map[displayPort];
    xpanes.appendData(list_data, pane);
}
xpanes.pushStringData = function(str, displayPort) {
    l.trace('[pushStringData]',str);
    if(!xpanes_map[displayPort]) {
        xpanes.buildAndDisplayNewPane(displayPort)
    }
    let pane = xpanes_map[displayPort];
    xpanes.appendStringData(str, pane);
}
xpanes.pushJSONData = function(json, displayPort) {
    l.trace('[pushJSONData]',json);
    if(!xpanes_map[displayPort]) {
        xpanes.buildAndDisplayNewPane(displayPort)
    }
    let pane = xpanes_map[displayPort];
    xpanes.appendJSONData(json, pane);
}

// === end DISPLAY PORT ==== //

xpanes.appendStringData = function(str, pane) {
     l.trace('[appendStringData]',str);
     let d = $('<div class="block_t1"></div>');
     d.text(str);
     pane.prepend(d);
}
xpanes.appendJSONData = function(json, pane) {
     l.trace('[appendJSONData]',json);
     let ta = $('<textarea rows=20 cols=100></textarea>');
     let d = $('<div class="block_t1"></div>');
     d.append(ta);
     ta.val(JSON.stringify(json, null, 2));
     pane.prepend(d);
}

xpanes.buildAndDisplayNewPane = function(displayPort) {
    let p = $('<div class="pane_l1"></div>');
    $('.cbox_holder_a').append(p);
    xpanes_map[displayPort] = p;
    return p;
}

xpanes.removePane = function(displayPort) {
    // jquery remove
    xpanes_map[displayPort].remove();
    // remove from map
    delete xpanes_map[displayPort];
}

xpanes.removeAllPanes = function() {
    for(let k in xpanes_map) {
        xpanes.removePane(k);
    }
}

xpanes.appendData = function(list_data, pane) {
    l.trace('[appendData]',list_data);
    if(list_data && list_data.length === 0) {
        let d = $('<div class="block_t1">No records found</div>');
        pane.prepend(d);
    } else {
        for(let k in list_data) {
            xpanes.decorateAndDisplayRecord(list_data[k], pane);
        }
    }
}

xpanes.decorateAndDisplayRecord = function(rec, pane) {
    let d = $('<div class="block_t1"></div>');
    if(rec.title) {
        d.append(xpanes.makeLabel(rec.title));
        xpanes.makeBlankLine();
    }
    if(rec.nid) {
        d.append(xpanes.makeLabel('nid: ' + rec.nid));
    }
    if(rec.type) {
        d.append(xpanes.makeLabel('type: ' + rec.type));
    }
    if(rec.kwds) {
        d.append(xpanes.makeLabelList('keywords: ', rec.kwds));
    }
    pane.prepend(d);
}

xpanes.makeBlankLine = function() {
    return $('<BR>');
}
xpanes.makeLabel = function(text) {
    return $('<div class="label_t1"></div>').text(text);
}

xpanes.makeLabelList = function(header, arr) {
    let str = '';
    for(let k in arr) {
        str += arr[k];
        if(k < (arr.length - 1)) str += ',';
    }
    return $('<div class="t1_label"></div>').text(header + str);
}

// ==========================================
// GRIDSTER DEPENDENT
//============================================
var graphCounter = 0;
function openGridsterPane(data) {
    ++graphCounter;
    gridster.add_widget(`<li class="g_outer"><div class="g_inner gtest_c${graphCounter}"></div></li>`, 2, 2, 1, 1);
    var elem = $(`.gtest_c${graphCounter}`);
    console.log('openGridsterPane', data);
    createGraph(elem, graphCounter + 'g', data);
}