/* eslint-disable no-irregular-whitespace */
/* eslint-disable-next-line no-undef */
/* eslint-env jquery, browser */               // https://eslint.org/docs/user-guide/configuring#specifying-environments
/* global sendTo, getEnums, common, systemLang, socket, values2table, table2values, M, _, instance */  // for eslint
/**
 * List of some global constants
 *
 * systemLang - 'en', 'de', 'ru', ect. // iobroker.admin/www/js/adapter-settings.js
 */


/**
 * ioBroker function explanation
 * onChange(boolean) - if set true, grayed out save button turns to blue and being activated, and vice versa if false
 * _(string) - the provided translation key will be translated into ioBroker's admin language (words.js)
 * 
 */

const adapterNamespace = `smartcontrol.${instance}`;

/**
 * Basic Constants
 */ 

// ++++++ Define option tables ++++++
const tableIds = [
    'tableTargetDevices', 
    'tableTargetEnums',
    'tableTargetURLs',
    'tableConditions', 
    'tableTriggerMotion', 
    'tableTriggerDevices', 
    'tableTriggerTimes', 
    'tableZones', 
];

const optionTablesSettings = {}; // Table variable holding the table settings array
for (const lpTableId of tableIds) {
    optionTablesSettings[lpTableId] = [];
}

/**
 * Enums
 */
const enums = {};


/** More Globals, being set once load() is called */
let g_settings; // To have globally the settings available.
const g_zonesTargetsOverwrite = {}; // { 'Hallway': {'Hallway.Light':'new val' 'Hallway.Radio':'Radio XYZ'} }, {'Bath Light': '33%'} }


/************************************************************************
 *** This is called by the admin adapter once the settings page loads ***
 ************************************************************************/
function load (settings, onChange) { /*eslint-disable-line no-unused-vars*/

    /**
     * 06-October-2020
     * Once load() is called, we need to get the enums, before we continue.
     * Quickly implemented with callbacks and call load2() once completed.
     * TODO: Do this more beautiful and with better performance, like with Promise.all() if supported by current browsers
     */
    getTargetEnums('rooms', (res)=> {
        if(res) {
            enums.rooms = res;
        } else {
            console.warn(`No room enumerations found, so you cannot select rooms in Targets > Enums`);
        }
        getTargetEnums('functions', (res)=>{
            if(res) {
                enums.functions = res;
            } else {
                console.warn(`No function enumerations found, so you cannot use Targets > Table 'Target Devices: Enums'.`);        
            }
            load2(settings, onChange);
        });
    });


}


