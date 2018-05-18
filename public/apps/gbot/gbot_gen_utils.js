'use strict'
// logging
var l ={
    out: function(str) {
        console.log.apply(this, arguments);
    },
    debug: function(str) {
        console.log.apply(this, arguments);
    },
    trace: function(str) {
        if(true) console.log.apply(this, arguments);
    }  
}

function gu_enableKeyboardSupport(jq_sel, cb) {
    $(jq_sel).keydown(function (e){
        switch(e.keyCode) {
            // ENTER
            case 13:
                cb($(jq_sel), $(jq_sel).val()); 
                return false;
                break;
            // UP Arrow
            case 38:
                var cmd = gkernel.fetchLastCommand();
                $(jq_sel).val(cmd);
                return false;
                break;
            // Down Arrow
            case 40:
                var cmd = gkernel.fetchNextCommand();
                $(jq_sel).val(cmd);
                return false;
                break;
            // ESCAPE
            case 27:
                $(jq_sel).val('');
                return false;
                break;
        }
    });
}

function gu_execCommandString(cmd_str) {
    gkernel.on_terminalCommandEntered(null, cmd_str);
}

var gu_exec = gu_execCommandString;

// Slowly remove any element by id
// @prodx
function gu_close_by_id(id, delayParam) {
    var $target = $('#' + id);
    $target.hide(delayParam?delayParam:'slow', function(){ $target.remove(); });
}
// @prodx
function gu_close_by_parentSelector(this_elem, jqSel, delayParam) {
    var $target = $(this_elem).parents(jqSel);
    $target.hide(delayParam?delayParam:'slow', function(){ $target.remove(); });
}


// UI component factory methods //

// returns jq elem
// @prodx
function gu_buildStdCloseButton(parentSel, align) {
    if(!align) align = 'right';
    return $(`<div style="text-align:${align}"><a class="btn btn-primary btn-sm" href="#" onclick="gu_close_by_parentSelector(this,\'${parentSel}\')" role="button">Close</a></div>`);
}