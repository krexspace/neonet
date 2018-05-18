/*----------------------------------------------------------------------
GBOT KERNEL core functionality
Controls the execution of commands, flow of data - in and out.
Its architecture is based on protocols, commands, command buses and ports
----------------------------------------------------------------------*/

var gkernel = {};
gkernel.init = function() {
    // INIT COMMAND TEXTBOX
    $('#txt_command_in_p1').focus();
    gu_enableKeyboardSupport('#txt_command_in_p1', gkernel.on_terminalCommandEntered);
}

gkernel.on_terminalCommandEntered = function(jq_elem, val) {
    l.debug('[on_terminalCommandEntered]', val);
    gkernel.mirror_commands_toTerminal(val);
    if(jq_elem) jq_elem.val('');
    gkernel.pushTo_COMMBUS_DHUB(val);
}

// mirror commands to command view box on enter or exec
gkernel.mirror_commands_toTerminal = function(txt) {
    var COMMAND_BUF_MAX = 10;
    $('#cbox_command_view').append($('<div class="cmd_line"></div>').text(txt));
    if($('#cbox_command_view').children().length > COMMAND_BUF_MAX) {
        $('#cbox_command_view').children().first().remove();
    }
}

//sdf adsfd -kw:fasd,sdf,asdf,asdf -desc:sdgf  sdgfdghggg sdfs
gkernel.parseCommandString = function(str) {
    var cur_key;
    var state = 0;
    var cmd = [];

    if(str.endsWith('$') || str.endsWith('`')) {

    }
    // Defaults to '-' else can use ` or $ if command is terminated with that char
    const CMD_KEY_CHAR = str.endsWith('$') || str.endsWith('`')?str.slice(-1):'-';
    var dash_pos = str.indexOf(CMD_KEY_CHAR);
    
    // parse the words before the first dash
    // no white spaces allowed in words
    var parseCmdHead = function(str_1) {
         var arr = str_1.split(' ');
        //l.out(arr);
        var j = 0;
        for(var i in arr) {
            // Empty strings and command sep chars are ignored
            if(arr[i] != '' && arr[i] != '`' && arr[i] != '$' && arr[i] != '-') {
                cmd[j++] = arr[i];
            }
        }
        //l.out(cmd);
    };
    //var c_buf = [];
    var extractNextPair = function(s) {
        var colon_pos = s.indexOf(':');
        var key = s.substring(1,colon_pos);
        //l.out(key);
        var colon_pos = s.indexOf(':');
        var next_dash_pos = s.indexOf(CMD_KEY_CHAR,2);
        //l.out(next_dash_pos, colon_pos);
        if(next_dash_pos < 0) {
            var value = s.substring(colon_pos + 1);
            
            var attr = {};
            attr[key] = value;
            //l.out(attr);
            cmd.push(attr);
            
            // stop extraction, no further attrs
        } else {
            var value = s.substring(colon_pos + 1, next_dash_pos-1);
            var attr = {};
            attr[key] = value;
            cmd.push(attr);
            var s2 = s.substring(next_dash_pos);
            
            // continue extraction recursively
            extractNextPair(s2);
        }
    };
    // parse the string after the first dash
    // Expects key value pairs.
    var parseCmdTail = function(str_1) {
        //l.out(str_1);
        extractNextPair(str_1);
    };
    if(dash_pos < 0) {
        // now attribs, simple command, just split by spaces
       parseCmdHead(str);
    } else {
       var head = str.substring(0,dash_pos-1);
       parseCmdHead(head);
       parseCmdTail(str.substring(dash_pos));
    }

    return cmd;
}

// ======================================
//      MAIN BUS and PORT METHODS
// ======================================
gkernel.pushTo_COMMBUS_DHUB = function(payload) {
    l.trace("[COMMBUS_DHUB]", "dispatch hub received command:", payload); 
    gkernel.addToCommandHistory(payload);
    
    var cmd = gkernel.parseCommandString(payload);
    var fe_cmd = gkernel.pushTo_COMMBUS_SCREEN(cmd);
    // Not a local command, send to remote bus
    if(!fe_cmd) {
        gkernel.pushTo_COMMBUS_REMOTEMAIN(cmd);
    }
}