function load2(settings, onChange) { 
    // Adapter Settings
    if (!settings) return;
    g_settings = settings;

    const adapterVersion = common.version;
    $('#tabMain span#adapter-version').html(adapterVersion);

    /**
     * Apply markdown for documentation through https://github.com/zerodevx/zero-md
     */

    // index_m.html: All ids defined in <zero-md> tags, like ['md-start', 'md-targetDevices', ...]
    const mdIds = $('zero-md[manual-render]').map((i, el) => el.getAttribute('id')).get(); // https://stackoverflow.com/a/54392415
    for (const mdId of mdIds) {

        const mdFilePath = $('zero-md#' + mdId).attr('src'); // like 'doc-md/start_en.md'
        if (mdFilePath) {
            
            if (systemLang !== 'en') { // English is always required
                const newFilePath = mdFilePath.slice(0, -5) + `${systemLang}.md`; // remove last 5 chars 'en.js' and add <lang>.js
                if (fileExists(newFilePath)) {
                    $('zero-md#' + mdId).attr('src', newFilePath); // set new file path src of <zero-md>                      
                } else {
                    // Fallback is English. We add a note to the HTML
                    $(`
                        <p class='translation-required'>
                            Your current ioBroker language is <strong>${systemLang.toUpperCase()}</strong>, however, the following instructions have not yet been translated into your language, so English is used as fallback.
                            If you are fluently speaking ${systemLang.toUpperCase()}, please help and translate into your language.
                            The English file is <a target="_blank" href="https://github.com/iobroker-community-adapters/ioBroker.smartcontrol/blob/master/admin/${mdFilePath}">located on Github</a>: <code>https://github.com/iobroker-community-adapters/ioBroker.smartcontrol/blob/master/admin/${mdFilePath}</code>.
                            Please translate and provide a Github pull request for adding a new file '${newFilePath}' with your ${systemLang.toUpperCase()} translation. Thank you!
                        </p>
                    `).insertBefore('zero-md#' + mdId);
                }
            }
        } else {
            console.warn(`load(): mdFilePath for '${mdId}' is undefined, so we use English.`);
        }

        // Finally, render zero-md - https://github.com/zerodevx/zero-md#public-methods
        // We add a slight delay, just in case
        setTimeout(() => {
            const el = document.querySelector('zero-md#' + mdId);
            if(el) el.render();
        }, 100);

    }

    /**
     * tableTargetEnums: set enum room and function names to drop down (multiple select) fields
     */
    if(enums.rooms) $('#tableTargetEnums *[data-name="enumRooms"]').data('options', enums.rooms.join(';'));
    if(enums.functions) $('#tableTargetEnums *[data-name="enumId"]').data('options', enums.functions.join(';'));

    /**
     * Set tableZones>targetsOverwrite to global variable
     */
    for (const lpZonesRow of settings['tableZones']) {
        const lpZoneName = lpZonesRow.name;
        if(!isLikeEmpty(lpZonesRow['targetsOverwrite'])) {   
            g_zonesTargetsOverwrite[lpZoneName] = lpZonesRow['targetsOverwrite'];
        }    
    }

    // This handles if the save button is clickable or not.
    // From Adapter Creator.
    $('.value').each(function() {
        const $key = $(this);
        const id = $key.attr('id');
        if (!id) {
            console.warn(`Attribute 'id' not found for $('.value')`);
        } else {
            if ($key.attr('type') === 'checkbox') {
                // do not call onChange direct, because onChange could expect some arguments
                $key.prop('checked', settings[id])
                    .on('change', () => onChange());
            } else {
                // do not call onChange direct, because onChange could expect some arguments
                $key.val(settings[id])
                    .on('change', () => onChange())
                    .on('keyup', () => onChange());
            }
        }
    });    

    // load fancytree for target device selection modal dialog
    fancytreeLoad('fancytree-select-settings');
   
    // ++++++ For option tables ++++++
    for (const lpTableId of tableIds) {
        optionTablesSettings[lpTableId] = settings[lpTableId] || [];
    }

    onChange(false);

    // ++++++ For option tables ++++++
    // values2table() - see iobroker/node_modules/iobroker.admin/www/js/adapter-settings.js
    const tTableIds = tableIds;
    tTableIds.push('tableZoneExecution'); // special dialog table
    for (const lpTableId of tableIds) {
        // x@ts-ignore - Ignore "An argument for 'maxRaw' was not provided."
        values2table(lpTableId, optionTablesSettings[lpTableId], onChange, function(){val2tableOnReady(lpTableId);});
    }

    /**
     * We call with values2table onReady parameter
     * @param {string} tableId - Table Id, like 'tableTriggerMotion', or blank string '' if nothing shall be executed
     */
    function val2tableOnReady(tableId) {

        switch (tableId) {
            case 'tableTargetDevices':
                statePathPopupSelection(tableId,'stateSelectPopupOnState', 'onState');
                statePathPopupSelection(tableId,'stateSelectPopupOffState', 'offState');                
                updateTableButtonIcons(tableId, [{dataButton:'stateSelectPopupOnState', icon:'search'},{dataButton:'stateSelectPopupOffState', icon:'search'}]);
                addCopyTableRowSmarter(tableId);
                break;
            case 'tableTargetEnums':
                addCopyTableRowSmarter(tableId);
                break;
            case 'tableTargetURLs':
                addCopyTableRowSmarter(tableId);
                break;
            case 'tableConditions':
                statePathPopupSelection(tableId,'stateSelectPopupConditionState', 'conditionState');               
                updateTableButtonIcons(tableId, [{dataButton:'stateSelectPopupConditionState', icon:'search'}]);
                addCopyTableRowSmarter(tableId);
                break;

            case 'tableTriggerMotion':
                statePathPopupSelection(tableId,'stateSelectPopupMotionState', 'stateId');
                statePathPopupSelection(tableId,'stateSelectPopupBriState', 'briStateId');          
                dialogSelectSettings({tableId:'tableTriggerMotion', triggerDataCmd:'motionSelectLinkedTrigger', targetField:'motionLinkedTrigger', dialogTitle:_('Select linked triggers') });
                updateTableButtonIcons(tableId, [{dataButton:'stateSelectPopupMotionState', icon:'search'},{dataButton:'stateSelectPopupBriState', icon:'search'}, {dataButton:'motionSelectLinkedTrigger', icon:'pageview'}]);
                addCopyTableRowSmarter(tableId);        
                break;

            case 'tableTriggerDevices':
                statePathPopupSelection(tableId,'stateSelectPopupStateId', 'stateId');    
                updateTableButtonIcons(tableId, [{dataButton:'stateSelectPopupStateId', icon:'search'}]);
                addCopyTableRowSmarter(tableId);
                otherTriggersShowHideUserStates(); 
                break;
            case 'tableTriggerTimes':
                dialogSelectSettings({tableId:'tableTriggerTimes', triggerDataCmd:'selectAdditionalConditions', targetField:'additionalConditions', dialogTitle:_('Select additional conditions') });
                dialogSelectSettings({tableId:'tableTriggerTimes', triggerDataCmd:'selectNever', targetField:'never', dialogTitle:_(`Select 'never if...'`) });
                updateTableButtonIcons(tableId, [{dataButton:'selectAdditionalConditions', icon:'pageview'},{dataButton:'selectNever', icon:'pageview'}]);
                addCopyTableRowSmarter(tableId);
                break;
            case 'tableZones':
                dialogSelectSettings({tableId:'tableZones', triggerDataCmd:'selectTriggers', targetField:'triggers', dialogTitle:_('Select triggers') });
                dialogSelectSettings({tableId:'tableZones', triggerDataCmd:'selectTargetsMenu', targetField:'targets', dialogTitle:_('Select target devices') });
                dialogSelectSettings({tableId:'tableZones', triggerDataCmd:'selectNeverOff', targetField:'neverOff', dialogTitle:_(`Select 'never switch off if...'`) });
                dialogConfigureZoneExecution();
                updateTableButtonIcons(tableId, [{dataButton:'selectTriggers', icon:'pageview'},{dataButton:'selectTargetsMenu', icon:'pageview'},{dataButton:'selectNeverOff', icon:'pageview'},{dataButton:'configureExecution', icon:'schedule', regularSize:true}]);
                addCopyTableRowSmarter(tableId);
                addInfo(tableId);
                break;
            case 'tableZoneExecution':
                dialogSelectSettings({tableId:tableId, triggerDataCmd:'selectAdditionalConditions', targetField:'additionalConditions', dialogTitle:_('Select additional conditions') });
                dialogSelectSettings({tableId:tableId, triggerDataCmd:'selectNever', targetField:'never', dialogTitle:_(`Select 'never switch on if...'`) });
                updateTableButtonIcons(tableId, [{dataButton:'selectAdditionalConditions', icon:'pageview'},{dataButton:'selectNever', icon:'pageview'}]);
                break;
            default:
                break;
        }


    }

    // Enhance Tabs with onTabShow-Function. Source: iQontrol Adapter.
    // This allows using JavaScript to perform certain actions as defined in function onTabShow(), since we have
    // several tabs in this adapter configuration.
    onTabShow('#tabMain');
    onTabShow('#tabDevices');
    onTabShow('#tabConditions');
    onTabShow('#tabTriggers');
    onTabShow('#tabZones');
    onTabShow('#tabSchedules');
    // --

    $('ul.tabs li a').on('click', function() { 
        onTabShow($(this).attr('href'));
    });
    function onTabShow(tabId){
        switch(tabId){

            case '#tabMain':
                $('.collapsible').collapsible(); // https://materializecss.com/collapsible.html
                break;

            case '#tabDevices':
                $('.collapsible').collapsible(); // https://materializecss.com/collapsible.html
                if(enums.rooms) $('#tableTargetEnums *[data-name="enumRooms"]').data('options', enums.rooms.join(';'));
                if(enums.functions) $('#tableTargetEnums *[data-name="enumId"]').data('options', enums.functions.join(';'));
                values2table('tableTargetEnums', optionTablesSettings['tableTargetEnums'], onChange, function(){val2tableOnReady('tableTargetEnums');});
                break;

            case '#tabConditions':
                $('.collapsible').collapsible(); // https://materializecss.com/collapsible.html
                break;

            case '#tabTriggers':
                $('.collapsible').collapsible(); // https://materializecss.com/collapsible.html
                populateTable('tableConditions', 'name', 'tableTriggerTimes', 'additionalConditions');
                populateTable('tableConditions', 'name', 'tableTriggerTimes', 'never');
                populateTable(['tableTriggerDevices'], ['name'], 'tableTriggerMotion', 'motionLinkedTrigger');
                break;

            case '#tabZones':
                $('.collapsible').collapsible(); // https://materializecss.com/collapsible.html
                populateTable(['tableTriggerMotion', 'tableTriggerDevices', 'tableTriggerTimes'], ['name', 'name', 'name'], 'tableZones', 'triggers');
                populateTable(['tableTargetDevices', 'tableTargetEnums', 'tableTargetURLs'], ['name', 'name', 'name'], 'tableZones', 'targets');
                populateTable('tableConditions', 'name', 'tableZones', 'neverOff');
                break;

        }
    }        

    function otherTriggersShowHideUserStates() {

        const jQueryStrCheckbox = `#tableTriggerDevices input[type="checkbox"][data-name="userState"]`;
        $(jQueryStrCheckbox).each(function() {
            doOrNot($(this));
        });
        
        $(jQueryStrCheckbox).on('change', function() {
            doOrNot($(this));
        });

        function doOrNot($checkbox) {

            const index = $checkbox.data('index'); // table row number which was clicked, starting at zero.                    
            const $stateField = $(`#tableTriggerDevices tr[data-index="${index}"] input[data-name="stateId"]`);

            if($checkbox.prop('checked') == true) {
                //checked
                $stateField.prev('div.userstates').remove(); // just in case
                $stateField.addClass('input-userstates');
                $stateField.before(`<div class="translate userstates">${_('State under')} ${adapterNamespace}.userstates. (${_('will be generated automatically')})</div>`);
            } else {
                //unchecked
                $stateField.removeClass('input-userstates');
                $stateField.prev('div.userstates').remove();
            }            

        }


    }


    /**
     * Populate select field
     * @param {*}  sourceTableIds   Id of input table, like "tableTriggerMotion". String or array of strings for multiple tables
     * @param {*}  sourceFieldIds   Id of table line field, from which to get content, like "name". . String or array of strings for multiple fields
     * @param {string}  targetTableId   Target table id, like "tableZones"
     * @param {string}  targetFieldId   Target table line field, like 'Test'
     * @param {boolean} [sort]    Optional: if true, values will be sorted
     * @param {boolean} [fill]    Optional: if true, table will be filled. Set to false for tableExecution
     */
    function populateTable(sourceTableIds, sourceFieldIds, targetTableId, targetFieldId, sort=false, fill=true) {

        // jQuery
        const jQ = `#${targetTableId} *[data-name="${targetFieldId}"]`;        

        if(!Array.isArray(sourceTableIds)) sourceTableIds = [sourceTableIds]; // wrap into array
        if(!Array.isArray(sourceFieldIds)) sourceFieldIds = [sourceFieldIds]; // wrap into array
        const result = [];

        for (let i = 0; i < sourceTableIds.length; i++) {
            const configTbl = settings[sourceTableIds[i]] || [];
            for (const lpElement of configTbl) {
                //if (lpElement['active'] == true) { // check for checkbox "active"
                result.push(lpElement[sourceFieldIds[i]]); 
                //}
            }
        }
        // Create dropdown menu
        if(sort) result.sort();
        $(jQ).data('options', result.join(';'));

        // Fill table
        if(fill) values2table(targetTableId, optionTablesSettings[targetTableId], onChange, function(){val2tableOnReady(targetTableId);});
        
    }

    
    const fieldChangeConfig = [
        {changedTableId:'tableTargetDevices', targetTableId:'tableZones', targetId:'targets'},
        {changedTableId:'tableTargetEnums', targetTableId:'tableZones', targetId:'targets'},
        {changedTableId:'tableTargetURLs', targetTableId:'tableZones', targetId:'targets'},
        {changedTableId:'tableConditions', targetTableId:'tableTriggerTimes', targetId:'additionalConditions'},
        {changedTableId:'tableConditions', targetTableId:'tableTriggerTimes', targetId:'never'},
        {changedTableId:'tableConditions', targetTableId:'tableZones', targetId:'neverOff'},
        {changedTableId:'tableTriggerMotion',  targetTableId:'tableZones', targetId:'triggers'},
        {changedTableId:'tableTriggerDevices', targetTableId:'tableZones', targetId:'triggers'},
        {changedTableId:'tableTriggerDevices', targetTableId:'tableTriggerMotion', targetId:'motionLinkedTrigger'},
        {changedTableId:'tableTriggerTimes',   targetTableId:'tableZones', targetId:'triggers'},
        {changedTableId:'tableTriggerTimes',   targetTableId:'tableTriggerMotion', targetId:'motionLinkedTrigger'},
    ];
    onTableRowNameChanges(fieldChangeConfig);
    /**
     * Handle all Table field changes of column "name":
     * Apply any name change (rename) to according tables using the name
     * For getting old field value, see https://stackoverflow.com/a/29118530
     * @param {array} fieldChangeConfig - Config array
     */
    function onTableRowNameChanges(fieldChangeConfig) {

       
        for (const lpConfig of fieldChangeConfig) {
            const jQueryName = `#${lpConfig.changedTableId} input.values-input[data-name="name"]`;
            // * Important - we cannot use //$(jQueryName).on('xxx') here. See https://stackoverflow.com/a/41457428
            // *             It is not recognized if populateTable() is executed for that specific table.
            // *             So we use $(document).on(), which works well.
            $(document).on('focusin', jQueryName, function(){ $(this).data('old-val', $(this).val()); });
            //$(jQueryName).on('change', function(){
            $(document).on('change',jQueryName, function() {
                const previousValue = $(this).data('old-val').trim();
                const newValue = $(this).val().trim();
                if (previousValue != newValue && newValue.length > 0) {
                    // We have a field change.
                    // Now let's change all values in according table and target field
                    for (let i = 0; i < g_settings[lpConfig.targetTableId].length; i++) {
                        const lpTargets = g_settings[lpConfig.targetTableId][i][lpConfig.targetId];
                        if (typeof lpTargets == 'string') {
                            // Handle string
                            if (lpTargets.trim() == previousValue.trim()) {
                                g_settings[lpConfig.targetTableId][i][lpConfig.targetId] = newValue;
                            }
                        } else {
                            // We have an array. Process targets accordingly.
                            for (let k = 0; k < lpTargets.length; k++) {
                                if (lpTargets[k].trim() == previousValue.trim()) {
                                    g_settings[lpConfig.targetTableId][i][lpConfig.targetId][k] = newValue;
                                }
                            }
                        }
    
                    }
                }
            });
        }
    }



    /**
     * For Table Filter
     */
    for (const lpId of tableIds) {

        // Initially hide 'clear filter button' since no filter is set at this time
        $(`div#${lpId} .table-filter button`).hide();

        // Apply the filter
        applyTableFilter(lpId);

        // Clear filters on "Clear Filters" button click
        $(`div#${lpId} .table-filter button`).click(function() {
            $(`div#${lpId} .table-filter input`).val(''); // empty field
            $(`div#${lpId} table`).find('tr:gt(0)').show(); // show all rows
            $(`div#${lpId} .table-filter button`).hide(); // hide button
        });

    }

    /**
     * Dialog: Configure Execution of Zone
     */
    function dialogConfigureZoneExecution() {

        const queryResult = $(`#tableZones a.values-buttons[data-command="configureExecution"]`);
        queryResult.on('click', function() {

            // Fill drop down (select) fields with additional conditions
            populateTable('tableConditions', 'name', 'tableZoneExecution', 'additionalConditions', false, false);
            populateTable('tableConditions', 'name', 'tableZoneExecution', 'never', false, false);

            // a few variables
            const tableZonesObj = table2values('tableZones');
            const rowNum = $(this).data('index'); // table row number which was clicked, starting at zero.
            //const zoneName = optionTablesSettings['tableZones'][rowNum]['name'];
            const zoneName = tableZonesObj[rowNum].name;

            const always = (tableZonesObj[rowNum].executeAlways) ? true : false;
            const tableSett = (tableZonesObj[rowNum].executionJson) ? JSON.parse(tableZonesObj[rowNum].executionJson) : [];

            // Prepare table and checkbox
            values2table('tableZoneExecution', tableSett, onChange, function(){val2tableOnReady('tableZoneExecution');});
            $('#dialog-configure-zone-execution #executeZoneAlways').prop('checked', always);

            // Initialize dialog (modal)
            initDialog('dialog-configure-zone-execution', dialogOkClose);
            
            // Hide detailed config if "Execute always" checkbox is checked
            const $jQueryRes = $('#dialog-configure-zone-execution #executeZoneAlways');

            if (always) {
                $('#dialog-configure-zone-execution .show-if-always').show();
                $('#dialog-configure-zone-execution .hide-if-always').hide();
            } else {
                $('#dialog-configure-zone-execution .show-if-always').hide();
                $('#dialog-configure-zone-execution .hide-if-always').show();
            }
            $jQueryRes.change(function(){
                if(this.checked) {
                    $('#dialog-configure-zone-execution .hide-if-always').fadeOut('slow');
                    setTimeout(()=> { $('#dialog-configure-zone-execution .show-if-always').fadeIn('slow'); }, 500);
                } else {
                    $('#dialog-configure-zone-execution .hide-if-always').fadeIn('slow');
                    $('#dialog-configure-zone-execution .show-if-always').hide();
                }
            });

            // Add Zone Name to title
            $('#dialog-configure-zone-execution span.zone-name').text(zoneName);

            // Open dialog
            $('#dialog-configure-zone-execution').modal('open');
                
            // Called once user clicked "Ok" in the dialog
            function dialogOkClose() {

                const tableResult = table2values('tableZoneExecution');

                tableZonesObj[rowNum].executeAlways = $('#dialog-configure-zone-execution #executeZoneAlways').prop('checked');
                tableZonesObj[rowNum].executionJson = JSON.stringify(tableResult);
                values2table('tableZones', tableZonesObj, onChange, function(){val2tableOnReady('tableZones');});
                
            }
            
        });
    }

    /**
     * info button for textual explanation of the object
     */
    function addInfo(tableId) {
        // set the icon
        updateTableButtonIcons(tableId, [{dataButton:'info', icon:'live_help'}]);
        // Apply info editor
        $(`#${tableId} table tbody td a.values-buttons[data-command="info"]`).on('click', function() { 
            const rowNum = $(this).data('index'); // table row number which was clicked, starting at zero.
            const tableArr = table2values(tableId);
            const actInfoText = tableArr[rowNum].infoText;
            
            $('#dialog-edit-info #infoText').prop('value', actInfoText);
            
            // Initialize dialog (modal)
            initDialog('dialog-edit-info', dialogOkClose);
            // Add Name to title
            $('#dialog-edit-info span.info-name').text(tableArr[rowNum].name);
            // Open dialog
            $('#dialog-edit-info').modal('open');
            
            // Called once user clicked "Ok" in the dialog
            function dialogOkClose() {
                onChange && onChange();
                tableArr[rowNum].infoText = $('#dialog-edit-info #infoText').prop('value');
                values2table(tableId, tableArr, onChange, function(){val2tableOnReady(tableId);});
            }
        });   
    }
    /**
     * We replace "copy table row" command from node_modules/iobroker.admin/www/js/adapter-settings.js
     * Reason: rename name functionality does not work any longer if name keeps the same, therefore 
     *         we add '_Copy' to name field of copied row.
     * @param {string} tableId - Table ID, like "tableTargetDevices"
     */
    function addCopyTableRowSmarter(tableId) {

        // Replace icon, reason: If 'data-buttons' in table th is not set to a known keyword (like 'edit'), it uses 'add' as materialize icon.
        updateTableButtonIcons(tableId, [{dataButton:'copy_smart', icon:'content_copy'}]);

        // Apply copy
        $(`#${tableId} table tbody td a.values-buttons[data-command="copy_smart"]`).on('click', function() { 

            const rowNum = $(this).data('index'); // table row number which was clicked, starting at zero.
            const tableArr = table2values(tableId);
            const elem = {... tableArr[rowNum] }; // Copy, so not referencing
            if (elem.name) elem.name = elem.name + '_Copy';
            
            // Add copied row below current row, of which the copy button was clicked
            //tableArr.splice(rowNum+1, 0, elem);
            tableArr.push(elem);  // push would add it at the end
            onChange && onChange();

            g_settings[tableId] = tableArr; // ? Seems to be important: without this, onTableRowNameChanges() will not work
            setTimeout(()=> {
                // Timeout is set in adapter-settings.js for copy - most likely for very good reasons, so we do as well.
                values2table(tableId, tableArr, onChange, function(){val2tableOnReady(tableId);});
            }, 100);
            

            // Activate save button
            //onChange(true);

        });   
    }


    /**
     * Dialog: Select Settings (like Triggers or Target Devices)
     * @param {object} given - like: {tableId:'tableZones', triggerDataCmd:'selectTargetsMenu', targetField:'targets', dialogTitle:'some title' }
     */
    function dialogSelectSettings(given) {

        const tableId = given.tableId;
        const triggerDataCmd = given.triggerDataCmd;
        const targetField = given.targetField;
        const dialogTitle = given.dialogTitle;

        const queryResult = $(`#${tableId} a.values-buttons[data-command="${triggerDataCmd}"]`);
        queryResult.on('click', function() {

            // A few variables
            let anyChange = false; // true if anything changed, i.e. either checkbox (de-)selected, or overwrite option val changed
            const rowNum = $(this).data('index'); // table row number which was clicked, starting at zero. data-index is also the row number starting at zero
            const dropDownAllOptions = getSelectOptions(`#${tableId} .values-input[data-name="${targetField}"][data-index="${rowNum}"]`, true);
            const dropDownSelectionArray = getSelectOptions(`#${tableId} .values-input[data-name="${targetField}"][data-index="${rowNum}"]`, false);
            const editTargetVals = (triggerDataCmd == 'selectTargetsMenu') ? true : false;

            // Set modal title
            $('#dialog-select-settings>.modal-content>.row>.col>h6.title').text(dialogTitle);

            // Initialize dialog (modal)
            initDialog('dialog-select-settings', dialogOkClose);
            
            // Hide explanation in dialog if editTargetVals is false
            if (!editTargetVals) $('#dialog-select-settings #fancy-explanation').hide();

            // Set current settings as source into FancyTree
            // If Target Device Selection, we set according zoneName
            const zoneName = (editTargetVals) ? (g_settings.tableZones[rowNum].name) : undefined; // like "Relax Area"
            $('#fancytree-select-settings').fancytree('option', 'source', convertToFancySource(dropDownAllOptions, dropDownSelectionArray, zoneName));

            /**
             * Sort nodes
             */
            // Folders first. To deactivate folders first: set variable "cmp" to null to deactivate. // https://stackoverflow.com/a/22638802
            const cmp=function(a, b) {
                const x = (a.isFolder() ? '0' : '1') + a.title.toLowerCase();
                const y = (b.isFolder() ? '0' : '1') + b.title.toLowerCase();
                return x === y ? 0 : x > y ? 1 : -1;
            };
            const node = $.ui.fancytree.getTree('#fancytree-select-settings').getRootNode();
            node.sortChildren(cmp, true);

            // Open dialog
            $('#dialog-select-settings').modal('open');
                
            // Called once user clicked "Ok" in the dialog
            function dialogOkClose() {

                const tree = $.ui.fancytree.getTree('#fancytree-select-settings');
                const allFancyNodes = tree.getRootNode().findAll('');
                const selectedFancyNodes = tree.getSelectedNodes();
                const zoneName = g_settings['tableZones'][rowNum]['name']; // Current Zone Name

                for (const lpNode of allFancyNodes) {
                    if(!lpNode.children) { // We just need end nodes
                        // If title has {xxx} at the end, we retrieve xxx
                        const matches = lpNode.title.match(/{(.+)}$/);
                        if (matches && matches[1] && matches[1].length > 0) {
                            if (isLikeEmpty(g_zonesTargetsOverwrite) || isLikeEmpty(g_zonesTargetsOverwrite[zoneName])) {
                                g_zonesTargetsOverwrite[zoneName] = {}; // Add key with empty object
                            }
                            // Add to global variable, e.g. '{'Bath.Mirror.Light':'20%'}'
                            if ( isLikeEmpty(g_zonesTargetsOverwrite[zoneName][lpNode.key])
                                || ( !isLikeEmpty(g_zonesTargetsOverwrite[zoneName][lpNode.key]) 
                                     && g_zonesTargetsOverwrite[zoneName][lpNode.key] != matches[1] ) )
                            {
                                g_zonesTargetsOverwrite[zoneName][lpNode.key] = matches[1]; 
                                anyChange = true;
                            }

                        } else {
                            // Remove from global variable
                            if (!isLikeEmpty(g_zonesTargetsOverwrite)
                                && !isLikeEmpty(g_zonesTargetsOverwrite[zoneName])
                                && !isLikeEmpty(g_zonesTargetsOverwrite[zoneName][lpNode.key]))
                            {
                                delete g_zonesTargetsOverwrite[zoneName][lpNode.key];
                                anyChange = true;
                            }
                        }
                    }
                }


                const selectedKeys = [];
                for (const selectedNode of selectedFancyNodes) {
                    selectedKeys.push(selectedNode.key);

                }

                // check if selected nodes actually changed
                if (!arraysEqual(dropDownSelectionArray, selectedKeys)) anyChange = true;

                /**
                 * Finally: Set to option tables, also to ensure materialize select field is being updated, save button is available, etc.
                 */
                if (anyChange) {

                    // Option tables
                    if (tableId == 'tableZoneExecution') {
                        const tableExecObj = table2values(tableId);
                        tableExecObj[rowNum][targetField] = selectedKeys;
                        values2table(tableId, tableExecObj, onChange, function(){val2tableOnReady(tableId);});                        
                    } else {
                        optionTablesSettings[tableId][rowNum][targetField] = selectedKeys;
                        values2table(tableId, optionTablesSettings[tableId], onChange, function(){val2tableOnReady(tableId);});
                    }

                    // Activate save button
                    onChange(true);

                }
                
            }
            
        });
    }

    // From ioBroker Adapter Creator:
    // Re-initialize all the Materialize labels on the page if you are dynamically adding inputs.
    // @ts-ignore - Property 'updateTextFields' does not exist on type 'typeof M'.ts(2339)
    if (M) M.updateTextFields(); 


} // load


