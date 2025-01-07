// # settings
let dialogSettings = DialogFactory({
    src: 'html/dialog-templates.html',
    templateSelector: '._dialogSettings',
    onShow: ({dialogEl}) => preferences.RestoreSettings(dialogEl),
    eventsMap: {
        onclick: {
            'clear-data': () => ui.confirmClearData(),
            'set-git-token': () => ui.setGitToken(),
        },
        onchange: {
            'apply-config': (evt) => preferences.ApplyCheckboxSettings(evt),
        }
    },
});

// # account
let dialogAccount = DialogFactory({
    src: 'html/dialog-templates.html',
    templateSelector: '._dialogAccount',
});