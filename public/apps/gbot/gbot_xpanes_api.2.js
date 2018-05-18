'use strict'
/*------------------------------------------------------
XPANES is the GUI API for GBOT
It is based on display ports and decorators

@dependensies: Jquery, Bootstrap 3, Gridster
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
                displayGraphView(data);
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
    //if(!xpanes_map[displayPort]) {
        xpanes.buildAndDisplayNewPane(displayPort)
    //}
    let pane = xpanes_map[displayPort];
    xpanes.appendData(list_data, pane);
}
xpanes.pushStringData = function(str, displayPort) {
    l.trace('[pushStringData]',str);
    //if(!xpanes_map[displayPort]) {
        xpanes.buildAndDisplayNewPane(displayPort)
    //}
    let pane = xpanes_map[displayPort];
    xpanes.appendStringData(str, pane);
}
xpanes.pushJSONData = function(json, displayPort) {
    l.trace('[pushJSONData]',json);
    //if(!xpanes_map[displayPort]) {
        xpanes.buildAndDisplayNewPane(displayPort)
    //}
    let pane = xpanes_map[displayPort];
    xpanes.appendJSONData(json, pane);
}

// === end DISPLAY PORT ==== //

xpanes.appendStringData = function(str, pane) {
     l.trace('[appendStringData]',str);
     let d = $('<div class="block_t1"></div>');
     d.text(str);
     pane.find('.xp_pane_content').prepend(d);
}
xpanes.appendJSONData = function(json, pane) {
     l.trace('[appendJSONData]',json);
     let ta = $('<textarea rows=20 cols=100></textarea>');
     let d = $('<div class="block_t1"></div>');
     d.append(ta);
     ta.val(JSON.stringify(json, null, 2));
     pane.find('.xp_pane_content').prepend(d);
}

xpanes.buildAndDisplayNewPane = function(displayPort) {
    //let p = $('<div class="pane_l1"></div>');
    let p = $(`<div class="panel panel-default gbot_panel">
    <div class="panel-body xp_pane_content"></div>
  </div>`);
    $('.cbox_holder_a').append(p);
    
    p.append(gu_buildStdCloseButton('.gbot_panel'));
    
    xpanes_map[displayPort] = p;
    return p;
}

xpanes.removePort = function(displayPort) {
    // jquery remove
    xpanes_map[displayPort].remove();
    // remove from map
    delete xpanes_map[displayPort];
}

xpanes.removeAllPanes = function() {
    for(let k in xpanes_map) {
        xpanes.removePort(k);
    }
}

xpanes.appendData = function(list_data, pane) {
    l.trace('[appendData]',list_data);
    if(list_data && list_data.length === 0) {
        let d = $('<div class="block_t1">No records found</div>');
        pane.find('.xp_pane_content').prepend(d);
    } else {
        var list_elem = $('<ul class="gbot_list_body list-group"></ul>');
        pane.prepend(list_elem);
        for(let k in list_data) {
            xpanes.decorateAndDisplayRecord(list_data[k], list_elem);
        }
    }
}

xpanes.decorateAndDisplayRecord = function(rec, list_elem) {
    let d = $('<li class="list-group-item"></li>');
    let desc_box = $('<dl class="dl-horizontal gbot_dl"></dl>');
    if(rec.title) {
        desc_box.append(xpanes.makeLabel('title', rec.title));
        xpanes.makeBlankLine();
    }
    if(rec.nid) {
        desc_box.append(xpanes.makeLabel('nid', rec.nid));
    }
    if(rec.type) {
        desc_box.append(xpanes.makeLabel('type', rec.type));
    }
    if(rec.kwds) {
        desc_box.append(xpanes.makeLabelList('kwds', rec.kwds));
    }
    d.append(desc_box);
    list_elem.append(d);
}

xpanes.makeBlankLine = function() {
    return $('<BR>');
}

//TOD rename
xpanes.makeLabel = function(header, val) {
    return $(`<dt class="gbot_dt">${header}</dt><dd class="gbot_dd">${val}</dd>`);
}

xpanes.makeLabelList = function(header, arr) {
    let str = '';
    for(let k in arr) {
        str += arr[k];
        if(k < (arr.length - 1)) str += ',';
    }
    return $(`<dt class="gbot_dt">${header}</dt><dd>${str}</dd>`);
}

var graphCounter = 0;
function displayGraphView(data) {
    ++graphCounter;
    var crow = $('<div class="row" id="gbot_graph_box_row"></div>');
    var ccol = $('<div class="col-lg-12 gbot_graph_box"></div>');
    
    var clbutton = gu_buildStdCloseButton('#gbot_graph_box_row');
    
    crow.append(ccol);
    crow.append(clbutton);
    $('#gbot_central_container').prepend(crow);
    createGraph(ccol, graphCounter + 'g', data);
}