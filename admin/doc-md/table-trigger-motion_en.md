Here you can enter your motion sensors. You can also optionally define brightness states and according thresholds.

| Column | Mandatory | Description |
|----------|:------------:|-------|
| ![image](https://github.com/iobroker-community-adapters/ioBroker.smartcontrol/blob/master/admin/doc-md/img/check_box-24px.svg?raw=true) |  Yes   | Enables/disables this table row. If not activated, this table row is ignored by the adapter. In the Adapter Options, under 'FURTHER OPTIONS > Input Validation', you can set that even disabled rows are checked for validity. |
| Name of motion sensor | Yes | Any name for the motion sensor.
| State of motion sensor | Yes | State of the motion sensor. It is expected that this state is boolean, so set to `true` when there is movement and to `false` when there is no movement, which is the case with almost all motion sensors. If your motion sensor states are different, please use aliases. See [forum discussion](https://forum.iobroker.net/post/492267). |
| Sec | No | After this number of seconds (and no further motion detected in the meantime), the target devices will be turned off.<br>To disable: Leave blank or set to 0.<br>Further info: As soon as the motion sensor states is set to `false`, i.e. no more motion is detected any longer, a timer starts with the seconds specified here. After these seconds have elapsed, the target devices defined in the respective zone(s) will be switched off. If a new motion occurs (motion sensor state to `true`) while the timer is running, the timer will be cleared and the target devices will remain on.
| (icon: timer off) | No | If this option is enabled, no off timer will be set for the target devices that were already on. Use case: [see forum post](https://forum.iobroker.net/post/433871).|

### Optional: Brightness (Lux)

| Column | Mandatory | Description |
|----------|:------------:|-------|
| State of brightness | No | state that reflects the current brightness.|
| Threshold | No | Threshold value for the brightness. If the current brightness of 'State of brightness' is greater than this number, the motion is ignored.<br>Please also note the option *Do not verify brightness if zone is on* under 'FURTHER OPTIONS > Motion sensors'.|


### Optional: Linked devices

| Column | Mandatory | Description |
|----------|:------------:|-------|
| Linked triggers | No | Here you can select "Other triggers"; these will trigger the corresponding zone in the same way as the motion sensor.<br>Create the trigger under "Other triggers" in the table below, and add this new trigger in "Motion sensor" under "Linked triggers". <br><br>*Example use-case:* When a wall switch is turned on, the light should go off after x seconds, provided there is no movement (example: a corridor with a smart wall switch, and a motion sensor in the corridor). If there is motion, the timer of the wall switch is deleted and the motion sensor timer takes effect.<br><br>**Note:** If you have just created "Other triggers" and they do not appear here immediately, switch to another tab and back again to this tab (or save and close the adapter instance and open it again).|
| Sec | No | For "Linked triggers": Enter the number of seconds after which the zone will switch off if no motion detected and if a "Linked trigger" has triggered the switch on. <br>*Note:* You can set this number of seconds separately here (and the adapter will not take the "Sec" from above), because this number of seconds from above only takes effect when the motion sensor detects no more motion, and this takes 2 minutes for Xiaomi devices, for example. So you can set a different time here.
| ✖ | No | For "Linked triggers": If activated, the zone is turned on only by "Linked triggers" (e.g. wall switches), but never by the motion sensor. This means that the device is not switched on when there is motion detected. But if the zone is switched on by a wall switch (set in "Linked devices") and there is a motion detected before switching off, the zone will be switched off as soon as there is no more motion. See [Issue #42](https://github.com/Mic-M/ioBroker.smartcontrol/issues/42) for details.