gkernel.pushTo_COMMBUS_REMOTEMAIN = function(cmd) {
    l.trace("[COMMBUS_REMOTEMAIN]", "remote cmd:", cmd); 
    gkernel.transmitRemoteCommand(cmd, function(resp) {
        gkernel.pushTo_COMMBUS_RECVHUB(cmd, resp);
    });
}

// Display ports are initiated here
gkernel.pushTo_COMMBUS_RECVHUB = function(cmd, resp) {
    l.trace("[COMMBUS_RECVHUB] received resp:", resp);

    // Check response structure and determine type
    if(resp.err && resp.err === true) {
        xpanes.pushTo_XPBUS_RECVHUB(resp.msg,'err');
        return;
    }
    if(resp.list && Array.isArray(resp.list))
        xpanes.pushTo_XPBUS_RECVHUB(resp.list, 'list');
    if(resp.obj)
        xpanes.pushTo_XPBUS_RECVHUB(resp.obj,'json');
    if(resp.val)
        xpanes.pushTo_XPBUS_RECVHUB(resp.val,'str');
}

gkernel.pushTo_COMMBUS_SCREEN = function(cmd) {
    const LOG_TRACER_ID = '[COMMBUS_SCREEN]';
  
    var head  = cmd[0];
    var tail  = cmd.length>1 && cmd[1]?cmd[1]:null;
    
    if(tail && screen_commands[head + '_' + tail]) {
        // You can submit a front end command in _ mode 
        // or split mode: 'clear_results' or 'clear results'
        l.trace(LOG_TRACER_ID,'Detected screen command: executing ...');
        screen_commands[head + '_' + tail](cmd);
        
        return true;
    } else if(screen_commands[head]) {
        // NB: tail mode takes priority
        screen_commands[head](cmd);
        l.trace(LOG_TRACER_ID,'Detected screen command: executing ...');
        return true;
    } else {
        l.trace(LOG_TRACER_ID,'NOT a screen command: passing on');
        return false;
    }
}

//==========================================
//      COMMAND PROCESSOR
//==========================================
var cmd_history = [];
var cmd_index = -1;
var screen_commands = {
    cl_console: function() {
        $('#cbox_command_view').children().remove();
    },
    cl_history: function() {
        cmd_history = [];
        cmd_index = -1;
    },
    cl_results: function() {
        xpanes.removeAllPanes();
    }
};

// Font end command aliases
screen_commands.cl_r = screen_commands.clear_results;
screen_commands.cl_h = screen_commands.clear_history;
screen_commands.cl_c = screen_commands.clear_console;
screen_commands.cl = function() {
    screen_commands.cl_console();
    screen_commands.cl_history();
    screen_commands.cl_results();
};

gkernel.addToCommandHistory = function(str) {
    cmd_history.push(str);
    if(cmd_history.length > 20) {
        delete cmd_history[0];
    }
    cmd_index = cmd_history.length-1;
}

gkernel.fetchLastCommand = function() {
    if(cmd_index < 0) return '';
    
    var cmd = cmd_history[cmd_index];
    if(cmd_index == 0) cmd_index = cmd_history.length-1;
    else --cmd_index;
    return cmd;
}

gkernel.fetchNextCommand = function() {
    if(cmd_index < 0) return '';
    
    if(++cmd_index == cmd_history.length) {
        cmd_index = 0;
    }
    return cmd_history[cmd_index];
}

//=============================================
//              COMMAND IO                   
//=============================================
gkernel.transmitRemoteCommand = function(cmd, cb) {
    l.trace("[transmitRemoteCommand]","Transmitting..", cmd);

   var dataPayload = {data: cmd, sid: 534545}
   $.ajax({
           type: "post",
           url: "/graph",
           dataType: 'json',
           data: JSON.stringify(dataPayload),
           contentType:'application/json;charset=UTF-8',
           success: function(msg) {
               if (msg) {
                   cb(msg);
               } else {
                   l.out("Error calling remote!");
               }
           },
           strictSSL:false,
           error: function(XMLHttpRequest, textStatus, errorThrown) {
            l.out("Error calling graph server: " + JSON.stringify(XMLHttpRequest));
           }
       });
}