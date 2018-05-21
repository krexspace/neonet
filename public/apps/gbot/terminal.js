let mplate_a = {}

mplate_a.onClickExec = ()=>{
    let cmd = $('#ctl_command_input').val();
    let payload = { cmd: cmd };
    mplate_a.exec(payload);
}

mplate_a.exec = (payload)=>{
    gkernel.pushTo_COMM_BUS_CENTRAL(payload);
}

mplate_a.processResults = (cmd, resp) => {
    let data = JSON.stringify(resp.data?resp.data:resp, null, 2);
    var item = $('<pre></pre>').html(data);
    
    let target = $('#cbox_result_view');
    target.prepend(item);
}
