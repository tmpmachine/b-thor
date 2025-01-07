/* v4.3 */
function DialogFactory(
    opt = {
        dialogDataModifier: null,
        onShow: null,
        onBeforeClose: null,
    }
) {
    // # self
    let SELF = {
        Show_,
        Refresh,
        Close,
        GetOptions: () => local.options,
        GetDialog: () => local.dialogEl,
        SetOptions,
    };

    // # local
    let local = {
        options: opt.options ?? {},
        dialogEl: null,
        dialogData: null,
        dialogOptions: {
            src: opt.src,
            template: opt.template,
            templateSelector: opt.templateSelector,
            onClose: (dialogEl) => readDialogEdit(dialogEl),
            onBeforeClose: async (dialogEl) => await validateDialogEdit(dialogEl),
        },
        // # dom events, # events
        eventsMap: opt.eventsMap ?? {},
    };

    // # function

    function Configure(opt) {

    }

    function Close() {
        local.dialogEl?.close();
    }

    function SetOptions(options) {
        for (let key in options) {
            local.options[key] = options[key];
        }
    }

    function getDialogEditFormData(dialogEl) {
        let form = dialogEl.querySelector("form");
        if (!form) return new FormData();

        let formData = new FormData(form);
        return utils?.FormDataToObject?.(formData);
    }

    async function validateDialogEdit(dialogEl) {
        if (opt.onFormValidate) {
            return await opt.onFormValidate(dialogEl);
        }
        return true;
    }

    async function readDialogEdit(dialogEl) {
        let formData = getDialogEditFormData(dialogEl);
        let returnValue = dialogEl.returnValue;

        opt.onBeforeClose?.(dialogEl);

        local.dialogEl = null;
        local.dialogData = null;

        return {
            ...formData,
            returnValue,
        };
    }

    function Refresh() {
        opt.onShow?.(local.dialogData);
    }

    // # show, # build
    async function Show_(formValuesObject = {}, extraParams, callback) {
        let formData = await windog.showDialogAsync(
            local.dialogOptions,
            function onshown(dialogEl) {
                let form = dialogEl.querySelector("form");
                let dialogData = {
                    dialogEl,
                    form,
                    extraParams,
                    formValuesObject,
                };

                local.dialogEl = dialogEl;
                local.dialogData = dialogData;

                if (local.eventsMap) {
                    local.eventsMap.onclick = {
                        ...local.eventsMap.onclick,
                        "close-dialog": () => dialogEl.close(),
                    };
                }

                if (typeof (DOMEvents) != 'undefined') {
                    DOMEvents?.Listen(local.eventsMap, dialogEl);
                }
                if (typeof (utils) != 'undefined') {
                    utils?.FillFormWithData?.(form, formValuesObject);
                }
                opt.dialogDataModifier?.(dialogData);
                opt.onShow?.(dialogData);
                callback?.(dialogData);
            }
        );

        return formData;
    }

    return SELF;
}