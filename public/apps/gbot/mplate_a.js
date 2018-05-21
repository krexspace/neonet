let mplate_a = {}

mplate_a.onClickExec = ()=>{
    let cmd = $('#ctl_command_input').val();
    let payload = { cmd: cmd };
    mplate_a.exec(payload);
}

mplate_a.exec = (payload)=>{
    gkernel.pushTo_COMM_BUS_CENTRAL(payload);
}