Enter here all target devices you want to switch as soon as a trigger is activated and the conditions in the zones are met.

*Why are there different states for switching on and off?*
Normally these are the same (states expect `true`/`false`) for switching on/off, but in certain cases users may need a different state and state value to switch a device on or off. For example: fully-tablet-control.0.device.tablet_bathroom.commands.screenOn and fully-tablet-control.0.device.tablet_bathroom.commands.screenOff.
You can also add states that are not boolean (`true`/`false`), but string or number.

For each table row this adapter adds linked states to `smartcontrol.x.targetDevices.xxx`. If you change these states, the original target state is changed accordingly, and vice versa.

| Column | Mandatory | Description |
|----------|:------------:|-------|
| ![image](https://github.com/iobroker-community-adapters/ioBroker.smartcontrol/blob/master/admin/doc-md/img/check_box-24px.svg?raw=true) |  Yes   | Enables/disables this table row. If not activated, this table row is ignored by the adapter. In the Adapter Options, under 'FURTHER OPTIONS > Input Validation', you can set that even disabled rows are checked for validity. |
| Device name | Yes   | Name of the device of your choice. Forbidden characters: ``[ ] * , ; ' " ` < > \ ?`` |
| State to switch device on | Yes | States of the target device to switch on as soon as a trigger is triggered and the conditions in the zones are met. |
| Value for 'on' | Yes | States value that is set in 'states to switch on'. You can use `true`, `false`, numbers like `144`, or strings like `Turn on radio`. All spaces and quotation marks (like `"`) at the beginning and end are automatically removed. <br><br>The value can be overwritten under "4. ZONES", "Target devices". |
| Do not verify (on) | No | Before switching, it is always verified if the target device is already on according to "Value for 'on'". Activating this option disables this verification, and switching is always done. Use case: e.g. a button as a state. See [Github Issue #5](https://github.com/Mic-M/ioBroker.smartcontrol/issues/5). |
| State to switch device off | Yes | states of the target device to switch off as soon as a timeout has been reached (e.g. no more motion and the motion sensor seconds have counted down to 0) or if the 'smartcontrol.x.targetDevices.xxx.[Device Name]` state has been changed. |
| Value for 'off' | Yes | States value to be set in 'Switch off state'. You can use `true`, `false`, numbers like `144`, or strings like `turn radio on`. All spaces and quotation marks (like `"`) at the beginning and end are automatically removed.|
| ![image](https://github.com/iobroker-community-adapters/ioBroker.smartcontrol/blob/master/admin/doc-md/img/timelapse-24px.svg?raw=true)|  Nein   | **Delay for switching target device on (in seconds)** This allows you to set a delay: after this number of seconds the target device will actually be switched on.<br>Leave empty or set `0` to ignore this option. |
| Do not verify (off) | No | See *Value for 'on'* above, bot for switching off, and not on. |