/**
 * Save Options - Called by the admin adapter when the user clicks save
 * @param {function} callback(settingsObject) - callback function containing the settings object to be saved.
 */
async function save(callback) { /*eslint-disable-line no-unused-vars*/

    try {
        
        /**
         * Select elements with class=value and build settings object
         * (from Adapter Creator)
         */ 
        let obj = {};
        $('.value').each(function() {
            const $this = $(this);
            if ($this.attr('type') === 'checkbox') {
                obj[$this.attr('id')] = $this.prop('checked');
            } else {
                obj[$this.attr('id')] = $this.val();
            }
        });

        // Set Option Table values
        for (const tableId of tableIds) {
            obj[tableId] = table2values(tableId);      
        }

        // Set g_zonesTargetsOverwrite
        // ! Must be after setting the Option Table Values
        for (let i = 0; i < obj['tableZones'].length; i++) {

            // get g_zonesTargetsOverwrite value for zone row
            const overwriteObject = g_zonesTargetsOverwrite[obj['tableZones'][i]['name']]; // Like {'Hallway.Light':'new val' 'Hallway.Radio':'Radio XYZ'}
            if (overwriteObject && !isLikeEmpty(overwriteObject)) {
                obj['tableZones'][i]['targetsOverwrite'] = overwriteObject;
            } else {
                delete obj['tableZones'][i]['targetsOverwrite'];
            }

        }

        /*****************************
         * Input Validation
         * We use sendTo() to use adapter's node.js code for validation.
         *****************************/

        let verifyConfigResultObj = undefined;
        let errors = [];

        // Adapter must be alive
        const aliveStateObj = await getStateAsync(`system.adapter.${adapterNamespace}.alive`);
        if (aliveStateObj == null) throw(`'getStateAsync(${adapterNamespace}.alive)' returned error.`);
        if (aliveStateObj && aliveStateObj.val) {
            // Adapter is alive, so verify the config.
            verifyConfigResultObj = await sendToAsync('verifyConfig', obj);
            if (verifyConfigResultObj == null) throw(`'sendToAsync('verifyConfig', obj)' returned null`);
            if (verifyConfigResultObj.passed) {
                console.debug(`Verifying Config: successfully passed.`);
                // Low priority (nice to have) enhancement idea: we may want to also update configuration by refreshing all tabs / tables.
                // set the altered object
                // obj = objResult.obj;
            } else {
                errors = verifyConfigResultObj.issues;
                console.warn(`Verifying Config: failed!`);
            }

        } else {
            // Adapter is NOT alive
            errors = [`Adapter instance ${adapterNamespace} is not running, so we cannot verify the configuration and cannot save your changes. Please turn the adapter instance on. Hint: To not lose your changes, keep this browser window/tab open, open ioBroker in a new browser window/tab, turn the adapter instance on, and try again to save the changes.`];
        }

        if(errors.length === 0) {
            // Finally, save settings by calling callback function and provide the settings object
            callback(obj);
        } else {
            // Errors occurred, so do not save settings but provide dialog with the errors
            let errorHtml = '<ol>\n';
            for (const errorEntry of errors) {
                errorHtml += `<li>${errorEntry}</li>`;
            }
            errorHtml += '\n</ol>';
            // open error dialog
            $('#dialog-save-verification #save-errors').html(errorHtml);
            $('#dialog-save-verification').modal();
            $('#dialog-save-verification').modal('open'); 
        }

    } catch (error) {
        console.error(`[save()] - ${error}`);
        return;
    }


}


