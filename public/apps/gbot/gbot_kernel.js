/*----------------------------------------------------------------------
GBOT KERNEL core functionality
Controls the execution of commands, flow of data - in and out.
Its architecture is based on protocols, commands, command buses and ports
----------------------------------------------------------------------*/

var gkernel = {};

// mirror commands to command view box on enter or exec
gkernel.mirror_commands_toTerminal = (txt)=>{
    var COMMAND_BUF_MAX = 10;
    $('#cbox_command_view').append($('<div class="cmd_line"></div>').text(txt));
    if($('#cbox_command_view').children().length > COMMAND_BUF_MAX) {
        $('#cbox_command_view').children().first().remove();
    }
}

// ======================================
//      MAIN BUS and PORT METHODS
// ======================================
gkernel.pushTo_COMM_BUS_CENTRAL = (payload)=>{
    l.trace("[COMM_BUS_CENTRA]", "dispatch hub received command:", payload); 
    gkernel.addToCommandHistory(payload);
    
    var cmd = payload;
    //var fe_cmd = gkernel.pushTo_COMMBUS_SCREEN(cmd);
    // Not a local command, send to remote bus
    //if(!fe_cmd) {
    gkernel.pushTo_COMMBUS_REMOTE_TRANS(cmd);
    //}
}

gkernel.pushTo_COMMBUS_REMOTE_TRANS = (cmd)=>{
    l.trace("[COMMBUS_REMOTE_TRANS]", "remote cmd:", cmd); 
    gkernel.fireRemoteCommand(cmd, function(resp) {
        gkernel.pushTo_COMM_BUS_REMOTE_RECEIVE(cmd, resp);
    });
}

// Display ports are initiated here
gkernel.pushTo_COMM_BUS_REMOTE_RECEIVE = (cmd, resp)=>{
    l.trace("[COMM_BUS_REMOTE_RECEIVE] received resp:", resp);
    // TODO make generic
    mplate_a.processResults(cmd, resp);
}

gkernel.pushTo_COMMBUS_SCREEN = (cmd)=>{
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
gkernel.fireRemoteCommand = function(cmd, cb) {
   l.trace("[fireRemoteCommand]","Transmitting..", cmd);

   var dataPayload = cmd;
   $.ajax({
           type: "post",
           url: "/thea_api",
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
            l.out("Error calling Thea server: " + JSON.stringify(XMLHttpRequest));
           }
       });
}