/**
 * Promise Wrapping:
 * async sendTo 
 * Mic - 25-Nov-2020
 * @param {string} cmd - Command
 * @param {object} obj - Object
 * @return {Promise<object|null>}
 */
function sendToAsync(cmd, obj) {
    return new Promise((resolve, reject) => {
        sendTo(adapterNamespace, cmd, obj, (result) => {
            if (result.error) {
                console.error('sendToAsync(): ' + result.error);
                reject(null);
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Promise Wrapping:
 * async getState
 * Mic - 01-Dec-2020
 * @param {string} id - state id
 * @return {Promise<object|null>} state object, or null if error
 */
function getStateAsync(id) {
    return new Promise((resolve, reject) => {
        socket.emit('getState', id, (err, stateObj) => {
            if (err) {
                console.error('getStateAsync(): ' + err);
                reject(null);
            } else {
                resolve(stateObj);
            }
        });
    });
}


/**
 * Update Table Button Icons
 * If 'data-buttons' in table th is not set to a known keyword (like 'edit'), it uses 'add' as materialize icon.
 * We modify this icon by replacing 'add' with an icon of our choice: https://materializecss.com/icons.html
 * 
 * @param {string}  tableId -      Table ID, like "tableTargetDevices"
 * @param {array}   iconsConfArr - [{dataButton:'xyz', icon:'search'}, {data-button:'abc', icon:'add', regularSize:true}];
 */
function updateTableButtonIcons(tableId, iconsConfArr) {

    for (const lpIconObj of iconsConfArr) {
        $(`#${tableId} table tbody td a.values-buttons[data-command="${lpIconObj.dataButton}"] i.material-icons:contains('add')`).each(function() {
            const text = $(this).text().replace('add', lpIconObj.icon);
            $(this).text(text);
        });
        if (lpIconObj.regularSize) {
            // replace .btn-small with .btn to change icon to regular size
            const $query = $(`#${tableId} table tbody td a.values-buttons[data-command="${lpIconObj.dataButton}"].btn-small`);
            $query.addClass('btn').removeClass('btn-small');
        }
    }

}




/*************************************************************
 * Table Filter
 * Inspired by: https://github.com/mjansma/LiveSearch/livesearch.js
 * @param {string} id - like 'tableTargetDevices'
 *************************************************************/
function applyTableFilter(id) {
    $(`div#${id} .table-filter input`).keyup(function() {
    //$(this).keyup(function() {
        const table = $('div#' + id + ' table');
        //Get all table columns
        const children = table.find('td');
        const searchString = $(this).val().toLowerCase();

        if (searchString.length < 1) {

            $(`div#${id} .table-filter button`).hide(); // hide filter button
            table.find('tr:gt(0)').show(); // show all if search string is too short
            return;

        } else {

            $(`div#${id} .table-filter button`).show(); // show filter button since we have 2+ chars in filter

            //Hide all rows except the table header
            table.find('tr:gt(0)').hide();

            //Loop through all table columns
            children.each(function(index, child){
                //If search string matches table column
                let checkFor;
                if (child.firstChild && child.firstChild.firstChild && child.firstChild.firstChild.value) {
                    checkFor = child.firstChild.firstChild.value; // we have a drop down
                } else if (!checkFor && child.firstChild && child.firstChild.value && child.firstChild.value != '' && child.firstChild.value != 'on') {
                    checkFor = child.firstChild.value;
                }
                if (checkFor && checkFor.toLowerCase().indexOf(searchString) != -1) {
                    $(child).closest('tr').show(); //Show table row
                }
            });
        }

    });
}

/**
 * From: selectID.js (node_modules/iobroker.admin/www/lib/js/)
 * Name "dialog-select-member" is important, because for that exist the CSS classes
 * Important to have "admin/img/big-info.png", because this icon will be loaded if no icon found, otherwise we have endless loop
 */
let selectId;
function initSelectId (cb) {
    if (selectId) return cb ? cb(selectId) : selectId;
    socket.emit('getObjects', function (err, res) {
        if (!err && res) {
            selectId = $('#dialog-select-member').selectId('init',  {
                noMultiselect: true,
                objects: res,
                imgPath:       '../../lib/css/fancytree/',
                filter:        {type: 'state'},
                name:          'adapter-select-state',
                texts: {
                    select:          _('Select'), 
                    cancel:          _('Cancel'),
                    all:             _('All'),
                    id:              _('ID'),
                    name:            _('Name'),
                    role:            _('Role'),
                    room:            _('Room'),
                    value:           _('Value'),
                    selectid:        _('Select state'),
                    from:            _('From'),
                    lc:              _('Last changed'),
                    ts:              _('Time stamp'),
                    wait:            _('Processing...'),
                    ack:             _('Acknowledged'),
                    selectAll:       _('Select all'),
                    unselectAll:     _('Deselect all'),
                    invertSelection: _('Invert selection')
                },
                columns: ['image', 'name', 'role', 'room']
            });
            cb && cb(selectId);
        }
    });
}

/**
 * Opens the dialog for state selection.
 * Using selectID.js (node_modules/iobroker.admin/www/lib/js/)
 * It monitors a button for a click, and writes the selected state into a field.
 *
 * @param {string}  tableId     - The id of the table, like 'tableTargetDevices'
 * @param {string}  dataCommand - Name of [data-buttons="edit1"] of the <th>. so like 'edit1'.
 *                                If you use multiple buttons per table row, use like 'edit1', 'edit2' for 'data-buttons=' in <th>
 * @param {string}  targetField - The target field, like 'onState' (of data-name="onState")
 */
function statePathPopupSelection(tableId, dataCommand, targetField) { 
    
    const queryResult = $(`#${tableId} a.values-buttons[data-command="${dataCommand}"]`);
    queryResult.on('click', function() {
        const id = $(this).data('index');
        initSelectId(function (sid) {
            sid.selectId('show', $(`#${tableId} .values-input[data-name="${targetField}"][data-index="${id}"]`).val(), function (statePath) {
                if (statePath) {
                    // We have a selected state, so let's fill the target field
                    $(`#${tableId} .values-input[data-name="${targetField}"][data-index="${id}"]`).val(statePath).trigger('change');
                }
            });
        });
    });

}



/**
 * Initializes a dialog (materialize Modal)
 * 
 * @source iQontrol adapter
 * 
 * @param {string} id - id of Modal, like 'dialog-select-settings'
 * @param {*} callback - callback function.
 */
function initDialog(id, callback) {
    const $dialog = $('#' + id);
    if (!$dialog.data('isInitialized')) {
        $dialog.data('isInitialized', true);
        $dialog.modal({
            dismissible: false
        });

        $dialog.find('.btn-set').on('click', function () {
            const $dialog = $('#' + $(this).data('dialogId'));
            const callback = $dialog.data('callback');
            if (typeof callback === 'function') callback();
            $dialog.data('callback', null);
        });
    }
    $dialog.find('.btn-set').data('dialogId', id);
    $dialog.data('callback', callback);
}


/**
 * To be called in load() function of index_m.html / index_m.js 
 * @param {string} fancytreeId - like 'fancytree-select-settings' for #fancytree-select-settings
 */
function fancytreeLoad(fancytreeId) {

    $(`#${fancytreeId}`).fancytree({
        checkbox: true,
        checkboxAutoHide: undefined, // Display check boxes on hover only
        extensions: ['filter', 'edit'],
        quicksearch: true,
        filter: {
            autoApply: true,   // Re-apply last filter if lazy data is loaded
            autoExpand: true, // Expand all branches that contain matches while filtered
            counter: true,     // Show a badge with number of matching child nodes near parent icons
            fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
            hideExpandedCounter: true,  // Hide counter badge if parent is expanded
            hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
            highlight: true,   // Highlight matches by wrapping inside <mark> tags
            leavesOnly: false, // Match end nodes only
            nodata: false,      // Display a 'no data' status node if result is empty
            mode: 'hide'       // 'dimm' to gray out unmatched nodes, 'hide' to remove unmatched node instead)
        },        

        edit: {
            // Available options with their default:
            adjustWidthOfs: 4,   // null: don't adjust input size to content
            inputCss: { minWidth: '3em' },
            triggerStart: ['f2', 'dblclick', 'shift+click', 'mac+enter'],
            beforeEdit: function(event, data){
                if (data.node.children) return false; // Return false to prevent edit mode for folders (i.e. if nodes having children)
                if (!data.node.data.overwriteTargets) return false; // Go out if we do not want to overwrite / set new target values
            },
            edit: function(event, data){        // Editor opened (available as data.input)
                
                // Some additional HTML/CSS
                $('input.fancytree-edit-input').addClass('browser-default');
                $('input.fancytree-edit-input').before(`<span>${data.node.key.split('.').pop()} - ${_('overwrite options')}: {</span>`);
                $('input.fancytree-edit-input').after(`<span>}</span>`);

                const newVal = data.input.val();
                const matches = newVal.match(/{(.+)}$/);
                if (matches && matches[1] && matches[1].length > 0) {
                    $('input.fancytree-edit-input').val(matches[1]);
                } else {
                    $('input.fancytree-edit-input').val('');
                }
            },

            save:  $.noop,
            beforeClose: $.noop,

            // We handle all in close.
            close: function(event, data) {
                const key = data.node.key; // key, like "Bath.Lights.Mirror Light"
                const nodeTitle = key.split('.').pop(); // like 'Mirror Light'                
                const newVal = data.node.title; // the new value which the user entered
                if (!newVal || newVal.length < 1) {
                    data.node.setTitle(nodeTitle);
                } else if (newVal.startsWith(nodeTitle)) {
                    // to avoid result like Mirror Light {Mirror Light}
                    data.node.setTitle(nodeTitle);
                } else {
                    // Set node title like 'Mirror Light {20%}'
                    data.node.setTitle(`${nodeTitle} {${newVal}}`);
                }
            },

        },


        selectMode: 2,         // 1:single, 2:multi(limited to actual selected items), 3:multi-hierarchy (will also select parent items)
        source: [], // We set this later
      
        activate: function(event, data) {
            $('#statusLine').text(event.type + ': ' + data.node);
        },

        strings: {
            //loading: 'Loading&#8230;',
            //loadError: 'Load error!',
            //moreData: 'More&#8230;',
            noData: 'No hits',
        }

    });

    

    /**********************
     * Event handlers
     **********************/
    const tree = $.ui.fancytree.getTree(`#${fancytreeId}`);

    //https://wwwendt.de/tech/fancytree/doc/jsdoc/jquery.fancytree.edit.js.html

    /**
     * Collapse/Expand All - Event Handler
     */
    $('a#fancy-expand-all').click(function() {
        tree.visit(function(node){ node.setExpanded(); });
    });
    $('a#fancy-collapse-all').click(function() {
        tree.visit(function(node){ node.setExpanded(false); });
    });

    /**
     * Search - Event Handler
     */
    $('input[name=search]').on('keyup', function(e){

        const tree = $.ui.fancytree.getTree();
        const match = $(this).val();

        if(e && e.which === $.ui.keyCode.ESCAPE || $.trim(match) === ''){
            $('button#btnResetSearch').click();
            return;
        }

        // Get matches
        const filterFunc = tree.filterBranches; // filterBranches = match whole branches, filterNodes = nodes only
        const n = filterFunc.call(tree, match);
        $(`label[for='fancy-filter-input']`).text(`(${n} Treffer)`);

        // Enable "reset search" button
        $('button#btnResetSearch').attr('disabled', false);


    }).focus();    
      
    $('button#btnResetSearch').click(function(){
        $('input[name=search]').val('');
        $(`label[for='fancy-filter-input']`).text('');
        tree.clearFilter();
        $('button#btnResetSearch').attr('disabled', true);
    });

    $('fieldset input:checkbox').change(function() {
        const id = $(this).attr('id');
        const flag = $(this).is(':checked');
      
        // Some options can only be set with general filter options (not method args):
        switch( id ){
            case 'counter':
            case 'hideExpandedCounter':
                tree.options.filter[id] = flag;
                break;
        }
        tree.clearFilter();
        $('input[name=search]').keyup();
    });
}

/**
 * tableTargetEnums: Get lists of enum room and function names to set to drop down (multiple select) fields for selection
 * @param {string} enumType - 'rooms' for rooms, and 'functions' for functions
 * @param {function} callback - callback function
 * @return {object} callback with array of enum room names or enum function names, or null if nothing found
 */
function getTargetEnums(enumType, callback) {

    getEnums(enumType, (error, enumObj)=> {
        if (!error && enumObj) {
            const enumIds = [];
            for (const id in enumObj) {
                const nameObj = enumObj[id].common.name; // either string like 'Living room' or {en:'Living room', de:'Wohnzimmer', ...}
                if (typeof nameObj === 'string') {
                    enumIds.push(nameObj);
                } else if (typeof nameObj === 'object') {
                    enumIds.push(nameObj[systemLang]);
                } else {
                    console.warn(`Getting enum ${(enumType=='rooms'?'room':'function')} name for '${id}': type for name must be string or object, but is '${typeof nameObj}'.`);
                }
            }
            if (!isLikeEmpty(enumIds)) {
                return callback(enumIds.sort());
            } else {
                console.warn(`No enum ${enumType} found.`);
                return callback(null);
            }
        } else {
            if (error) {
                console.error(`getTargetEnums(${enumType}) - error: ${error}`);
                return callback(null);
            } else {
                console.error(`getTargetEnums(${enumType}) - blank object was returned, so could not get ${enumType}.`);
                return callback(null);
            }
        }
    });

}


/**
 * Converts array of dotted strings to FancyTree source format.
 * 
 * @param {array} allDottedStrings - array of ALL dotted strings, like: ['Bath.Radio.on', 'Bath.Light', 'Hallway']
 * @param {array} selectedDottedStrings - array of SELECTED dotted strings, like: ['Hallway']
 * @param {string} [zoneName=undefined] - set Zone Name if you want to add target values.
 * @return {array|null}       Array for FancyTree source - https://github.com/mar10/fancytree/wiki/TutorialLoadData
 */
function convertToFancySource(allDottedStrings, selectedDottedStrings, zoneName=undefined) {

    try {

        /**
         * First: Prepare array of objects, example:
         *     [
         *      {"key":"Bath.Radio.on","title":"on", , parent:"Bath.Radio", selected:false},
         *      {"key":"Bath.Radio","title":"Radio", parent:"Bath"},
         *      {"key":"Bath","title":"Bath"},
         *      {"key":"Bath.Light","title":"Light", parent:"Bath", selected:false},
         *      {"key":"Hallway","title":"Hallway", selected:false}
         *     ]
         */
        const objectArray = [];

        for (const lpDottedStr of allDottedStrings) {

            // Like {'Hallway.Light':'new val' 'Hallway.Radio':'Radio XYZ'}
            const targetsToOverwrite = (zoneName) ? g_zonesTargetsOverwrite[zoneName] : undefined; 
            
            const dottedArr = lpDottedStr.split('.');
            for (let i = dottedArr.length-1; i > -1; i--) {
                const resObj = {};

                // get id of looped value, like "Bath.Radio", if i==1, or "Bath.Radio.on" of i==2
                let resId = '';
                for (let k = 0; k <= i; k++) {
                    if (k > 0) resId = resId + '.';
                    resId = resId + dottedArr[k];
                }
                resObj.key = resId;

                // Skip if key value is already in any array object
                if (objectArray.some( (elem)=> elem.key === resId)) continue;

                // Title - 'Bath.Radio.on' -> 'on' if i=2
                resObj.title = dottedArr[i]; 


                // If overwrite targets: add flag to easily identify
                if (zoneName) {
                    resObj.overwriteTargets = true; // to easily identify.
                }                
                
                // If overwrite targets: Change the node title of each end node accordingly
                if (zoneName && (i == dottedArr.length -1)) {
                    if (targetsToOverwrite && !isLikeEmpty(targetsToOverwrite[lpDottedStr])) {
                        resObj.title = `${resObj.title} {${targetsToOverwrite[lpDottedStr]}}`;
                    }
                }

                // Always expand all nodes if selected by adding "expanded:true" to selected ones.
                if (selectedDottedStrings.indexOf(lpDottedStr) != -1) {
                    resObj.expanded = true;
                }

                // Check box for selected ones, but only to end nodes (last level)
                if (i == dottedArr.length -1) {
                    resObj.selected = (selectedDottedStrings.indexOf(lpDottedStr) != -1) ? true : false;
                } else {
                    resObj.checkbox = false; // https://wwwendt.de/tech/fancytree/demo/sample-select.html
                }
                
                // Add parent id
                if (i > 0) {
                    resObj.parent = resObj.key.substr(0, resObj.key.lastIndexOf('.')); // 'Bath.Radio' for 'Bath.Radio.on'
                }

                objectArray.push(resObj);

            }
        }

        /**
         * Next, convert to final FancyTree source.
         * @source (modified accordingly) - https://github.com/mar10/fancytree/wiki/TutorialLoadData#howto-load-data-from-a-flat-parent-referencing-list
         */

        const nodeMap = {};


        // Pass 1: store all tasks in reference map
        for(const lpVal of objectArray) {
            nodeMap[lpVal.key] = lpVal;
        }


        // Pass 2: adjust fields and fix child structure
        let parent;
        let mappedArray = objectArray.map( function (value) {

            // Check if value is a child node
            if( value.parent ) {
                // add value to `children` array of parent node
                parent = nodeMap[value.parent];
                if (!parent) throw('Unexpected error: No parent found.');
                parent.folder = true;
                if(parent.children ) {
                    parent.children.push(value);
                } else {
                    parent.children = [value];
                }
                return null;  // Remove value from childList
            }
            return value;  // Keep top-level nodes
        });
        mappedArray = mappedArray.filter(val => val != null);

        // Pass 3: sort children by 'title'
        for(const lpVal of mappedArray) {
            if( lpVal && lpVal.children && lpVal.children.length > 1 ) {
                lpVal.children.sort(function(a, b){
                    return ((a.title < b.title) ? -1 : ((a.title > b.title) ? 1 : 0));
                });
            }
        }
        return mappedArray;


    } catch (error) {
        console.error(`[convertToFancySource] - ${error}`);
        return null;
    }

}



/*
██████   ███████ ███    ██ ███████ ██████  ██  ██████          ██ ███████ 
██       ██      ████   ██ ██      ██   ██ ██ ██               ██ ██      
██   ███ █████   ██ ██  ██ █████   ██████  ██ ██               ██ ███████ 
██    ██ ██      ██  ██ ██ ██      ██   ██ ██ ██          ██   ██      ██ 
 ██████  ███████ ██   ████ ███████ ██   ██ ██  ██████      █████  ███████ 
Generic JS Functions
*/


/**
 * Checks if 2 arrays have the same values
 * [2, 4] and [4, 2] is considered equal
 * 
 * @param {array} arr1 - first array
 * @param {array} arr2 - second array
 * @return {boolean}  - true or false
 */
function arraysEqual(arr1, arr2) {

    if (!Array.isArray(arr1) || ! Array.isArray(arr2) || arr1.length !== arr2.length) {
        return false;
    }

    const fArr1 = arr1.concat().sort();
    const fArr2 = arr2.concat().sort();

    for (let i = 0; i < fArr1.length; i++) {
        if (fArr1[i] !== fArr2[i]) {
            return false;
        }
    }

    return true;

}

/**
 * Get (all) options of a Select dropdown
 * https://stackoverflow.com/a/7760197
 * @param {string}  jQuery       - the jQuery string, like '#selectBox'
 * @param {boolean} [all=false]  - true: get all option items, false: just get selected option items
 * 
 */
function getSelectOptions(jQuery, all=false) {
    if (!all) {
        return $(jQuery).val();
    } else {
        const options = $(`${jQuery} option`);
        const values = $.map(options, function(option) {
            return option.value;
        });
        return values;
    }
}


/**
 * Checks if Array or String is not undefined, null or empty.
 * Array, object, or string containing just white spaces or >'< or >"< or >[< or >]< is considered empty
 * 18-Jun-2020: added check for { and } to also catch empty objects.
 * 08-Sep-2019: added check for [ and ] to also catch arrays with empty strings.
 * @param  {any}  inputVar   Input Array or String, Number, etc.
 * @return {boolean} True if it is undefined/null/empty, false if it contains value(s)
 */
function isLikeEmpty(inputVar) {
    if (typeof inputVar !== 'undefined' && inputVar !== null) {
        let strTemp = JSON.stringify(inputVar);
        strTemp = strTemp.replace(/\s+/g, ''); // remove all white spaces
        strTemp = strTemp.replace(/"+/g, '');  // remove all >"<
        strTemp = strTemp.replace(/'+/g, '');  // remove all >'<
        strTemp = strTemp.replace(/\[+/g, '');  // remove all >[<
        strTemp = strTemp.replace(/\]+/g, '');  // remove all >]<
        strTemp = strTemp.replace(/\{+/g, '');  // remove all >{<
        strTemp = strTemp.replace(/\}+/g, '');  // remove all >}<
        if (strTemp !== '') {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
}

/**
 * Checks if a file exists
 * Source: https://stackoverflow.com/a/58344215
 * @param url {string} path to file
 * @return {boolean} true if file exists, false if not
 */
function fileExists(url) {
    const http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}

